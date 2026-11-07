"""Invitation and removal boundaries against isolated Firebase emulators."""
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
import json
import os
from pathlib import Path
import tempfile
import time
from types import SimpleNamespace as NS
import unittest
from unittest.mock import patch
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import HTTPException
from fastapi.testclient import TestClient

from browser_backend.contracts import InvitationRequest, default_settings
from browser_backend.firebase_platform import user_key
from browser_backend.main import create_app
from browser_backend.onboarding import Onboarding, app_origin
from browser_backend.provision_operator import provision
from tests import test_firebase_platform as fixtures


class OriginTests(unittest.TestCase):
    def test_invite_origin_rejects_untrusted_url_components(self):
        for value in ['https://good.example/redirect', 'http://app.example', 'https://user:password@app.example', 'https://app.example/?q=bad']:
            with self.subTest(value=value), patch.dict(os.environ, {'GD_APP_ORIGIN': value}), self.assertRaises(ValueError): app_origin(False)
        with patch.dict(os.environ, {'GD_APP_ORIGIN': 'https://app.spectakles.in'}):
            self.assertEqual(app_origin(False), 'https://app.spectakles.in')
        with patch.dict(os.environ, {'GD_APP_ORIGIN': 'http://not-local.test:5173'}), self.assertRaises(ValueError): app_origin(True)


@unittest.skipUnless(os.environ.get('GD_TEST_FIREBASE_EMULATORS') == '1', 'Explicit local test emulators only')
class OnboardingTests(unittest.TestCase):
    setUp = fixtures.FirebaseTests.setUp
    tearDown = fixtures.FirebaseTests.tearDown
    account = fixtures.FirebaseTests.account
    grant_provisioning = fixtures.FirebaseTests.grant_provisioning
    assert_status = fixtures.FirebaseTests.assert_status
    publish = fixtures.FirebaseTests.publish

    def invitation(self, email=None, role='student'):
        service = Onboarding(self.platform)
        result = service.create(self.owner, self.org, InvitationRequest(email=email or self.stranger.email, role=role))
        return service, result, result['join_url'].split('#invite=')[1]

    def test_invitation_has_a_fragment_secret_and_no_secret_in_storage(self):
        service, invitation, token = self.invitation()
        self.assertFalse(urlparse(invitation['join_url']).query)
        self.assertEqual(invitation['delivery'], 'manual_link')
        stored = self.platform.db.collection('gd_invitations').document(invitation['id']).get().to_dict()
        self.assertNotIn(token, json.dumps(stored))
        self.assertNotIn('join_url', json.dumps(service.list(self.owner, self.org)))
        preview = service.preview(token)
        self.assertNotEqual(preview['email_hint'], self.stranger.email)
        self.assertNotIn('email', preview)
        self.assert_status(404, service.create, self.student, self.org, InvitationRequest(email=self.stranger.email, role='admin'))
        self.assert_status(404, service.list, self.student, self.org)
        self.assert_status(404, service.accept, self.student, token)
        accepted = service.accept(self.stranger, token)
        self.assertEqual(accepted, service.accept(self.stranger, token))
        self.assertEqual(self.platform.membership(self.stranger, self.org)['role'], 'student')
        self.assert_status(404, service.preview, token)

    def test_expired_revoked_and_unverified_invitations_are_refused(self):
        service, invitation, token = self.invitation()
        with patch.object(self.platform, 'emulator', False):
            self.assert_status(403, service.accept, self.stranger, token)
        service.revoke(self.owner, self.org, invitation['id'])
        self.assert_status(404, service.accept, self.stranger, token)
        _, invitation, token = self.invitation()
        self.platform.db.collection('gd_invitations').document(invitation['id']).update({'expires_at': time.time()-1})
        self.assert_status(404, service.preview, token)
        self.assert_status(404, service.accept, self.stranger, token)

    def test_repeated_accept_cannot_reinstate_a_removed_membership(self):
        service, _, token = self.invitation()
        service.accept(self.stranger, token)
        service.remove(self.owner, self.org, self.stranger.uid)
        self.assert_status(409, service.accept, self.stranger, token)
        self.assert_status(404, self.platform.membership, self.stranger, self.org)
        _, _, fresh = self.invitation()
        service.accept(self.stranger, fresh)
        self.assertEqual(self.platform.membership(self.stranger, self.org)['status'], 'active')
        self.assert_status(409, service.remove, self.owner, self.org, self.owner.uid)
        self.assert_status(404, service.remove, self.student, self.org, self.stranger.uid)

    def test_removed_owner_loses_institution_artifacts_but_keeps_personal_access(self):
        service = Onboarding(self.platform)
        institution_recording, personal_recording = uuid4().hex, uuid4().hex
        for rid in (institution_recording, personal_recording): self.platform.register_recording(self.student, rid)
        metadata = self.publish()
        metadata = {**metadata, 'template_id': metadata['id']}
        run = NS(id=uuid4().hex, recording_id=institution_recording, prep_seconds=120,
                 config=default_settings().resolve('Student'), store=NS(root=Path('/private/tmp/removal-fixture')), started_at='2026-10-29T00:00:00Z')
        self.platform.start_session(self.student, run, metadata)
        service.remove(self.owner, self.org, self.student.uid)
        self.assertEqual(self.platform.me(self.student)['organizations'], [])
        self.assert_status(404, self.platform.recording, self.student, institution_recording)
        self.assert_status(404, self.platform.session, self.student, run.id)
        self.assertEqual(self.platform.history(self.student), [])
        self.assertEqual(self.platform.recording_ids(self.student), [personal_recording])
        self.assertEqual(self.platform.recording(self.student, personal_recording)['owner_uid'], self.student.uid)
        self.assertEqual(self.platform.session(self.owner, run.id)['owner_uid'], self.student.uid)
        self.platform.finish_session(run.id, self.student.uid, {'status': 'incomplete', 'end_reason': 'institution_access_removed'})
        self.platform.add_member(self.owner, self.org, self.student.email, 'student')
        self.assertEqual(len(self.platform.history(self.student)), 1)

    def test_membership_is_checked_again_during_session_admission(self):
        template = self.publish()
        _, metadata = self.platform.resolve(self.student, {'organization_id': self.org, 'template_id': template['id'], 'version': 1})
        Onboarding(self.platform).remove(self.owner, self.org, self.student.uid)
        rid = uuid4().hex
        self.platform.register_recording(self.student, rid)
        run = NS(id=uuid4().hex, recording_id=rid, prep_seconds=120, config=default_settings().resolve('Student'), store=NS(root=Path('/tmp/removed-admission')), started_at='2026-10-29T00:00:00Z')
        self.assert_status(404, self.platform.start_session, self.student, run, metadata)

    def test_http_preview_is_public_but_acceptance_and_management_are_authenticated(self):
        service, invitation, token = self.invitation()
        with tempfile.TemporaryDirectory() as root:
            client = TestClient(create_app(Path(root), platform=self.platform))
            body = {'token': token}
            self.assertEqual(client.post('/api/platform/invitations/preview', json=body).status_code, 200)
            self.assertEqual(client.post('/api/platform/invitations/accept', json=body).status_code, 401)
            headers = {'Authorization': 'Bearer ' + self.stranger_token}
            self.assertEqual(client.post('/api/platform/invitations/accept', json=body, headers=headers).status_code, 200)
            self.assertEqual(client.post('/api/platform/invitations/accept', json=body, headers=headers).status_code, 200)
            self.assertEqual(client.get(f'/api/platform/organizations/{self.org}/invitations', headers=headers).status_code, 404)
            client.close()

    def test_operator_bootstrap_is_dry_by_default_and_binds_the_firebase_uid(self):
        before = self.platform.db.collection('gd_users').document(user_key(self.stranger.uid))
        self.assertFalse(provision(self.platform, self.stranger.email)['applied'])
        self.assertFalse(before.get().exists)
        self.assertTrue(provision(self.platform, self.stranger.email, True)['applied'])
        self.assertEqual(before.get().to_dict()['uid'], self.stranger.uid)
        self.assertTrue(before.get().to_dict()['platform_operator'])
