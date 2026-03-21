import uvicorn
import os
from dotenv import load_dotenv

if __name__ == "__main__":
    # Load backend environment variables
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
    
    # Run the FastAPI app defined in backend/api/main.py
    # We use "api.main:app" because this script runs from the backend/ root.
    print("Starting Nomas API Server on http://localhost:8000 ...")
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
