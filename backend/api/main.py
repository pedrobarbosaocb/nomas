import os
import sys
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Setup path so we can import our db code
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
sys.path.append(backend_dir)

from db.connection import get_db_connection
from psycopg2.extras import DictCursor

app = FastAPI(title="Nomas Real Estate API")

# Allow the React frontend to fetch data cleanly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, lock this down to the actual frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PreferenceUpdate(BaseModel):
    preference: Optional[str] # "liked", "disliked", or None

@app.get("/api/listings")
def get_listings():
    """
    Fetches all listings from the PostgreSQL database and formats them 
    back into the original JSON structure expected by the frontend.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        # We retrieve everything; frontend handles custom filtering.
        query = "SELECT * FROM listings ORDER BY created_at DESC"
        cursor.execute(query)
        rows = cursor.fetchall()
        
        results = []
        for r in rows:
            # Re-nest the flattened SQL columns back into the rich frontend-expected structure
            item = {
                "id": r["id"],
                "price": r["price"] if r["price"] else "",
                "link": r["link"] if r["link"] else "",
                "info": {
                    "source": r["source"] if r["source"] else "unknown",
                    "title": r["title"] if r["title"] else "",
                    "description": r["description"] if r["description"] else "",
                    "images": r["images"] if r["images"] else []
                },
                "location_info": r["location_info"] if r["location_info"] else {},
                "included": r["included"] if r["included"] else {},
                "details": r["details"] if r["details"] else {},
                "scores": r["scores"] if r["scores"] else {},
                "ai_label": r["ai_label"],
                "preference": r["preference"]
            }
            results.append(item)
            
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and not conn.closed:
            cursor.close()
            conn.close()


@app.post("/api/listings/{listing_id}/preference")
def update_preference(listing_id: str, payload: PreferenceUpdate):
    """
    Updates the preference column ('liked', 'disliked', None) for a specific listing to persist across sessions over the whole team.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    pref = payload.preference
    if pref not in ["liked", "disliked", None]:
        raise HTTPException(status_code=400, detail="Preference must be 'liked', 'disliked', or null")

    try:
        cursor = conn.cursor()
        query = "UPDATE listings SET preference = %s WHERE id = %s"
        cursor.execute(query, (pref, listing_id))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Listing not found")
            
        conn.commit()
        return {"success": True, "message": f"Updated preference to {pref}"}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and not conn.closed:
            cursor.close()
            conn.close()
