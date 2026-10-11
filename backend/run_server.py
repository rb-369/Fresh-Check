"""
FreshCheck FastAPI Server Launcher
==================================
Starts the Uvicorn ASGI server hosting the FreshCheck API.
"""

import sys
import uvicorn
from pathlib import Path

# Add project root to sys.path so backend and ml_pipeline can import cleanly
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

if __name__ == "__main__":
    print(f"Starting FreshCheck API server from root: {ROOT_DIR}")
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
