import json

def save_json(data, filepath):
    """
    Helper function to save a list of dicts or python object to a JSON file.
    """
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    print(f"Saved {len(data)} items to {filepath}")
