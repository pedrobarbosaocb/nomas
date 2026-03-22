import processor
import concurrent.futures

def _process_item(item):
    t = processor.text_for_enrichment(item)
    enriched = processor.enrich(item, text=t)
    return enriched, t

def enrich_data(all_data):
    """
    Computes text_for_enrichment once per listing and enriches the data concurrently.
    Returns the enriched raw structures and the enrichment texts.
    """
    import os
    max_workers = int(os.environ.get("MAX_THREADS", 10))
    print(f"\nEnriching {len(all_data)} listings concurrently using {max_workers} threads...")
    structured_raw = []
    enrichment_texts = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(_process_item, item) for item in all_data]
        
        for future in concurrent.futures.as_completed(futures):
            try:
                enriched, t = future.result()
                structured_raw.append(enriched)
                enrichment_texts.append(t)
            except Exception as e:
                print(f"Error enriching item: {e}")
                
    return structured_raw, enrichment_texts


def process_listings(structured_raw):
    """
    Inserts enriched listings directly into the PostgreSQL database.
    We no longer reject listings on the backend; all filtering is handled 
    by the frontend UI to preserve data comprehensively.
    """
    import json
    from db.connection import get_db_connection
    from psycopg2.extras import execute_batch
    import hashlib

    def generate_id_if_missing(item):
        """Generates an MD5 hash ID if one doesn't exist to prevent duplicates."""
        if 'id' in item and item['id']:
            return item['id']
        info = item.get('info', {})
        raw_str = str(info.get('title', '')) + str(item.get('link', ''))
        return hashlib.md5(raw_str.encode('utf-8')).hexdigest()

    print(f"\nInserting {len(structured_raw)} listings into PostgreSQL database...")
    
    conn = get_db_connection()
    if not conn:
        print("Failed to save to database: connection refused.")
        return [], []

    try:
        cursor = conn.cursor()
        
        insert_query = """
            INSERT INTO listings (
                id, title, description, link, price, source, 
                latitude, longitude, nearest_metro,
                images, location_info, included, details, scores
            ) 
            VALUES (
                %s, %s, %s, %s, %s, %s, 
                %s, %s, %s,
                %s, %s, %s, %s, %s
            )
            ON CONFLICT (id) DO NOTHING;
        """
        
        args_list = []
        for item in structured_raw:
            i_id = generate_id_if_missing(item)
            
            info = item.get("info", {})
            loc = item.get("location_info", {})
            
            title = info.get('title', '')
            desc = info.get('description', '')
            link = item.get('link', '')
            price = item.get('price', '')
            source = info.get('source', '')
            
            lat = loc.get('latitude', None)
            lon = loc.get('longitude', None)
            metro = loc.get('nearest_metro', None)
            
            # JSON stringification for JSONB columns
            images_json = json.dumps(info.get('images', []))
            loc_json = json.dumps(loc)
            inc_json = json.dumps(item.get('included', {}))
            det_json = json.dumps(item.get('details', {}))
            scores_json = json.dumps(item.get('scores', {}))
            
            args_list.append((
                i_id, title, desc, link, price, source, 
                lat, lon, metro,
                images_json, loc_json, inc_json, det_json, scores_json
            ))

        execute_batch(cursor, insert_query, args_list)
        conn.commit()
        
        cursor.execute("SELECT COUNT(*) FROM listings;")
        total_rows = cursor.fetchone()[0]
        print(f"Insertion complete! The listings table now contains {total_rows} total rows.")

    except Exception as e:
        print(f"Database insertion failed: {e}")
    finally:
        if conn and not conn.closed:
            cursor.close()
            conn.close()
            
    # For compatibility with main.py structure, though the exact dicts are now in the DB
    return structured_raw, []
