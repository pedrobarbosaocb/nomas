import os
import json
from pathlib import Path
import time

def save_json(data, filepath):
    """
    Helper function to atomically save a list of dicts or python object to a JSON file.
    This prevents file corruption if the program crashes or is stopped mid-write.
    """
    path = Path(filepath)
    tmp_path = path.with_suffix(".tmp")
    
    # Write to temporary file first
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
        
    # Atomically replace the old file with the new one
    try:
        os.replace(tmp_path, path)
    except PermissionError:
        # On Windows, os.replace fails if the target file is currently open in an IDE
        # We fallback to a standard write to keep the script alive.
        time.sleep(0.1)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            os.remove(tmp_path)
        except Exception as e:
            print(f"Warning: Failed to save to {path} due to strict IDE lock: {e}")
