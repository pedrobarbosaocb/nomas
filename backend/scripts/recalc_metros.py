import sys
import os
import json
import psycopg2

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db.connection import get_db_connection
from processor import get_nearest_metro, _load_metro_data

def recalc():
    conn = get_db_connection()
    if not conn:
        print("No db connection")
        return
        
    metro_data = _load_metro_data()
    print("Loaded metro maps:", len(metro_data), "lines.")
    
    cur = conn.cursor()
    cur.execute("SELECT id, location_info->>'latitude', location_info->>'longitude' FROM listings WHERE location_info->>'latitude' IS NOT NULL AND location_info->>'longitude' IS NOT NULL")
    rows = cur.fetchall()
    print(f"Recalculating {len(rows)} listings with coords...")
    
    updates = 0
    for idx, row in enumerate(rows):
        lid, lat, lon = row
        try:
            lat_f = float(lat)
            lon_f = float(lon)
            best_station, best_line, dist = get_nearest_metro(lat_f, lon_f, metro_data)
            
            cur.execute(
                "UPDATE listings SET location_info = jsonb_set(jsonb_set(location_info, '{nearest_metro}', %s), '{distance_to_metro_km}', %s) WHERE id = %s",
                (json.dumps(best_station), json.dumps(dist), lid)
            )
            updates += 1
            if updates % 100 == 0:
                conn.commit()
                print(f"Committed {updates}...")
        except Exception as e:
            pass
            
    conn.commit()
    print(f"Updated {updates} metros to normalized values.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    recalc()
