"""Evidence integrity, privacy, cache and paid-call admission without providers."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import tempfile
import threading
from types import SimpleNamespace as NS
import unittest
from uuid import uuid4
import wave

from fastapi import HTTPException

from browser_backend.evaluation import Evaluations, evidence
from browser_backend.recordings import RecordingStore, atomic_json


def fixture(root):
    store = RecordingStore(Path(root))
    recording = store.create('Synthetic microphone')
    rid = recording.directory.name
    session_id = uuid4().hex
    clips = []
    for index in (1, 2):
        data = bytes([index, 0]) * 16000
        path = recording.directory / f'utterance-{index:04d}.wav'
        with wave.open(str(path), 'wb') as audio:
            audio.setparams((1, 2, 16000, 0, 'NONE', 'not compressed')); audio.writeframes(data)
        clips.append({'id': index, 'file': path.name, 'sample_count': 16000, 'voiced_ms': 500,
                      'pcm_sha256': hashlib.sha256(data).hexdigest(), 'incomplete': False})
    recording.manifest.update(status='complete', utterances=clips)
    recording.save()
    metadata = dict(recording_id=rid, session_id=session_id, status='complete')
    discussion = dict(status='complete', topic='Education', transcript=[{'speaker': 'user', 'text': 'One practical example.'}],
                      leader='user', end_reason='ended_by_user', events=[{'type': 'input.start', 'id': 2, 'delivered': True}])
    atomic_json(recording.directory / f'discussion-{session_id}.json', discussion)
    return store, metadata, recording


class EvidenceTests(unittest.TestCase):
    def test_only_delivered_gd_audio_is_included_in_order_and_hash_checked(self):
        with tempfile.TemporaryDirectory() as root:
            store, metadata, recording = fixture(root)
            payload, audio, fingerprint = evidence(store, metadata)
            self.assertEqual([c['id'] for c in payload['utterances']], [2])
            self.assertEqual(payload['facts']['vad_voiced_seconds'], .5)
            self.assertEqual(payload['facts']['recorded_speech_seconds'], 1)
            self.assertEqual(len(audio), 32044)
            self.assertEqual(len(fingerprint), 64)
            self.assertNotIn('device', json.dumps(payload))
            self.assertNotIn('notes', payload)
            (recording.directory / 'utterance-0002.wav').write_bytes(b'damaged')
            payload, _, _ = evidence(store, metadata)
            self.assertEqual(payload['facts']['utterance_count'], 0)
            self.assertTrue(any('unavailable' in warning for warning in payload['warnings']))

    def test_active_recording_waits_for_finalization(self):
        with tempfile.TemporaryDirectory() as root:
            store, metadata, recording = fixture(root)
            recording.manifest['status'] = 'recording'; recording.save()
            with self.assertRaises(HTTPException) as error: evidence(store, metadata)
            self.assertEqual(error.exception.status_code, 409)

    def test_cache_prevents_duplicate_paid_assessment_and_facts_are_free(self):
        with tempfile.TemporaryDirectory() as root:
            store, metadata, _ = fixture(root)
            calls = []
            def assessor(payload, audio):
                calls.append(audio)
                return {'summary': 'Supported feedback', 'observations': [], 'limitations': ['Synthetic']}, 'fake', {'tokens': 1}
            service = Evaluations(NS(session=lambda *args: metadata), store, assessor)
            report = service.generate('owner', metadata['session_id'])
            self.assertIsNone(report['coaching']); self.assertEqual(calls, [])
            first = service.generate('owner', metadata['session_id'], True)
            again = service.generate('owner', metadata['session_id'], True)
            self.assertEqual(first, again); self.assertEqual(len(calls), 1)
            self.assertEqual(service.read('trainer', metadata['session_id']), first)

    def test_concurrent_generation_does_not_duplicate_provider_calls(self):
        with tempfile.TemporaryDirectory() as root:
            store, metadata, _ = fixture(root)
            entered, release = threading.Event(), threading.Event()
            def assessor(payload, audio):
                entered.set(); release.wait(3)
                raise ValueError('Synthetic provider failure')
            service = Evaluations(NS(session=lambda *args: metadata), store, assessor)
            with ThreadPoolExecutor(max_workers=2) as pool:
                running = pool.submit(service.generate, 'owner', metadata['session_id'], True)
                self.assertTrue(entered.wait(3))
                with self.assertRaises(HTTPException) as error: service.generate('owner', metadata['session_id'], True)
                self.assertEqual(error.exception.status_code, 409)
                release.set(); self.assertEqual(running.result()['status'], 'failed')
            # A provider failure is saved, not retried by refreshing the page.
            self.assertEqual(service.generate('owner', metadata['session_id'], True)['status'], 'failed')

    def test_access_is_checked_before_reading_or_generating_any_artifact(self):
        def deny(*args): raise HTTPException(404, 'Not found')
        service = Evaluations(NS(session=deny), None)
        for fn in (service.read, service.generate):
            with self.assertRaises(HTTPException): fn('stranger', 'a'*32)
