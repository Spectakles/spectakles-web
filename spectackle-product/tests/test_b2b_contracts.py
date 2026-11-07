from dataclasses import replace
import unittest
from pydantic import ValidationError

from browser_backend.contracts import TemplateSettings, default_settings
from gd_engine.config import DEFAULT_PANEL, Panelist, SessionConfig
from gd_engine.prompts import build_system_prompt


class ContractTests(unittest.TestCase):
    def test_default_configuration_preserves_the_proven_personas(self):
        settings = default_settings()
        original = SessionConfig()
        resolved = settings.resolve(original.user_name)
        self.assertEqual([p.id for p in resolved.panel], [p.id for p in DEFAULT_PANEL])
        for person in DEFAULT_PANEL:
            self.assertEqual(build_system_prompt(original, person), build_system_prompt(resolved, resolved.by_id[person.id]))
        self.assertEqual(resolved.discussion_minutes, 12)
        self.assertEqual((resolved.closing_window_s, resolved.final_minute_s), (45, 30))

    def test_dynamic_panel_uses_all_names_and_custom_persona(self):
        settings = default_settings().model_dump(mode='json')
        settings['panel'] = settings['panel'][:2]
        settings['panel'][0].update(id='nina', name='Nina', persona='Ask for practical evidence.', style='arjun')
        config = TemplateSettings.model_validate(settings).resolve('Nina')
        self.assertEqual(config.user_name, 'Nina Human')
        prompt = build_system_prompt(config, config.panel[0])
        self.assertIn('Ask for practical evidence.', prompt)
        self.assertIn('Nina', prompt)
        self.assertIn('Sahil', prompt)
        self.assertNotIn('Meera', prompt)

    def test_contract_rejects_untrusted_provider_fields_and_invalid_panels(self):
        for patch in [dict(model='anything'), dict(discussion_seconds='720'), dict(discussion_seconds=True),
                      dict(closing_seconds=20, final_seconds=30), dict(preparation_seconds=-1),
                      dict(panel=[]), dict(panel=list(default_settings().panel) * 2)]:
            with self.subTest(patch=patch), self.assertRaises(ValidationError):
                TemplateSettings.model_validate({**default_settings().model_dump(), **patch})
        duplicate = default_settings().model_dump(mode='json')
        duplicate['panel'][1]['name'] = 'ARJUN'
        with self.assertRaises(ValidationError): TemplateSettings.model_validate(duplicate)
        invalid = default_settings().model_dump(mode='json')
        invalid['panel'][0]['voice'] = 'unapproved'
        with self.assertRaises(ValidationError): TemplateSettings.model_validate(invalid)

    def test_fingerprint_is_stable_and_changes_with_settings(self):
        value = default_settings()
        self.assertEqual(value.fingerprint(), TemplateSettings.model_validate_json(value.model_dump_json()).fingerprint())
        self.assertNotEqual(value.fingerprint(), value.model_copy(update={'topic': 'A different topic'}).fingerprint())

    def test_engine_accepts_two_and_five_bots_but_not_one_or_six(self):
        extra = (Panelist('nina', 'Nina', 'Kore', 'Researcher'), Panelist('rohan', 'Rohan', 'Puck', 'Educator'))
        replace(SessionConfig(), panel=DEFAULT_PANEL[:2])
        replace(SessionConfig(), panel=DEFAULT_PANEL + extra)
        for panel in (DEFAULT_PANEL[:1], DEFAULT_PANEL + extra + (Panelist('tina', 'Tina', 'Charon', 'Analyst'),)):
            with self.assertRaises(ValueError): replace(SessionConfig(), panel=panel)
