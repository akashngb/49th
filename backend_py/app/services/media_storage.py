"""Upload media bytes to a public GCS bucket so Twilio can fetch the URL."""
from __future__ import annotations

import logging
import uuid

from app.config import settings

log = logging.getLogger(__name__)


def _gcs_client():
    from google.cloud import storage  # type: ignore

    return storage.Client(project=settings.gcp_project or None)


def upload_audio(audio: bytes, *, content_type: str = "audio/mpeg",
                 extension: str = "mp3") -> str:
    """Upload ``audio`` and return a public HTTPS URL."""
    if not settings.media_bucket:
        raise RuntimeError("MEDIA_BUCKET not configured")

    blob_name = f"voice/{uuid.uuid4().hex}.{extension}"
    client = _gcs_client()
    bucket = client.bucket(settings.media_bucket)
    blob = bucket.blob(blob_name)
    blob.upload_from_string(audio, content_type=content_type)
    # Bucket must have uniform/public read configured on deploy.
    return f"{settings.media_public_base}/{settings.media_bucket}/{blob_name}"
