import os
import psycopg2
from psycopg2.extras import DictCursor
from psycopg2 import Error
from dotenv import load_dotenv

# Load env variables from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

def get_db_connection():
    """Returns a connection to the PostgreSQL database."""
    try:
        connection = psycopg2.connect(
            host=os.environ.get("DB_HOST", "localhost"),
            user=os.environ.get("DB_USER", "postgres"),
            password=os.environ.get("DB_PASSWORD", ""),
            dbname=os.environ.get("DB_NAME", "nomas_db"),
            port=os.environ.get("DB_PORT", "5432")
        )
        return connection
    except Error as e:
        print(f"Error connecting to PostgreSQL: {e}")
    return None

def init_db():
    """
    Creates the listings table if it doesn't already exist.
    This ensures we don't break existing setups but handles missing ones safely.
    """
    conn = get_db_connection()
    if not conn:
        print("Could not initialize DB. Connection failed.")
        return
        
    try:
        cursor = conn.cursor()
        create_table_query = """
        CREATE TABLE IF NOT EXISTS listings (
            id VARCHAR(64) PRIMARY KEY,
            title VARCHAR(500),
            description TEXT,
            link TEXT,
            price VARCHAR(100),
            source VARCHAR(100),
            latitude DECIMAL(9,6),
            longitude DECIMAL(9,6),
            nearest_metro VARCHAR(150),
            ai_label VARCHAR(100) DEFAULT NULL,
            ai_label_int INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        cursor.execute(create_table_query)
        conn.commit()
    except Error as e:
        print(f"Error initializing database table: {e}")
    finally:
        if conn and not conn.closed:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialization check complete.")
