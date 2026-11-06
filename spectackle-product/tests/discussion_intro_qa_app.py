"""Long introduction used to exercise the actual 30-second playback cutoff."""
from dataclasses import replace
from pathlib import Path
from browser_backend.main import create_app
from gd_engine.config import SessionConfig
from .discussion_fakes import PanelFactory
factory=PanelFactory(reply_seconds=35,reply_pace=.1)
config=replace(SessionConfig(),discussion_minutes=12,opening_wait_s=.1)
app=create_app(Path('/private/tmp/spectakles-final/intro-recordings'),discussion_clients=factory,
               discussion_prep=2,discussion_config=config)
