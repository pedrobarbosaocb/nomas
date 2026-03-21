"""
processor.py
------------
Core logic for apartment listing enrichment and filtering.
Includes keyword-based (Stage A) and embedding-based (Stage B) logic.
"""

import re
import os
import json
import numpy as np
from math import radians, cos, sin, asin, sqrt
from pathlib import Path

# Optional geocoding dependency — resolved once at import time
try:
    from geopy.geocoders import Nominatim as _Nominatim
    _NOMINATIM_AVAILABLE = True
except ImportError:
    _NOMINATIM_AVAILABLE = False

# ──────────────────────────────────────────────────────────────────────────────
# KEYWORD LISTS (English & French)
# ──────────────────────────────────────────────────────────────────────────────

FILTER_ROOM_KEYWORDS = [
    "room for rent", "room only", "rooms for rent",
    "private room", "private bedroom", "furnished room",
    "chambre à louer", "chambre a louer", "chambre privée", "chambre privee",
    "chambre meublée", "chambre meublee",
    "chambres à louer", "chambres a louer",
    "louer une chambre", "1 chambre à louer", "1 chambre a louer",
    "maison de chambres",
]

FILTER_ROOMMATENO_KEYWORDS = [
    "recherche", "cherche", "recherché", "wanted", "looking for", "roommate", "colocataire", 
    "coloc", "sublet", "sous-louer", "sous-location", "échange", "exchange",
    "stationnement à louer", "stationnement disponible", "garage à louer",
    "chambre à louer", "chambre privée", "room for rent", "private room for rent",
]

FILTER_ROOMMATE_KEYWORDS = [
    "roommate", "looking for roommate", "looking for a roommate",
    "seeking roommate", "colocation", "colocataire", "coloc",
    "cherche colocataire", "je recherche une colocataire",
    "recherche colocataire", "colocataires", "collocataire",
    "shared house", "maison partagée", "maison partagee",
    "partager", "partage des frais",
    "diviser les coûts", "diviser les couts",
    "split the rent", "split rent",
]

FILTER_SHORTTERM_KEYWORDS = [
    "by the week", "per week", "weekly rental", "weekly rate",
    "par semaine", "location à la semaine", "location a la semaine",
    "short term", "short-term", "court terme", "court-terme",
    "minimum weeks", "minimum semaines", "sublet", "sous-location",
    "sous location", "summer sublet", "sublease",
    "per day", "per night", "daily rate", "nightly rate", "daily", "nightly",
    "par jour", "par nuit", "prix par jour", "prix par nuit",
]

FILTER_COMMERCIAL_KEYWORDS = [
    "commercial", "office space", "bureaux à louer", "bureaux a louer",
    "bureau à louer", "bureau a louer", "local à louer", "local a louer",
    "retail space", "warehouse", "entrepôt", "entrepot",
    "espace commercial", "espace pour artiste",
    "artist space", "studio d'artiste",
    "garderie", "daycare", "childcare",
    "chalet",
]

FILTER_GROUPS = [
    ("room_only",   FILTER_ROOM_KEYWORDS),
    ("roommate",    FILTER_ROOMMATE_KEYWORDS),
    ("short_term",  FILTER_SHORTTERM_KEYWORDS),
    ("commercial",  FILTER_COMMERCIAL_KEYWORDS),
    ("rejection",   FILTER_ROOMMATENO_KEYWORDS),
]

# Enrichment Keywords
ELECTRICITY_YES = ["electricity included", "electricity incl", "électricité incluse", "electricite incluse", "hydro inclus", "hydro incluse", "hydro included", "tout inclus", "all inclusive", "all utilities included"]
ELECTRICITY_NO = ["electricity not included", "électricité non incluse", "hydro non inclus", "hydro non incluse", "electricity excluded"]

HEATING_YES = ["heating included", "heat included", "chauffage inclus", "chauffage incluse", "tout inclus", "all inclusive", "all utilities included"]
HEATING_NO = ["heating not included", "heat not included", "chauffage non inclus", "chauffage non incluse", "heating excluded"]

FURNISHED_YES = ["furnished", "fully furnished", "meublé", "meublee", "meublée", "semi-meublé"]
FURNISHED_NO = ["unfurnished", "non meublé"]

PETS_YES = ["pets allowed", "pets ok", "pet friendly", "animaux acceptés", "animaux acceptes", "animaux bienvenus"]
PETS_NO = ["no pets", "pets not allowed", "pet free", "pas d'animaux", "animaux interdits"]

# Regex
ADDRESS_PATTERN = re.compile(
    r'\b(\d{1,5})\s+'
    r'(rue|avenue|ave|boulevard|blvd|chemin|place|côte|cote|ruelle|ch\.?|boul\.?)\s+'
    r'([\w\-\']+(?:\s+[\w\-\']+){0,3})',
    re.IGNORECASE
)

DATE_PATTERN = re.compile(
    r'(?:available|disponible(?:\s+le)?)\s+(\d{1,2}(?:er|ème)?\s+'
    r'(?:january|february|march|april|may|june|july|august|september|october|november|december'
    r'|janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)'
    r'(?:\s+\d{4})?)',
    re.IGNORECASE
)

# ──────────────────────────────────────────────────────────────────────────────
# SEMANTIC FILTER ANCHORS
# ──────────────────────────────────────────────────────────────────────────────

REJECT_ANCHORS = [
    "room for rent in a shared apartment",
    "private bedroom available for rent",
    "chambre privée à louer dans un appartement partagé",
    "chambre à louer",
    "looking for a roommate to share an apartment",
    "seeking colocation partner to split the rent",
    "cherche colocataire pour appartement",
    "short term sublease of an apartment",
    "summer sublet available for a few months",
    "sous-location à court terme",
    "commercial space for rent",
    "office or studio space for artists",
    "local commercial à louer",
    "maison de chambres with shared bathroom",
    "shared housing with multiple tenants"
]

KEEP_ANCHORS = [
    "full apartment for rent",
    "entire apartment available for rent",
    "appartement entier à louer",
    "logement complet disponible",
    "private studio for rent",
    "studio privé tout inclus"
]

# ──────────────────────────────────────────────────────────────────────────────
# MODULE-LEVEL METRO DATA CACHE
# ──────────────────────────────────────────────────────────────────────────────

_metro_data_cache = None

def _load_metro_data() -> dict:
    """
    Lazy-load the pre-normalized metro JSON once per process.
    Falls back to the original JSON if the normalized version does not exist.
    """
    global _metro_data_cache
    if _metro_data_cache is not None:
        return _metro_data_cache

    data_dir = Path(__file__).parent / "data"
    norm_file = data_dir / "metro_stations_montreal_normalized.json"
    orig_file = data_dir / "metro_stations_montreal.json"

    target = norm_file if norm_file.exists() else orig_file
    if target.exists():
        with open(target, encoding="utf-8") as f:
            _metro_data_cache = json.load(f)
    else:
        _metro_data_cache = {}

    return _metro_data_cache

# Bedroom Count Mapping
# 1 1/2, 2 1/2, Studio, Bachelor = 0 bedrooms
# 3 1/2 or 3.5 = 1 bedroom
# 4 1/2 or 4.5 = 2 bedrooms
# 5 1/2 or 5.5 = 3 bedrooms
BEDROOM_MAPPING = {
    "1.5": 0, "1 1/2": 0, "1-1/2": 0, "11/2": 0,
    "2.5": 0, "2 1/2": 0, "2-1/2": 0, "21/2": 0,
    "3.5": 1, "3 1/2": 1, "3-1/2": 1, "31/2": 1,
    "4.5": 2, "4 1/2": 2, "4-1/2": 2, "41/2": 2,
    "5.5": 3, "5 1/2": 3, "5-1/2": 3, "51/2": 3,
    "6.5": 4, "6 1/2": 4, "6-1/2": 4, "61/2": 4,
    "7.5": 5, "7 1/2": 5, "7-1/2": 5, "71/2": 5,
    "studio": 0, "bachelor": 0, "bacalauréat": 0,
    "one-bedroom": 1, "two-bedroom": 2, "three-bedroom": 3, "four-bedroom": 4, "five-bedroom": 5,
    "one bedroom": 1, "two bedrooms": 2, "three bedrooms": 3, "four bedrooms": 4, "five bedrooms": 5,
    "one-bed": 1, "two-bed": 2, "three-bed": 3, "four-bed": 4, "five-bed": 5,
    "one bed": 1, "two bed": 2, "three bed": 3, "four bed": 4, "five bed": 5,
    "1 bedroom": 1, "2 bedrooms": 2, "3 bedrooms": 3, "4 bedrooms": 4, "5 bedrooms": 5,
    "1-bedroom": 1, "2-bedrooms": 2, "3-bedrooms": 3, "4-bedrooms": 4, "5-bedrooms": 5,
    "1-bed": 1, "2-bed": 2, "3-bed": 3, "4-bed": 4, "5-bed": 5,
    "1 bed": 1, "2 bed": 2, "3 bed": 3, "4 bed": 4, "5 bed": 5,
    "1-chambre": 1, "2-chambres": 2, "3-chambres": 3, "4-chambres": 4, "5-chambres": 5,
    "1 chambre": 1, "2 chambres": 2, "3 chambres": 3, "4 chambres": 4, "5 chambres": 5,
    "1-chambre": 1, "2-chambres": 2, "3-chambres": 3, "4-chambres": 4, "5-chambres": 5,
    "1 chambre": 1, "2 chambres": 2, "3 chambres": 3, "4 chambres": 4, "5 chambres": 5
}

# Regex for bedroom patterns
# Matches "3 1/2", "3.5", "1 bedroom", "2 bedrooms", "studio", etc.
BEDROOM_RE = re.compile(
    r'(\d+[\s\-\/]*1\/2|\d+[\.\,]\d| studio | bachelor | bacalauréat |\d+\s*bed(?:room)?s?|\d+\s*chambre?s?)',
    re.IGNORECASE
)

# ──────────────────────────────────────────────────────────────────────────────
# CORE FUNCTIONS
# ──────────────────────────────────────────────────────────────────────────────

def haversine(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on the earth."""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

def get_nearest_metro(lat, lon, station_data):
    min_dist = float('inf')
    best_station = None
    best_line = None
    
    for line, data in station_data.items():
        for station in data["Stations"]:
            s_lat, s_lon = station["coords"]
            dist = haversine(lat, lon, s_lat, s_lon)
            if dist < min_dist:
                min_dist = dist
                best_station = station["name"]
                best_line = line
                
    return best_station, best_line, round(min_dist, 2)

def geocode_address(address, city="Montreal"):
    if not _NOMINATIM_AVAILABLE:
        return None
    try:
        geolocator = _Nominatim(user_agent="apartment_finder_pro")
        location = geolocator.geocode(f"{address}, {city}, Canada")
        if location:
            return location.latitude, location.longitude
    except:
        pass
    return None

def normalize_text(text):
    """Normalize text for better matching (removes punctuation, collapses spaces)."""
    text = re.sub(r'[^a-zA-Z0-9]', ' ', text or "")
    return re.sub(r'\s+', ' ', text).strip().lower()

def extract_metro_from_text(text, station_data):
    """
    Search for explicit station names in text using pre-normalized name fields.
    Falls back to runtime normalize_text if name_normalized is absent.
    """
    norm_text = normalize_text(text)
    padded = f" {norm_text} "
    for line, data in station_data.items():
        for station in data["Stations"]:
            # Use pre-normalized name from JSON if available (zero runtime cost)
            norm_name = station.get("name_normalized") or normalize_text(station["name"])
            if f" {norm_name} " in padded:
                return station["name"], line, station["coords"]
    return None

def text_for_enrichment(listing: dict) -> str:
    # Handle both flat (raw) and nested (Bento) structures
    info = listing.get("info", {}) if isinstance(listing.get("info"), dict) else {}
    title = listing.get("title") or info.get("title") or ""
    desc = listing.get("description") or info.get("description") or ""
    details = listing.get("unit_details") or listing.get("details", {}).get("unit_details") or ""
    
    parts = [title, desc, details]
    return " ".join(str(p) for p in parts if p).lower()

def extract_max_bedrooms(text: str) -> int:
    """
    Finds the maximum bedroom count mentioned in the text.
    Returns -1 if no count is found.
    """
    # 0. Pre-normalize fractions and decimals
    t = text.lower()
    t = t.replace("½", " 1/2")
    t = t.replace(",", ".")
    
    # Standardize variations of "X 1/2" (e.g., "3 1/2", "3-1/2", "31/2", "3 1 / 2")
    t = re.sub(r'(\d+)\s*[\s\-\/]*1\s*/\s*2', r'\1 1/2', t)
    t = re.sub(r'(\d+)1/2', r'\1 1/2', t)
    # Handle "X/2" or "X / 2" if not preceded by " 1" or similar
    t = re.sub(r'(\d+)(?<!1)\s*/\s*2(?!\d)', r'\1 1/2', t)
    
    matches = BEDROOM_RE.findall(f" {t} ")
    if not matches:
        return -1
    
    max_beds = -1
    for m in matches:
        m_low = m.lower().strip()
        
        # 1. Handle "X 1/2" or "X.X" or "X-1/2"
        val = -1
        
        # Try direct mapping first (for X 1/2, X.X, etc.)
        # Clean up separators for lookup
        clean_m = re.sub(r'[\s\-\/]+', ' ', m_low) # "3 - 1/2" -> "3 1 2" -> wait
        # Better: just look for the pattern in our mapping
        
        found_in_mapping = False
        for pattern, bed_count in BEDROOM_MAPPING.items():
            if pattern in m_low:
                val = bed_count
                found_in_mapping = True
                break
        
        if not found_in_mapping:
            # 2. Handle "X bedrooms" or "X chambers"
            if "bed" in m_low or "chambre" in m_low:
                num_match = re.search(r'(\d+)', m_low)
                if num_match:
                    val = int(num_match.group(1))
            
            # 3. Handle Studio/Bachelor (redundant if mapping catches it, but safe)
            elif any(x in m_low for x in ["studio", "bachelor", "bacalauréat"]):
                val = 0
            
            # 4. Final fallback for "X.X" or "X 1/2" not in mapping
            elif "1/2" in m_low or "." in m_low:
                num_match = re.search(r'(\d+)', m_low)
                if num_match:
                    n = int(num_match.group(1))
                    if n <= 2: val = 0
                    else: val = n - 2
            
        if val > max_beds:
            max_beds = val
            
    return max_beds

def keyword_flag(text_lower: str, yes_list: list, no_list: list):
    has_no  = any(kw in text_lower for kw in no_list)
    has_yes = any(kw in text_lower for kw in yes_list)
    if has_no: return False
    if has_yes: return True
    return None

def keyword_filter(listing: dict, min_bedrooms: int = 0, text: str = None):
    """
    Returns (should_reject: bool, reason: str).
    Accepts an optional pre-computed `text` to avoid recomputing text_for_enrichment.
    """
    t = text if text is not None else text_for_enrichment(listing)
    
    # 0. Contextual Safelist (to avoid False Positives)
    # These phrases are common in good ads but contain rejection keywords
    safe_contexts = [
        "quartier recherché", "secteur recherché", "endroit recherché",
        "recherche locataire", "échangeur d'air", "recherche personne seule",
        "quartier recherche", "secteur recherche", "endroit recherche",
        "centre commercial", "centre-commercial", "looking for a good tenant",
        "looking for good tenant", "recherchent bon locataire",
        "recherche bon locataire", "recherchons bon locataire",
        "looking for a tenant", "cherche un locataire", "cherche locataire",
        "distance de marche", "distance de marche du", "à distance de marche",
        "looking for a good tenant"
    ]
    for safe in safe_contexts:
        t = t.replace(safe, "SAFE_CONTEXT")

    # 1. Standard Category Filters
    risky = ["recherche", "cherche", "recherché", "échange", "coloc", "colocataire", "short term"]
    for label, keywords in FILTER_GROUPS:
        for kw in keywords:
            # For risky keywords, enforce word boundaries to avoid partial matches
            if kw in risky:
                if re.search(fr"\b{re.escape(kw)}\b", t):
                     return True, f"{label}:{kw}"
            elif kw in t:
                return True, f"{label}:{kw}"
    
    # 2. Strict Bedroom Verification
    # Find all bedroom mentions and pick the max
    best_detected = extract_max_bedrooms(t)
    
    # If we found explicit bedroom info, and the best one is still too small:
    if best_detected != -1 and best_detected < min_bedrooms:
         return True, f"bedroom_count:max_detected_{best_detected}_below_{min_bedrooms}"

    # Also check the title explicitly for a single restrictive count
    info = listing.get("info", {}) if isinstance(listing.get("info"), dict) else {}
    title_low = (listing.get("title") or info.get("title") or "").lower()
    title_max = extract_max_bedrooms(title_low)
    
    # If the title explicitly says it's a small unit, and doesn't mention better ones
    if title_max != -1 and title_max < min_bedrooms:
        return True, f"bedroom_count:title_max_{title_max}_below_{min_bedrooms}"

    return False, ""

def enrich(listing: dict, text: str = None) -> dict:
    """
    Enriches a listing with geocoding, metro proximity, and utility flags.
    Accepts an optional pre-computed `text` to avoid recomputing text_for_enrichment.
    """
    t = text if text is not None else text_for_enrichment(listing)
    desc_title = (listing.get("description", "") or "") + " " + (listing.get("title", "") or "")
    
    # 1. Address Extraction & Geocoding
    addr_match = ADDRESS_PATTERN.search(desc_title)
    address = addr_match.group(0).strip() if addr_match else ""
    
    lat = listing.pop("latitude", None)
    lon = listing.pop("longitude", None)
    precision = "unverified"
    data_label = "N/A"

    # Load Metro Data — single file read per process via module-level cache
    metro_data = _load_metro_data()

    # Resolve Location & Precision
    if address:
        geo = geocode_address(address)
        if geo:
            lat, lon = geo
            precision = "address"
            data_label = address
    
    if precision == "unverified" and lat and lon:
        # Check if coords were already harvested from page metadata
        precision = "metadata"
        data_label = f"{lat}, {lon}"

    # Priority 3: Text Mention
    text_metro = extract_metro_from_text(t, metro_data)
    if precision == "unverified" and text_metro:
        best_station, best_line, coords = text_metro
        lat, lon = coords
        precision = "text"
        data_label = f"Mentioned: {best_station}"

    # Proximity Logic
    nearest_metro = "Unknown"
    dist_to_metro = None
    if lat and lon and metro_data:
        best_station, best_line, dist = get_nearest_metro(lat, lon, metro_data)
        nearest_metro = f"{best_station} ({best_line})"
        dist_to_metro = dist

    # Utility Flags
    electricity = keyword_flag(t, ELECTRICITY_YES, ELECTRICITY_NO)
    heating     = keyword_flag(t, HEATING_YES, HEATING_NO)
    furnished   = keyword_flag(t, FURNISHED_YES, FURNISHED_NO)
    pets        = keyword_flag(t, PETS_YES, PETS_NO)
    date_match  = DATE_PATTERN.search(t)
    available_date = date_match.group(1).strip() if date_match else ""

    # Rebuild the listing object with nested architecture
    new_listing = {
        "id": listing.get("id", ""),
        "price": listing.get("price", ""),
        "link": listing.get("link", ""),
        "info": {
            "source": listing.get("source", ""),
            "title": listing.get("title", ""),
            "description": listing.get("description", ""),
            "available_date": available_date,
            "images": listing.get("images", [])
        },
        "location_info": {
            "address": address,
            "data": data_label,
            "precision": precision,
            "latitude": lat,
            "longitude": lon,
            "nearest_metro": nearest_metro,
            "distance_to_metro_km": dist_to_metro
        },
        "included": {
            "electricity": electricity,
            "heating": heating
        },
        "details": {
            "unit_details": listing.get("unit_details", ""),
            "is_furnished": furnished,
            "pets_allowed": pets
        },
        "scores": {
            "walk": listing.get("walk_score"),
            "transit": listing.get("transit_score"),
            "bike": listing.get("bike_score")
        }
    }
    
    return new_listing

# ──────────────────────────────────────────────────────────────────────────────
# Stage B (Embeddings)
# ──────────────────────────────────────────────────────────────────────────────

def load_embedding_model():
    from sentence_transformers import SentenceTransformer
    os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
    print("Loading multilingual embedding model...")
    return SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

def build_anchor_embeddings(model):
    """
    Encode and L2-normalize anchor embeddings once.
    Returns unit-normed numpy arrays so downstream cosine similarity
    is a pure dot product — no sklearn needed.
    """
    reject_raw = model.encode(REJECT_ANCHORS, convert_to_numpy=True)
    keep_raw   = model.encode(KEEP_ANCHORS,   convert_to_numpy=True)
    # L2-normalize each row so dot product == cosine similarity
    reject_norm = reject_raw / np.linalg.norm(reject_raw, axis=1, keepdims=True)
    keep_norm   = keep_raw   / np.linalg.norm(keep_raw,   axis=1, keepdims=True)
    return reject_norm, keep_norm

def embedding_filter_batch(snippets: list[str], model, reject_emb, keep_emb, threshold: float = 0.60):
    """
    Batch-encode all snippets at once, then compute cosine similarity via
    numpy dot products (reject_emb and keep_emb are already L2-normalized).

    Returns a list of (should_reject, max_reject_score, reason) tuples,
    one per input snippet.
    """
    if not snippets:
        return []
    emb_raw = model.encode(snippets, convert_to_numpy=True)
    # L2-normalize query embeddings
    norms = np.linalg.norm(emb_raw, axis=1, keepdims=True)
    # Avoid division by zero for zero vectors
    norms = np.where(norms == 0, 1.0, norms)
    emb_norm = emb_raw / norms

    # Shape: (n_snippets, n_anchors)
    reject_scores = emb_norm @ reject_emb.T
    keep_scores   = emb_norm @ keep_emb.T

    results = []
    for i in range(len(snippets)):
        max_reject = float(reject_scores[i].max())
        max_keep   = float(keep_scores[i].max())
        if max_reject >= threshold and max_reject > max_keep + 0.05:
            best_idx = int(reject_scores[i].argmax())
            best_anchor = REJECT_ANCHORS[best_idx]
            results.append((True, max_reject, f"similarity={max_reject:.2f} anchor='{best_anchor[:50]}'"))
        else:
            results.append((False, max_reject, ""))
    return results

# Keep single-item function for backward compatibility
def embedding_filter(listing: dict, model, reject_emb, keep_emb, threshold: float = 0.60):
    """Single-item wrapper around the batch function."""
    info = listing.get("info", {}) if isinstance(listing.get("info"), dict) else {}
    title = listing.get("title", "") or info.get("title", "") or ""
    desc  = listing.get("description", "") or info.get("description", "") or ""
    snippet = (title + " " + desc)[:300]
    results = embedding_filter_batch([snippet], model, reject_emb, keep_emb, threshold)
    return results[0]
