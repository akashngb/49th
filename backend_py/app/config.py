"""Runtime configuration pulled from env."""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    gcp_project: str = os.getenv("GCP_PROJECT", "")
    gcp_location: str = os.getenv("GCP_LOCATION", "us-central1")

    # Gemini / Vertex
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    vertex_search_datastore: str = os.getenv("VERTEX_SEARCH_DATASTORE", "")
    vertex_search_location: str = os.getenv("VERTEX_SEARCH_LOCATION", "global")
    vertex_memory_corpus: str = os.getenv("VERTEX_MEMORY_CORPUS", "")

    # Twilio
    twilio_account_sid: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_auth_token: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_whatsapp_from: str = os.getenv("TWILIO_WHATSAPP_FROM", "")

    # ElevenLabs
    elevenlabs_api_key: str = os.getenv("ELEVENLABS_API_KEY", "")
    elevenlabs_voice_id: str = os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")

    # Media bucket — public-read GCS bucket for Twilio media URLs
    media_bucket: str = os.getenv("MEDIA_BUCKET", "")
    media_public_base: str = os.getenv("MEDIA_PUBLIC_BASE", "https://storage.googleapis.com")

    # Deadline watchdog
    deadline_window_days: int = int(os.getenv("DEADLINE_WINDOW_DAYS", "7"))


settings = Settings()
