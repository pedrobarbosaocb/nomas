from db.connection import get_db_connection
c = get_db_connection().cursor()
c.execute("SELECT location_info->>'latitude', location_info->>'longitude' FROM listings WHERE location_info->>'latitude' IS NOT NULL LIMIT 5")
print(c.fetchall())
