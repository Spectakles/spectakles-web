"""Isolated controlled-provider app; never loaded by the product backend."""
import os
from pathlib import Path
from browser_backend.main import create_app
from .discussion_fakes import PanelFactory
factory=PanelFactory(reply_seconds=2)
app=create_app(Path(os.environ.get('GD_RECORDINGS_DIR','/private/tmp/spectakles-final/qa-recordings')),
               discussion_clients=factory,discussion_prep=2)
