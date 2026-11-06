"""Real local-emulator assignment admission tests; no model/provider calls."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import os
from pathlib import Path
from types import SimpleNamespace as NS
import unittest
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError

from browser_backend.contracts import AssignmentRequest, CohortRequest, default_settings
from browser_backend.institutions import Institutions
from tests import test_firebase_platform as fixtures


class AssignmentContracts(unittest.TestCase):
    def test_rejects_ambiguous_dates_duplicate_students_and_invalid_allowance(self):
        with self.assertRaises(ValidationError): CohortRequest(name='Batch', student_uids=['same', 'same'])
        data = dict(title='Round', cohort_id='a'*32, template_id='b'*32, template_version=1,
                    opens_at='2026-10-29T10:00:00', due_at='2026-10-30T10:00:00+00:00')
        with self.assertRaises(ValidationError): AssignmentRequest(**data)
        data['opens_at'] = '2026-10-29T10:00:00+00:00'
        with self.assertRaises(ValidationError): AssignmentRequest(**data, max_attempts=True)
        data['due_at'] = '2026-10-28T10:00:00+00:00'
        with self.assertRaises(ValidationError): AssignmentRequest(**data)


@unittest.skipUnless(os.environ.get('GD_TEST_FIREBASE_EMULATORS') == '1', 'Explicit local emulator only')
class InstitutionsTests(unittest.TestCase):
    setUp = fixtures.FirebaseTests.setUp
    tearDown = fixtures.FirebaseTests.tearDown
    account = fixtures.FirebaseTests.account
    grant_provisioning = fixtures.FirebaseTests.grant_provisioning
    assert_status = fixtures.FirebaseTests.assert_status
    publish = fixtures.FirebaseTests.publish

    def assignment(self, maximum=2):
        service = Institutions(self.platform)
        cohort = service.create_cohort(self.owner, self.org, CohortRequest(name='Placement batch', student_uids=[self.student.uid]))
        template = self.publish()
        request = AssignmentRequest(title='Round one', cohort_id=cohort['id'], template_id=template['id'], template_version=1,
            opens_at=datetime.now(timezone.utc)-timedelta(hours=1), due_at=datetime.now(timezone.utc)+timedelta(days=1), max_attempts=maximum)
        return service, service.create_assignment(self.owner, self.org, request), template

    def run_for(self, metadata):
        recording = uuid4().hex
        self.platform.register_recording(self.student, recording)
        return NS(id=uuid4().hex, recording_id=recording, prep_seconds=120,
                  config=default_settings().resolve('Student'), store=NS(root=Path('/private/tmp/assignment-test')),
                  started_at=datetime.now(timezone.utc).isoformat())

    def test_rosters_and_immutable_assignment_template_are_scoped(self):
        service, assignment, template = self.assignment()
        self.assert_status(404, service.cohorts, self.student, self.org)
        self.assert_status(422, service.create_cohort, self.owner, self.org, CohortRequest(name='Bad', student_uids=[self.stranger.uid]))
        self.assert_status(404, service.assignment, self.stranger, assignment['id'])
        self.assert_status(403, service.resolve, self.owner, assignment['id'])
        student_list = service.assignments(self.student, self.org)
        self.assertEqual(len(student_list), 1)
        self.assertNotIn('student_uids', student_list[0])
        self.assertNotIn('created_by', student_list[0])
        self.platform.publish(self.owner, self.org, template['id'], 1, default_settings().model_copy(update={'topic': 'Changed later'}))
        settings, metadata = self.platform.resolve(self.student, {'assignment_id': assignment['id']})
        self.assertEqual(settings.topic, 'AI: boon or bane')
        self.assertEqual(metadata['version'], 1)

    def test_attempt_reservations_release_consume_and_settle_once(self):
        service, assignment, _ = self.assignment()
        _, metadata = self.platform.resolve(self.student, {'assignment_id': assignment['id']})
        run = self.run_for(metadata)
        self.platform.start_session(self.student, run, metadata)
        self.assertEqual(service.assignments(self.student, self.org)[0]['attempts_reserved'], 1)
        self.platform.finish_session(run.id, self.student.uid, {'status': 'complete', 'end_reason': 'ended_by_user'})
        self.platform.finish_session(run.id, self.student.uid, {'status': 'complete', 'discussion_started_at': 'later'})
        self.assertEqual(service.assignments(self.student, self.org)[0]['attempts_remaining'], 2)
        for reason, incomplete in [('ended_by_user', False), ('browser_disconnected', True)]:
            run = self.run_for(metadata)
            self.platform.start_session(self.student, run, metadata)
            self.platform.finish_session(run.id, self.student.uid, {'status': 'incomplete' if incomplete else 'complete',
                'incomplete': incomplete, 'end_reason': reason, 'discussion_started_at': '2026-10-29T00:00:00Z'})
        self.assertEqual(service.assignments(self.student, self.org)[0]['attempts_remaining'], 0)
        self.assert_status(409, self.platform.start_session, self.student, self.run_for(metadata), metadata)
        progress = service.progress(self.owner, self.org, assignment['id'])
        self.assertEqual(progress['students'][0]['used'], 2)
        self.assertEqual(len(progress['students'][0]['sessions']), 3)
        self.assert_status(404, service.progress, self.student, self.org, assignment['id'])

    def test_deadline_close_and_concurrent_admission_are_checked_transactionally(self):
        service, assignment, _ = self.assignment(maximum=1)
        _, metadata = self.platform.resolve(self.student, {'assignment_id': assignment['id']})
        runs = [self.run_for(metadata), self.run_for(metadata)]
        def attempt(run):
            try:
                self.platform.start_session(self.student, run, metadata)
                return 201
            except HTTPException as error:
                return error.status_code
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sorted(pool.map(attempt, runs)), [201, 409])
        used = next(run for run in runs if self.platform.db.collection('gd_sessions').document(run.id).get().exists)
        self.platform.finish_session(used.id, self.student.uid, {'status': 'incomplete', 'incomplete': True, 'end_reason': 'backend_restart'})
        service.close_assignment(self.owner, self.org, assignment['id'])
        self.assert_status(409, self.platform.start_session, self.student, self.run_for(metadata), metadata)
        self.assert_status(409, self.platform.resolve, self.student, {'assignment_id': assignment['id']})
