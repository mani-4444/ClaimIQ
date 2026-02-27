import uuid
from fastapi import UploadFile
from app.db.supabase_client import get_supabase_client
from app.utils.logger import logger
from app.utils.constants import ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE


class StorageService:
    BUCKET = "claim-images"

    def __init__(self):
        self.client = get_supabase_client()

    async def upload_image(self, file: UploadFile, user_id: str) -> str:
        """Upload an image to Supabase Storage and return its public URL."""
        # Validate file type
        if file.content_type not in ALLOWED_IMAGE_TYPES:
            raise ValueError(f"Invalid file type: {file.content_type}. Only JPG/PNG accepted.")

        # Read file content
        content = await file.read()

        # Validate file size
        if len(content) > MAX_IMAGE_SIZE:
            raise ValueError(f"File size exceeds {MAX_IMAGE_SIZE // (1024*1024)}MB limit.")

        # Generate unique path
        ext = file.filename.split(".")[-1] if file.filename else "jpg"
        file_path = f"{user_id}/{uuid.uuid4().hex}.{ext}"

        # Upload to Supabase Storage
        self.client.storage.from_(self.BUCKET).upload(
            path=file_path,
            file=content,
            file_options={"content-type": file.content_type},
        )

        # Get public URL
        public_url = self.client.storage.from_(self.BUCKET).get_public_url(file_path)

        logger.info(f"Image uploaded: {file_path}")
        return public_url

    async def delete_image(self, file_path: str) -> None:
        """Delete an image from Supabase Storage."""
        try:
            self.client.storage.from_(self.BUCKET).remove([file_path])
            logger.info(f"Image deleted: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to delete image {file_path}: {e}")

    async def upload_processed_image(
        self,
        image_bytes: bytes,
        user_id: str,
        claim_id: str,
        index: int,
    ) -> str:
        """Upload a YOLO-annotated image and return its public URL."""
        file_path = (
            f"{user_id}/{claim_id}/processed_{index + 1}_{uuid.uuid4().hex[:8]}.jpg"
        )

        self.client.storage.from_(self.BUCKET).upload(
            path=file_path,
            file=image_bytes,
            file_options={"content-type": "image/jpeg"},
        )

        public_url = self.client.storage.from_(self.BUCKET).get_public_url(file_path)
        logger.info(f"Processed image uploaded: {file_path}")
        return public_url
