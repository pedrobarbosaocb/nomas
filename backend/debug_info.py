import joblib
import json
import psycopg2

def inspect():
    try:
        encoder = joblib.load('classifiers/lightgbm/models/label_encoder.joblib')
        classes = list(encoder.classes_)
        print("MODEL CLASSES:", classes)
    except Exception as e:
        print("Could not load encoder:", e)

    try:
        from db.connection import get_db_connection
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT location_info->>'nearest_metro' FROM listings WHERE location_info->>'nearest_metro' IS NOT NULL AND location_info->>'nearest_metro' != 'Unknown' LIMIT 20")
        metros = [r[0] for r in cur.fetchall()]
        print("DB METROS:", metros)
    except Exception as e:
        print("DB ERROR:", e)

inspect()
