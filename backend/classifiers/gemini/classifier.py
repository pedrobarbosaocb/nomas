import time

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("google-genai not installed. Please install it to use this script.")

LABEL_MAP = {
    "commercial": 0,
    "parking space": 1,
    "short stay": 2,
    "room(s) in shared apartment/house": 3,
    "studio": 4,
    "1-bed": 5,
    "2-bed": 6,
    "3-bed": 7,
    "4-bed": 8,
    "5+ bedroom apartment": 9,
    "unknown": 10
}

def classify_mock_listings(listings_batch):
    """
    Returns random mock labels mapped to IDs to avoid using the Gemini API during testing.
    """
    import random
    mock_labels = [
        "commercial", "parking space", "short stay", 
        "room(s) in shared apartment/house", "studio", 
        "1-bed", "2-bed", "3-bed", "4-bed", 
        "5+ bedroom apartment", "unknown"
    ]
    labels = {}
    for item in listings_batch:
        string_label = random.choice(mock_labels)
        labels[item["id"]] = {
            "str": string_label,
            "int": LABEL_MAP.get(string_label, 10)
        }
    return labels

def classify_listings(listings_batch, client):
    """
    Calls the Gemini API to label a batch of up to `batch_size` listings at once.
    """
    prompt = (
        "You are an expert real estate data classifier. I will give you a list of apartment listings. "
        "Each listing has an ID. Based on the Title and Description, classify each listing "
        "into one of the following categories: 'commercial', 'parking space', 'short stay', "
        "'room(s) in shared apartment/house', 'studio', '1-bed', '2-bed', '3-bed', '4-bed', "
        "'5+ bedroom apartment', or 'unknown'.\n\n"
        "Return ONLY a strictly valid JSON array matching the provided schema.\n\n"
        "Listings:\n"
    )
    
    for item in listings_batch:
        i_id = item['id']
        title = item.get('title', '').replace('\n', ' ')
        desc = item.get('description', '').replace('\n', ' ')[:500]
        prompt += f"ID: {i_id} | Title: {title} | Desc: {desc}\n"

    schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "category": {
                    "type": "string",
                    "enum": [
                        "commercial", "parking space", "short stay", 
                        "room(s) in shared apartment/house", "studio", 
                        "1-bed", "2-bed", "3-bed", "4-bed", 
                        "5+ bedroom apartment", "unknown"
                    ]
                }
            },
            "required": ["id", "category"]
        }
    }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash-lite',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json", 
                    response_schema=schema,
                    temperature=0.1,
                    max_output_tokens=65536
                )
            )
            text = response.text
            import json
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
                
            results = json.loads(text.strip())
            labels = {}
            for item in results:
                if "id" in item:
                    string_category = item.get("category", "unknown")
                    labels[item["id"]] = {
                        "str": string_category,
                        "int": LABEL_MAP.get(string_category, 10)
                    }
            return labels
        except Exception as e:
            print(f"Error calling Gemini API (Attempt {attempt+1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            
    print("Max retries reached. Skipping batch to prevent saving 'unknown' permanently.")
    return None
        
def test_api_key(client):
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents="Respond 'OK' if you can read this."
        )
        if response.text:
            return True
    except Exception as e:
        print(f"CRITICAL API ERROR: The provided API key is invalid or unauthorized.\nDetails: {e}")
    return False
