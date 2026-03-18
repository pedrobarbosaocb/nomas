import json
from pathlib import Path

def load_settings(settings_path="settings/search_settings.json"):
    path = Path(settings_path)
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)
