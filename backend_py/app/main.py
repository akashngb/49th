"""FastAPI entry point — Twilio WhatsApp webhook + Cloud Scheduler hook.

The Twilio webhook returns empty TwiML synchronously and pushes the
agent + TTS + outbound work onto a FastAPI ``BackgroundTask``. Twilio's
webhook timeout is ~15 seconds; a Gemini → Vertex Search → ElevenLabs
round-trip can easily exceed that, which would otherwise drop messages
silently.
"""
from __future__ import annotations

import logging
import os

from fastapi import BackgroundTasks, FastAPI, Form, Request, Response
from fastapi.responses import JSONResponse, PlainTextResponse

from twilio.request_validator import RequestValidator

from app.agents import coordinator, deadline_watchdog
from app.config import settings
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
    background: BackgroundTasks,
    From: str = Form(""),
    Body: str = Form(""),
    NumMedia: str = Form("0"),
    MediaUrl0: str = Form(""),
    MediaContentType0: str = Form(""),
) -> Response:
    """Twilio WhatsApp webhook. Acks immediately; agent work runs after the
    response is flushed via BackgroundTasks."""
    if not await _verify_twilio(request):
        return Response(status_code=403)

    has_media = (NumMedia or "0") != "0" and bool(MediaUrl0)
    log.info("inbound from=%s has_media=%s body_len=%d", From, has_media, len(Body or ""))

    background.add_task(
        _process_inbound,
        From,
        Body,
        MediaUrl0 if has_media else None,
        MediaContentType0 or None,
    )
    return Response(content=empty_response(), media_type="application/xml")


async def _process_inbound(
    from_: str,
    body: str,
    media_url: str | None,
    media_mime: str | None,
) -> None:
    """Run the full agent pipeline and send the reply out-of-band."""
    try:
        reply_text = await coordinator.route(
            from_,
            text=body,
            media_url=media_url,
            media_mime=media_mime,
        )
    except Exception:
        log.exception("coordinator failure")
        reply_text = "Sorry — something went wrong on my end. Please try again."

    try:
        media = await _maybe_tts(reply_text)
        twilio_client.send_whatsapp(from_, reply_text, media_url=media)
    except Exception:
        log.exception("outbound send failed for %s", from_)


async def _verify_twilio(request: Request) -> bool:
    """Validate the X-Twilio-Signature header. Skipped when the auth token
    isn't configured (local dev, ngrok-only)."""
    token = settings.twilio_auth_token
    if not token:
        return True
    signature = request.headers.get("X-Twilio-Signature", "")
    if not signature:
        return False
    # Twilio signs the full https URL it called; behind Cloud Run's HTTPS
    # load balancer, we rebuild it from X-Forwarded-Proto + Host.
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host") or request.headers.get("host") or ""
    url = f"{proto}://{host}{request.url.path}"
    form_data = await request.form()
    params = {k: form_data[k] for k in form_data.keys()}
    return RequestValidator(token).validate(url, params, signature)


async def _maybe_tts(text: str) -> str | None:
    """Best-effort voice-note generation. Skipped for very long replies to
    bound cost and latency; failures fall through to text-only."""
    if not text or len(text) > 1500:
        return None
    try:
        audio = await elevenlabs_tts.synthesize(text)
        return media_storage.upload_audio(audio)
    except Exception as exc:
        log.warning("tts disabled this turn: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Cloud Scheduler entry point — same Cloud Run service.
# ---------------------------------------------------------------------------


@app.post("/jobs/deadline-watchdog")
def watchdog_endpoint(request: Request) -> JSONResponse:
    expected = os.getenv("SCHEDULER_SHARED_SECRET", "")
    if expected:
        provided = request.headers.get("X-Scheduler-Secret", "")
        if provided != expected:
            return JSONResponse({"error": "unauthorized"}, status_code=401)
    # When OIDC is configured on the scheduler job, Cloud Run validates the
    # token at the edge before this handler runs.

    summary = deadline_watchdog.run()
    return JSONResponse(summary)


@app.get("/")
def root() -> PlainTextResponse:
    return PlainTextResponse("Roots backend ok — POST /webhook for Twilio.")
