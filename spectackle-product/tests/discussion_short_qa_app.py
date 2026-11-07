"""Short real-clock lifecycle regression, explicitly isolated from production."""
from dataclasses import replace
from pathlib import Path
from browser_backend.main import create_app
from gd_engine.config import SessionConfig
from .discussion_fakes import PanelFactory
factory=PanelFactory(reply_seconds=2)
config=replace(SessionConfig(),discussion_minutes=.5,closing_window_s=10,final_minute_s=5,
               discussion_grace_s=1,opening_wait_s=1)
app=create_app(Path('/private/tmp/spectakles-final/short-recordings'),discussion_clients=factory,
               discussion_prep=2,discussion_config=config)
