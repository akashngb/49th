"""Minimal TwiML builder. Avoids pulling the full twilio package just for XML."""
from __future__ import annotations

from xml.sax.saxutils import escape


def empty_response() -> str:
    """Twilio webhooks must return 200 with valid TwiML even when we send
    the actual reply out-of-band via the REST API."""
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'


def message_response(body: str, media_url: str | None = None) -> str:
    parts = [escape(body) if body else ""]
    media = f"<Media>{escape(media_url)}</Media>" if media_url else ""
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f"<Response><Message>{parts[0]}{media}</Message></Response>"
    )
