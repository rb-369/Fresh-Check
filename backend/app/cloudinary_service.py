"""
FreshCheck Cloudinary Storage Service
=====================================
Uploads uploaded produce inspection photos to Cloudinary so scan images
can be preserved in MongoDB history and displayed in the frontend.
"""

import os
import io
import cloudinary
import cloudinary.uploader
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from project root .env
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

class CloudinaryService:
    def __init__(self):
        self.is_configured = False
        self._init_cloudinary()

    def _init_cloudinary(self):
        cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
        api_key = os.getenv("CLOUDINARY_API_KEY", "").strip()
        api_secret = os.getenv("CLOUDINARY_API_SECRET", "").strip()
        cloudinary_url = os.getenv("CLOUDINARY_URL", "").strip()

        if cloudinary_url:
            cloudinary.config(cloudinary_url=cloudinary_url, secure=True)
            self.is_configured = True
            print("[Cloudinary] Configured using CLOUDINARY_URL.")
        elif cloud_name and api_key and api_secret:
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True
            )
            self.is_configured = True
            print(f"[Cloudinary] Configured for cloud: '{cloud_name}'.")
        else:
            print("[Cloudinary] Notice: Cloudinary credentials not configured. Image URLs will not be saved to Cloudinary.")
            self.is_configured = False

    def upload_image_bytes(self, image_bytes: bytes, filename: Optional[str] = None) -> Optional[Dict[str, str]]:
        """
        Uploads image byte payload directly to Cloudinary folder 'freshcheck_scans'.
        Returns dict with 'url' and 'public_id' on success, or None on failure.
        """
        if not self.is_configured:
            return None

        try:
            # Upload using in-memory BytesIO stream
            stream = io.BytesIO(image_bytes)
            upload_result = cloudinary.uploader.upload(
                stream,
                folder="freshcheck_scans",
                resource_type="image",
                transformation=[
                    {"width": 800, "height": 800, "crop": "limit"},
                    {"quality": "auto", "fetch_format": "auto"}
                ]
            )

            return {
                "url": upload_result.get("secure_url") or upload_result.get("url"),
                "public_id": upload_result.get("public_id")
            }
        except Exception as e:
            print(f"[Cloudinary] Upload failed: {e}")
            return None

    def delete_image(self, public_id: str) -> bool:
        """Deletes an image from Cloudinary by its public ID."""
        if not self.is_configured or not public_id:
            return False

        try:
            res = cloudinary.uploader.destroy(public_id)
            return res.get("result") == "ok"
        except Exception as e:
            print(f"[Cloudinary] Error deleting image {public_id}: {e}")
            return False

# Singleton instance
cloudinary_service = CloudinaryService()
