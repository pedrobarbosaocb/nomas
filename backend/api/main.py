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

from typing import List

class PreferenceUpdate(BaseModel):
    preference: Optional[str] # "liked", "disliked", or None

class SortCriterion(BaseModel):
    id: str
    direction: str

class ListingSearchRequest(BaseModel):
    page: int = 1
    limit: int = 50
    minPrice: Optional[str] = None
    maxPrice: Optional[str] = None
    maxDistanceToMetro: Optional[str] = None
    selectedMetros: list[str] = []
    searchText: Optional[str] = None
    electricityIncluded: bool = False
    heatingIncluded: bool = False
    petsAllowed: bool = False
    furnishedOnly: bool = False
    sortBy: str = 'default'
    advancedSorting: bool = False
    advancedSortItems: list[SortCriterion] = []
    ratingFilter: str = 'all'  # 'all', 'liked', 'disliked', 'not-rated'
    aiLabels: list[str] = []

@app.get("/api/listings")
def get_listings():
    """Legacy endpoint, kept for backward compatibility if needed."""
    # We can just redirect to search or leave it returning all for debugging
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        cursor.execute("SELECT * FROM listings ORDER BY created_at DESC LIMIT 10")
        rows = cursor.fetchall()
        results = [_format_listing(r) for r in rows]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and not conn.closed:
            cursor.close()
            conn.close()

def _format_listing(r):
    return {
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

@app.post("/api/listings/search")
def search_listings(payload: ListingSearchRequest):
    """
    Search, filter, sort, and paginate listings dynamically based on user state.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        where_clauses = ["1=1"]
        params = []

        if payload.minPrice:
            try:
                min_val = float(payload.minPrice)
                where_clauses.append("CAST(NULLIF(regexp_replace(price, '[^0-9.]', '', 'g'), '') AS NUMERIC) >= %s")
                params.append(min_val)
            except ValueError: pass
            
        if payload.maxPrice:
            try:
                max_val = float(payload.maxPrice)
                where_clauses.append("CAST(NULLIF(regexp_replace(price, '[^0-9.]', '', 'g'), '') AS NUMERIC) <= %s")
                params.append(max_val)
            except ValueError: pass

        if payload.maxDistanceToMetro:
            try:
                max_dist = float(payload.maxDistanceToMetro)
                where_clauses.append("CAST(location_info->>'distance_to_metro_km' AS NUMERIC) <= %s")
                params.append(max_dist)
            except Exception: pass

        if payload.selectedMetros:
            holders = ', '.join(['%s'] * len(payload.selectedMetros))
            where_clauses.append(f"location_info->>'nearest_metro' IN ({holders})")
            params.extend(payload.selectedMetros)

        if payload.searchText:
            query = f"%{payload.searchText.lower()}%"
            where_clauses.append("(LOWER(title) ILIKE %s OR LOWER(description) ILIKE %s OR LOWER(location_info->>'address') ILIKE %s)")
            params.extend([query, query, query])

        if payload.furnishedOnly:
            where_clauses.append("details->>'is_furnished' = 'true'")
        if payload.petsAllowed:
            where_clauses.append("details->>'pets_allowed' = 'true'")
        if payload.electricityIncluded:
            where_clauses.append("included->>'electricity' = 'true'")
        if payload.heatingIncluded:
            where_clauses.append("included->>'heating' = 'true'")

        if payload.aiLabels:
            holders = ', '.join(['%s'] * len(payload.aiLabels))
            where_clauses.append(f"ai_label IN ({holders})")
            params.extend(payload.aiLabels)

        if payload.ratingFilter == 'liked':
            where_clauses.append("preference = 'liked'")
        elif payload.ratingFilter == 'disliked':
            where_clauses.append("preference = 'disliked'")
        elif payload.ratingFilter == 'not-rated':
            where_clauses.append("(preference IS NULL OR preference NOT IN ('liked', 'disliked'))")

        where_sql = " AND ".join(where_clauses)
        
        order_clause = "ORDER BY CASE WHEN preference = 'disliked' THEN 1 ELSE 0 END ASC, created_at DESC"
        if payload.advancedSorting and payload.advancedSortItems:
            order_parts = ["CASE WHEN preference = 'disliked' THEN 1 ELSE 0 END ASC"]
            for crit in payload.advancedSortItems:
                direction = "ASC" if crit.direction == 'asc' else "DESC"
                if crit.id == 'price':
                    order_parts.append(f"CAST(NULLIF(regexp_replace(price, '[^0-9.]', '', 'g'), '') AS NUMERIC) {direction} NULLS LAST")
                elif crit.id == 'distance':
                    order_parts.append(f"CAST(location_info->>'distance_to_metro_km' AS NUMERIC) {direction} NULLS LAST")
            if len(order_parts) > 1:
                order_clause = "ORDER BY " + ", ".join(order_parts)
        else:
            if payload.sortBy == 'price_asc':
                order_clause = "ORDER BY CASE WHEN preference = 'disliked' THEN 1 ELSE 0 END ASC, CAST(NULLIF(regexp_replace(price, '[^0-9.]', '', 'g'), '') AS NUMERIC) ASC NULLS LAST"
            elif payload.sortBy == 'price_desc':
                order_clause = "ORDER BY CASE WHEN preference = 'disliked' THEN 1 ELSE 0 END ASC, CAST(NULLIF(regexp_replace(price, '[^0-9.]', '', 'g'), '') AS NUMERIC) DESC NULLS LAST"
            elif payload.sortBy == 'distance_asc':
                order_clause = "ORDER BY CASE WHEN preference = 'disliked' THEN 1 ELSE 0 END ASC, CAST(location_info->>'distance_to_metro_km' AS NUMERIC) ASC NULLS LAST"
            elif payload.sortBy == 'distance_desc':
                order_clause = "ORDER BY CASE WHEN preference = 'disliked' THEN 1 ELSE 0 END ASC, CAST(location_info->>'distance_to_metro_km' AS NUMERIC) DESC NULLS LAST"

        count_query = f"SELECT COUNT(*) FROM listings WHERE {where_sql}"
        cursor.execute(count_query, tuple(params))
        total_items = cursor.fetchone()[0]

        offset = (payload.page - 1) * payload.limit
        select_query = f"SELECT * FROM listings WHERE {where_sql} {order_clause} LIMIT %s OFFSET %s"
        cursor.execute(select_query, tuple(params) + (payload.limit, offset))
        
        rows = cursor.fetchall()
        results = [_format_listing(r) for r in rows]
            
        return {"items": results, "total": total_items}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and not conn.closed:
            cursor.close()
            conn.close()

@app.get("/api/listings/labels")
def get_ai_labels():
    """
    Returns exhaustive AI labels mapped for the UI classifier.
    Even if the db has no labels classified, returns predefined UI classes.
    """
    labels = [
        "commercial", "parking space", "short stay", 
        "room(s) in shared apartment/house", "studio", 
        "1-bed", "2-bed", "3-bed", "4-bed", 
        "5+ bedroom apartment", "unknown"
    ]
    return labels

@app.post("/api/listings/stats")
def get_stats(payload: ListingSearchRequest):
    """
    Returns filter-aware aggregate stats grouped by preference under the same filters as any active search.
    ratingFilter is intentionally ignored so all preference buckets are always returned.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=DictCursor)

        where_clauses = ["1=1"]
        params = []

        if payload.minPrice:
            try:
                min_val = float(payload.minPrice)
                where_clauses.append("CAST(NULLIF(regexp_replace(price, '[^0-9.]', '', 'g'), '') AS NUMERIC) >= %s")
                params.append(min_val)
            except ValueError: pass

        if payload.maxPrice:
            try:
                max_val = float(payload.maxPrice)
                where_clauses.append("CAST(NULLIF(regexp_replace(price, '[^0-9.]', '', 'g'), '') AS NUMERIC) <= %s")
                params.append(max_val)
            except ValueError: pass

        if payload.maxDistanceToMetro:
            try:
                max_dist = float(payload.maxDistanceToMetro)
                where_clauses.append("CAST(location_info->>'distance_to_metro_km' AS NUMERIC) <= %s")
                params.append(max_dist)
            except Exception: pass

        if payload.selectedMetros:
            holders = ', '.join(['%s'] * len(payload.selectedMetros))
            where_clauses.append(f"location_info->>'nearest_metro' IN ({holders})")
            params.extend(payload.selectedMetros)

        if payload.searchText:
            q = f"%{payload.searchText.lower()}%"
            where_clauses.append("(LOWER(title) ILIKE %s OR LOWER(description) ILIKE %s OR LOWER(location_info->>'address') ILIKE %s)")
            params.extend([q, q, q])

        if payload.furnishedOnly:
            where_clauses.append("details->>'is_furnished' = 'true'")
        if payload.petsAllowed:
            where_clauses.append("details->>'pets_allowed' = 'true'")
        if payload.electricityIncluded:
            where_clauses.append("included->>'electricity' = 'true'")
        if payload.heatingIncluded:
            where_clauses.append("included->>'heating' = 'true'")

        if payload.aiLabels:
            holders = ', '.join(['%s'] * len(payload.aiLabels))
            where_clauses.append(f"ai_label IN ({holders})")
            params.extend(payload.aiLabels)

        where_sql = " AND ".join(where_clauses)

        cursor.execute(f"SELECT preference, COUNT(*) FROM listings WHERE {where_sql} GROUP BY preference", tuple(params))
        rows = cursor.fetchall()

        stats = {"total": 0, "liked": 0, "disliked": 0, "notRated": 0}
        for r in rows:
            pref = r[0]
            count = r[1]
            stats["total"] += count
            if pref == "liked":
                stats["liked"] += count
            elif pref == "disliked":
                stats["disliked"] += count
            else:
                stats["notRated"] += count

        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn and not conn.closed:
            cursor.close()
            conn.close()

@app.get("/api/listings/metros")
def get_metros():
    """
    Fetches all distinct nearest_metro values from the db to populate the filter dropdown.
    """
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT location_info->>'nearest_metro' FROM listings WHERE location_info->>'nearest_metro' IS NOT NULL")
        rows = cursor.fetchall()
        return [r[0] for r in rows]
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
