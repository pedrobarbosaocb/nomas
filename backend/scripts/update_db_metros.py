"""
Reads listings from the DB and updates `location_info->>'nearest_metro'` to its normalized version
if it matches a known station in `metro_stations.json`.
"""
import os
import sys
import json
import re
import psycopg2
from pathlib import Path

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.connection import get_db_connection

import unicodedata

def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn")
    text = re.sub(r'[^a-zA-Z0-9]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip().lower()

def update_metros():
    conn = get_db_connection()
    if not conn:
        print("Could not connect to database")
        return
        
    try:
        cur = conn.cursor()
        
        # Load normalized metros
        data_path = Path(__file__).parent.parent / "data" / "metro" / "metro_stations_montreal_normalized.json"
        
        mapping = {}
        if data_path.exists():
            with open(data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for line, info in data.items():
                    for st in info["Stations"]:
                        raw_name = st["name"]
                        norm_name = st.get("name_normalized") or normalize_text(raw_name)
                        mapping[f"{raw_name} ({line})"] = norm_name
                        mapping[raw_name] = norm_name
        
        print(f"Loaded {len(mapping)} distinct mappings.")
        
        cur.execute("SELECT id, location_info->>'nearest_metro' FROM listings WHERE location_info->>'nearest_metro' IS NOT NULL AND location_info->>'nearest_metro' != 'Unknown'")
        rows = cur.fetchall()
        
        updates = 0
        for lid, current_metro in rows:
            if current_metro in mapping:
                norm = mapping[current_metro]
                if current_metro != norm:
                    cur.execute(
                        "UPDATE listings SET location_info = jsonb_set(location_info, '{nearest_metro}', %s) WHERE id = %s",
                        (json.dumps(norm), lid)
                    )
                    updates += 1
            else:
                clean = re.sub(r'\s*\(.*?\)\s*', '', current_metro).strip()
                norm = normalize_text(clean)
                if current_metro != norm:
                    cur.execute(
                        "UPDATE listings SET location_info = jsonb_set(location_info, '{nearest_metro}', %s) WHERE id = %s",
                        (json.dumps(norm), lid)
                    )
                    updates += 1
                    
        conn.commit()
        print(f"Updated {updates} rows successfully. The search logic can now perform strict equality.")
        
    except Exception as e:
        conn.rollback()
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    update_metros()
