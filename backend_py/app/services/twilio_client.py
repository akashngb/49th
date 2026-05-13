"""Thin wrapper around the Twilio REST API for outbound WhatsApp."""
from __future__ import annotations

import logging
from typing import Optional

from twilio.rest import Client

from app.config import settings

log = logging.getLogger(__name__)

_client: Optional[Client] = None


def client() -> Client:
    global _client
    if _client is None:
        _client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    return _client


def send_whatsapp(to: str, body: str, media_url: str | None = None) -> str:
    """Send a WhatsApp message. Returns the Twilio message SID."""
    kwargs = {
        "from_": settings.twilio_whatsapp_from,
        "to": to,
        "body": body or "",
    }
    if media_url:
        kwargs["media_url"] = [media_url]
    msg = client().messages.create(**kwargs)
    log.info("twilio.send sid=%s status=%s", msg.sid, msg.status)
    return msg.sid
