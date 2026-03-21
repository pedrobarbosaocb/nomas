import os
import sys
import json
import argparse
import hashlib

# Add project root to path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

from db import get_db_connection
from psycopg2.extras import execute_batch

def generate_id(item):
    """Generates an MD5 hash ID if one doesn't exist to prevent duplicates."""
    if 'id' in item and item['id']:
        return item['id']
    raw_str = str(item.get('title', '')) + str(item.get('link', ''))
    return hashlib.md5(raw_str.encode('utf-8')).hexdigest()

def sync_json_to_db(json_path):
    if not os.path.exists(json_path):
        print(f"Error: Could not find file at {json_path}")
        return

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON file: {e}")
        return

    if not isinstance(data, list):
        print("Error: JSON file must contain a list of objects.")
        return

    conn = get_db_connection()
    if not conn:
        print("Failed to connect to the database. Check your .env file!")
        return

    try:
        cursor = conn.cursor()
        
        # PostgreSQL syntax for inserting and ignoring duplicates based on the Primary Key.
        insert_query = """
            INSERT INTO listings (
                id, title, description, link, price, source, 
                latitude, longitude, nearest_metro
            ) 
            VALUES (
                %s, %s, %s, %s, %s, %s, 
                %s, %s, %s
            )
            ON CONFLICT (id) DO NOTHING;
        """
        
        args_list = []
        for index, item in enumerate(data):
            # Normal JSON structure from pruning or flat structure
            i_id = generate_id(item)
            title = item.get('title', '')
            desc = item.get('description', '')
            link = item.get('link', '')
            
            # Additional fields if using raw unpruned data
            price = item.get('price', None)
            source = item.get('source', None)
            lat = item.get('latitude', None)
            lon = item.get('longitude', None)
            metro = None
            
            args_list.append((i_id, title, desc, link, price, source, lat, lon, metro))

        print(f"Found {len(args_list)} listings in the JSON file. Syncing to database...")
        execute_batch(cursor, insert_query, args_list)
        conn.commit()
        
        # We can try to guess how many were newly inserted vs ignored by checking rowcount, 
        # but with execute_batch and ON CONFLICT DO NOTHING it's safer to just fetch the total count.
        cursor.execute("SELECT COUNT(*) FROM listings;")
        total_rows = cursor.fetchone()[0]
        print(f"Sync complete! The listings table now contains {total_rows} total rows.")

    except Exception as e:
        print(f"Database insertion failed: {e}")
    finally:
        if conn and not conn.closed:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Load a JSON file into the Postgres listings table.")
    parser.add_argument("--input", type=str, required=True, help="Path to the JSON file (e.g. classifier/training_data/kijiji_canada_unlabeled.json)")
    args = parser.parse_args()
    
    sync_json_to_db(args.input)
