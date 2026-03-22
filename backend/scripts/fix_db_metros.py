import os, sys, json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.connection import get_db_connection
import re

def normalize_text(text):
    text = re.sub(r'[^a-zA-Z0-9]', ' ', text or "")
    return re.sub(r'\s+', ' ', text).strip().lower()

def fix_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'frontend', 'client', 'src', 'data', 'metro_stations.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    mapping = {}
    for line, info in data.items():
        for st in info["Stations"]:
            mapping[normalize_text(st["name"])] = st["name"]
            
    cur.execute("SELECT id, location_info->>'nearest_metro' as m FROM listings WHERE location_info->>'nearest_metro' IS NOT NULL")
    rows = cur.fetchall()
    
    update_data = []
    for lid, m in rows:
        if not m: continue
        if m in mapping:
            correct = mapping[m]
            if correct != m:
                update_data.append((json.dumps(correct), lid))
                
    if update_data:
        from psycopg2.extras import execute_batch
        print(f"Applying {len(update_data)} updates...")
        execute_batch(cur, "UPDATE listings SET location_info = jsonb_set(location_info, '{nearest_metro}', %s) WHERE id = %s", update_data)
        conn.commit()
    print(f"Fixed {len(update_data)} listings")
    
if __name__ == '__main__':
    fix_db()
