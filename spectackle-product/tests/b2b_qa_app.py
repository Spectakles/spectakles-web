"""Explicit emulator-only controlled-provider app for local browser QA."""
import os
from pathlib import Path
from browser_backend.main import create_app
from browser_backend.firebase_platform import FirebasePlatform
from .discussion_fakes import PanelFactory

platform = FirebasePlatform.from_env()
if platform is None or not platform.emulator:
    raise RuntimeError('B2B QA requires explicit Firebase emulator mode')
factory = PanelFactory(reply_seconds=2)
app = create_app(Path('/private/tmp/spectakles-b2b-qa/recordings'), platform=platform,
                 discussion_clients=factory, dev_tools=True)
