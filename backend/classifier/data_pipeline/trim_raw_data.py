import os
import json
from pathlib import Path

script_dir = os.path.dirname(os.path.abspath(__file__))
classifier_dir = os.path.dirname(script_dir)
backend_dir = os.path.dirname(classifier_dir)

def trim_raw_data():
    file_path = Path(classifier_dir) / "training_data" / "kijiji_canada_unlabeled.json"
    
    if not file_path.exists():
        print(f"File not found: {file_path}")
        return

    print(f"Reading {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded {len(data)} listings. Trimming excess fields...")
    
    trimmed_data = []
    for item in data:
        pruned_item = {
            'id': item.get('id'),
            'title': item.get('title', ''),
            'description': item.get('description', ''),
            'link': item.get('link', '')
        }
        trimmed_data.append(pruned_item)

    # Save it back out
    import tempfile
    tmp_path = file_path.with_suffix(".tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(trimmed_data, f, ensure_ascii=False, indent=4)
        
    os.replace(tmp_path, file_path)
    print(f"Successfully pruned {len(trimmed_data)} listings and saved to {file_path}.")

if __name__ == "__main__":
    trim_raw_data()
