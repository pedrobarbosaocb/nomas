import sys, os
from db.connection import get_db_connection
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
conn = get_db_connection()
if conn:
    c = conn.cursor()
    c.execute("SELECT DISTINCT location_info->>'nearest_metro' FROM listings WHERE location_info->>'nearest_metro' IS NOT NULL")
    metros = [r[0] for r in c.fetchall()]
    print("ALL DISTINCT METROS IN DB:", len(metros), metros)
    c.close()
    conn.close()
