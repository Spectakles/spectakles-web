"""Real Firebase emulator checks. Opt in explicitly; never use a cloud project.

GD_TEST_FIREBASE_EMULATORS=1 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 python -m unittest tests.test_firebase_platform
"""
from dataclasses import replace
import json
import os
from pathlib import Path
import tempfile
import time
from types import SimpleNamespace as NS
import unittest
from uuid import uuid4

import httpx
from fastapi import HTTPException
from fastapi.testclient import TestClient
from firebase_admin import auth

from browser_backend.contracts import default_settings
from browser_backend.firebase_platform import FirebasePlatform
from browser_backend.main import create_app
from tests.discussion_fakes import PanelFactory


@unittest.skipUnless(os.environ.get('GD_TEST_FIREBASE_EMULATORS') == '1', 'Local Firebase emulators are opt-in')
class FirebaseTests(unittest.TestCase):
    def setUp(self):
        self.platform = FirebasePlatform('demo-spectakles', emulator=True)
        self.users = []
        self.owner, self.owner_token = self.account('Owner')
        self.student, self.student_token = self.account('Student')
        self.stranger, self.stranger_token = self.account('Stranger')
        self.organization = self.platform.create_organization(self.owner, 'Emulator test ' + uuid4().hex)
        self.org = self.organization['id']
        self.platform.add_member(self.owner, self.org, self.student.email, 'student')

    def tearDown(self):
        for uid in self.users:
            auth.delete_user(uid, app=self.platform.app)
        self.platform.close()

    def account(self, name):
        email = f'{uuid4().hex}@spectakles.test'
        user = auth.create_user(email=email, password='LocalTest!2026', display_name=name, app=self.platform.app)
        self.users.append(user.uid)
        response = httpx.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',
                              json={'email': email, 'password': 'LocalTest!2026', 'returnSecureToken': True}, timeout=5)
        response.raise_for_status()
        token = response.json()['idToken']
        return self.platform.authenticate(token), token

    def publish(self, settings=None):
        return self.platform.publish(self.owner, self.org, uuid4().hex, 0, settings or default_settings())

    def assert_status(self, status, fn, *args, **kwargs):
        with self.assertRaises(HTTPException) as error: fn(*args, **kwargs)
        self.assertEqual(error.exception.status_code, status)

    def test_identity_membership_and_immutable_versions(self):
        self.assert_status(401, self.platform.authenticate, 'not-a-token')
        self.assertEqual(self.platform.me(self.student)['organizations'][0]['role'], 'student')
        self.assert_status(404, self.platform.templates, self.stranger, self.org)
        document = self.publish()
        self.assert_status(404, self.platform.publish, self.student, self.org, document['id'], 1, default_settings())
        changed = default_settings().model_copy(update={'topic': 'Education and AI'})
        version2 = self.platform.publish(self.owner, self.org, document['id'], 1, changed)
        self.assertEqual(version2['version'], 2)
        self.assert_status(409, self.platform.publish, self.owner, self.org, document['id'], 1, changed)
        version1 = self.platform.template(self.student, self.org, document['id'], 1)
        self.assertEqual(version1['settings']['topic'], 'AI: boon or bane')
        self.assertEqual(self.platform.template(self.student, self.org, document['id'])['settings']['topic'], 'Education and AI')
        self.assert_status(404, self.platform.add_member, self.student, self.org, self.stranger.email, 'admin')
        self.assert_status(409, self.platform.add_member, self.owner, self.org, self.owner.email, 'student')

    def test_owner_leases_are_independent_and_template_snapshot_is_frozen(self):
        template = self.publish()
        _, metadata = self.platform.resolve(self.student, {'organization_id': self.org, 'template_id': template['id'], 'version': 1})
        recording = uuid4().hex
        self.platform.register_recording(self.student, recording)
        run = NS(id=uuid4().hex, recording_id=recording, prep_seconds=120,
                 config=NS(discussion_minutes=12), started_at='2026-10-26T00:00:00+00:00')
        self.platform.start_session(self.student, run, metadata)
        other_recording = uuid4().hex
        self.platform.register_recording(self.student, other_recording)
        duplicate = NS(**{**vars(run), 'id': uuid4().hex, 'recording_id': other_recording})
        self.assert_status(409, self.platform.start_session, self.student, duplicate, metadata)
        self.assert_status(404, self.platform.recording, self.stranger, recording)
        self.assertEqual(self.platform.recording(self.owner, recording)['owner_uid'], self.student.uid)
        self.assert_status(404, self.platform.session, self.owner, run.id, owner_only=True)
        self.platform.publish(self.owner, self.org, template['id'], 1, default_settings().model_copy(update={'topic': 'Changed later'}))
        saved = self.platform.session(self.student, run.id)
        self.assertEqual(saved['template']['settings']['topic'], 'AI: boon or bane')
        self.assertEqual(len(self.platform.history(self.student)), 1)
        self.platform.register_recording(self.stranger, uuid4().hex)
        self.platform.finish_session(run.id, self.student.uid, {'status': 'complete'})
        self.platform.start_session(self.student, duplicate, metadata)
        self.platform.finish_session(duplicate.id, self.student.uid, {'status': 'complete'})

    def test_http_and_websocket_authorization_and_preparation_ready(self):
        with tempfile.TemporaryDirectory() as directory:
            # No lifespan ownership in this client: the fixture closes its SDK.
            app = create_app(Path(directory), platform=self.platform, discussion_clients=PanelFactory())
            client = TestClient(app)
            headers = {'Authorization': 'Bearer ' + self.student_token}
            foreign = {'Authorization': 'Bearer ' + self.stranger_token}
            self.assertEqual(client.get('/api/recordings').status_code, 401)
            self.assertEqual(client.get('/api/platform/status').json()['emulator'], True)
            self.assertEqual(client.get('/api/platform/me', headers=headers).status_code, 200)
            self.assertEqual(client.get(f'/api/platform/organizations/{self.org}/templates', headers=foreign).status_code, 404)
            template = self.publish()
            origin = {'origin': 'http://127.0.0.1:5174'}
            with client.websocket_connect('/api/recordings/ws', headers=origin) as recording_socket:
                recording_socket.send_json({'type': 'hello', 'version': 1, 'device': 'Emulator fixture', 'id_token': self.student_token})
                recording = recording_socket.receive_json()['recording']
                rid = recording['recording_id']
                self.assertEqual(client.get(recording['manifest_url'], headers=foreign).status_code, 404)
                self.assertEqual(client.get(f'/api/recordings/{rid}/audio/utterance-0001.wav', headers=foreign).status_code, 404)
                self.assertEqual(client.get(recording['manifest_url'], headers=headers).status_code, 200)
                with client.websocket_connect('/api/discussions/ws', headers=origin) as bad:
                    bad.send_json({'type': 'hello', 'version': 1, 'recording_id': rid, 'id_token': self.stranger_token})
                    self.assertEqual(bad.receive_json()['type'], 'error')
                with client.websocket_connect('/api/discussions/ws', headers=origin) as socket:
                    socket.send_json({'type': 'hello', 'version': 1, 'recording_id': rid, 'id_token': self.student_token,
                                      'template_ref': {'organization_id': self.org, 'template_id': template['id'], 'version': 1}})
                    ready = socket.receive_json()
                    self.assertEqual(ready['type'], 'ready')
                    state = socket.receive_json()
                    self.assertEqual(state['phase'], 'preparing')
                    self.assertEqual(len(state['panel']), 3)
                    self.assertEqual(client.get(ready['session_url'], headers=foreign).status_code, 404)
                    self.assertEqual(client.post('/api/discussions/' + ready['connection'] + '/end', headers=foreign).status_code, 404)
                    socket.send_json({'type': 'preparation_ready', 'connection': ready['connection']})
                    for _ in range(40):
                        message = socket.receive_json()
                        if message.get('type') == 'preparation_result':
                            self.assertTrue(message['accepted']); break
                    else: self.fail('Preparation acknowledgement missing')
                    socket.send_json({'type': 'end', 'connection': ready['connection']})
                    while socket.receive()['type'] != 'websocket.close': pass
                    artifact = client.get(ready['session_url'], headers=headers).json()
                    self.assertEqual(artifact['template']['version'], 1)
                    self.assertTrue(artifact['prep_skipped'])
                    self.assertEqual(artifact['owner_uid'], self.student.uid)
                    self.assertEqual(self.platform.history(self.student)[0]['status'], 'complete')
            client.close()

    def test_unsigned_tokens_and_direct_firestore_are_rejected_outside_emulator_mode(self):
        # Emulator tokens must never become valid for the cloud configuration.
        with self.assertRaises(ValueError): FirebasePlatform('real-project', emulator=True)
        with self.assertRaises(ValueError): FirebasePlatform('real-project', emulator=False)
        response = httpx.post('http://127.0.0.1:8080/v1/projects/demo-spectakles/databases/(default)/documents/gd_users',
                              json={'fields': {'uid': {'stringValue': 'unauthorized'}}}, timeout=5)
        self.assertEqual(response.status_code, 403)
