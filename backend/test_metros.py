import psycopg2
conn = psycopg2.connect(host='localhost', dbname='nomas_db', user='postgres', password='')
cur = conn.cursor()
cur.execute("SELECT DISTINCT location_info->>'nearest_metro' FROM listings WHERE location_info->>'nearest_metro' IS NOT NULL ORDER BY location_info->>'nearest_metro' LIMIT 15")
print([r[0] for r in cur.fetchall()])
