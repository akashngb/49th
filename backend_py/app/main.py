"""FastAPI entry point — Twilio WhatsApp webhook + Cloud Scheduler hook."""
from __future__ import annotations

import logging
import os

from fastapi import FastAPI, Form, Request, Response
from fastapi.responses import JSONResponse, PlainTextResponse

from app.agents import coordinator, deadline_watchdog
from app.services import elevenlabs_tts, media_storage, twilio_client
from app.twiml import empty_response

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger("roots.web")

app = FastAPI(title="Roots WhatsApp Backend")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/webhook")
async def webhook(
    request: Request,
    From: str = Form(""),
    Body: str = Form(""),
    NumMedia: str = Form("0"),
    MediaUrl0: str = Form(""),
    MediaContentType0: str = Form(""),
) -> Response:
    """Twilio WhatsApp webhook.

    Twilio expects a synchronous TwiML response, but our agent calls
    (Gemini, Vertex Search, ElevenLabs) can each take several seconds.
    We answer Twilio with empty TwiML immediately and send the real reply
    via the REST API so the caller never sees a timeout.
    """
    has_media = (NumMedia or "0") != "0" and bool(MediaUrl0)
    log.info("inbound from=%s has_media=%s body_len=%d", From, has_media, len(Body or ""))

    try:
        reply_text = await coordinator.route(
            From,
            text=Body,
            media_url=MediaUrl0 if has_media else None,
            media_mime=MediaContentType0 or None,
        )
    except Exception:
        log.exception("coordinator failure")
        reply_text = "Sorry — something went wrong on my end. Please try again."

    # Synthesise voice note + send via Twilio REST (out-of-band).
    try:
        media_url = await _maybe_tts(reply_text)
        twilio_client.send_whatsapp(From, reply_text, media_url=media_url)
    except Exception:
        log.exception("outbound send failed")

    # Acknowledge Twilio synchronously with empty TwiML.
    return Response(content=empty_response(), media_type="application/xml")


async def _maybe_tts(text: str) -> str | None:
    """Best-effort voice note generation. Failures fall through to text-only."""
    if not text or len(text) > 1500:
        # Skip TTS for very long replies — keeps cost and latency bounded.
        return None
    try:
        audio = await elevenlabs_tts.synthesize(text)
        return media_storage.upload_audio(audio)
    except Exception as exc:
        log.warning("tts disabled this turn: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Cloud Scheduler entry point — keep this on the same Cloud Run service so
# we don't have to deploy a second image.
# ---------------------------------------------------------------------------


@app.post("/jobs/deadline-watchdog")
def watchdog_endpoint(request: Request) -> JSONResponse:
    expected = os.getenv("SCHEDULER_SHARED_SECRET", "")
    if expected:
        provided = request.headers.get("X-Scheduler-Secret", "")
        if provided != expected:
            return JSONResponse({"error": "unauthorized"}, status_code=401)

    summary = deadline_watchdog.run()
    return JSONResponse(summary)


@app.get("/")
def root() -> PlainTextResponse:
    return PlainTextResponse("Roots backend ok — POST /webhook for Twilio.")
