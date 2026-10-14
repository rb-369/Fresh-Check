"""
FreshCheck MongoDB Atlas Database Client
========================================
Manages scan history storage, querying, and deletion in MongoDB Atlas.
Includes graceful fallback if MongoDB URI is not yet configured.
"""

import os
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from bson import ObjectId
from pymongo import MongoClient, DESCENDING
from pymongo.errors import ConnectionFailure, PyMongoError
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from project root .env
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URI = os.getenv("MONGO_URI", "").strip()
DB_NAME = os.getenv("MONGO_DB_NAME", "freshcheck").strip()

class FreshCheckDB:
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self.collection = None
        self.is_connected = False
        self._init_connection()

    def _init_connection(self):
        if not MONGO_URI:
            print("[FreshCheck DB] Notice: MONGO_URI is not set. History will not persist to MongoDB Atlas.")
            self.is_connected = False
            return

        try:
            # Set 5-second server selection timeout so startup never hangs if URI is invalid
            self.client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client[DB_NAME]
            self.collection = self.db["history"]
            # Create index on created_at for fast descending history queries
            self.collection.create_index([("created_at", DESCENDING)])
            self.is_connected = True
            print(f"[FreshCheck DB] Successfully connected to MongoDB Atlas (DB: '{DB_NAME}', collection: 'history').")
        except ConnectionFailure as cf:
            print(f"[FreshCheck DB] Connection error: Unable to reach MongoDB Atlas server: {cf}")
            self.is_connected = False
        except Exception as e:
            print(f"[FreshCheck DB] Initialization warning: {e}")
            self.is_connected = False

    def check_health(self) -> Dict[str, Any]:
        """Returns live MongoDB connection status."""
        if not self.is_connected or self.client is None:
            return {"status": "disconnected", "has_uri": bool(MONGO_URI), "db_name": DB_NAME}
        try:
            self.client.admin.command('ping')
            count = self.collection.count_documents({})
            return {"status": "connected", "has_uri": True, "db_name": DB_NAME, "total_scans": count}
        except Exception as e:
            return {"status": "error", "error": str(e), "has_uri": True}

    def save_scan(self, record: Dict[str, Any]) -> Optional[str]:
        """Inserts a new scan history entry into MongoDB Atlas."""
        if not self.is_connected or self.collection is None:
            return None

        try:
            doc = {
                "image_url": record.get("image_url"),
                "cloudinary_public_id": record.get("cloudinary_public_id"),
                "predicted_class": record.get("predicted_class"),
                "display_name": record.get("display_name"),
                "produce_type": record.get("produce_type"),
                "freshness_status": record.get("freshness_status"),
                "model_confidence": record.get("model_confidence"),
                "model_confidence_percent": record.get("model_confidence_percent"),
                "visual_assessment": record.get("visual_assessment"),
                "safety_advisory": record.get("safety_advisory"),
                "inference_time_ms": record.get("inference_time_ms"),
                "class_probabilities": record.get("class_probabilities", {}),
                "created_at": datetime.now(timezone.utc)
            }
            result = self.collection.insert_one(doc)
            return str(result.inserted_id)
        except PyMongoError as pe:
            print(f"[FreshCheck DB] Failed to save scan record: {pe}")
            return None

    def get_history(
        self,
        limit: int = 50,
        skip: int = 0,
        produce_type: Optional[str] = None,
        freshness_status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Retrieves scan history with optional filters."""
        if not self.is_connected or self.collection is None:
            return []

        query = {}
        if produce_type and produce_type.lower() != "all":
            query["produce_type"] = {"$regex": f"^{produce_type}$", "$options": "i"}
        if freshness_status and freshness_status.lower() != "all":
            query["freshness_status"] = freshness_status.lower()

        try:
            cursor = (
                self.collection.find(query)
                .sort("created_at", DESCENDING)
                .skip(skip)
                .limit(limit)
            )

            records = []
            for doc in cursor:
                doc["id"] = str(doc.pop("_id"))
                if isinstance(doc.get("created_at"), datetime):
                    doc["created_at"] = doc["created_at"].isoformat()
                records.append(doc)
            return records
        except PyMongoError as pe:
            print(f"[FreshCheck DB] Error fetching history: {pe}")
            return []

    def delete_scan(self, scan_id: str) -> bool:
        """Deletes a single scan by ID."""
        if not self.is_connected or self.collection is None:
            return False

        try:
            result = self.collection.delete_one({"_id": ObjectId(scan_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"[FreshCheck DB] Error deleting scan {scan_id}: {e}")
            return False

    def clear_history(self) -> int:
        """Deletes all scan records from history."""
        if not self.is_connected or self.collection is None:
            return 0

        try:
            result = self.collection.delete_many({})
            return result.deleted_count
        except Exception as e:
            print(f"[FreshCheck DB] Error clearing history: {e}")
            return 0

# Singleton instance
db_client = FreshCheckDB()
