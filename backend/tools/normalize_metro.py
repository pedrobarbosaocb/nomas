"""
normalize_metro.py
------------------
One-time preprocessing script.
Reads  data/metro_stations_montreal.json  and writes
data/metro_stations_montreal_normalized.json  with a
pre-computed `name_normalized` field on every station entry.

Run once (or whenever the source JSON changes) from the project root:
    python tools/normalize_metro.py
"""

import json
import re
from pathlib import Path


def normalize_text(text: str) -> str:
    """Mirror of processor.normalize_text — must stay in sync."""
    text = re.sub(r'[^a-zA-Z0-9]', ' ', text or "")
    return re.sub(r'\s+', ' ', text).strip().lower()


def main():
    src = Path(__file__).parent.parent / "data" / "metro_stations_montreal.json"
    dst = src.with_name("metro_stations_montreal_normalized.json")

    with open(src, encoding="utf-8") as f:
        data = json.load(f)

    for line_data in data.values():
        for station in line_data["Stations"]:
            station["name_normalized"] = normalize_text(station["name"])

    with open(dst, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"Written: {dst}")
    total = sum(len(v["Stations"]) for v in data.values())
    print(f"  {total} stations normalized across {len(data)} lines.")


if __name__ == "__main__":
    main()
