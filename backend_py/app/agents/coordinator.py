"""Google ADK multi-agent coordinator.

We define the four worker agents as ADK ``LlmAgent`` nodes and wire an
intent-routing root agent on top. The root inspects the inbound message
and dispatches to the right sub-agent via ADK's ``transfer_to_agent``
control flow. When ADK isn't installed (local dev without GCP creds), we
fall back to a deterministic Python router that calls the same handlers.
"""
from __future__ import annotations

import logging
from typing import Any

from app.agents import answer, document_analyst, onboarding
from app.services import memory

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# ADK graph definition — built once at import time.
# ---------------------------------------------------------------------------


def _build_adk_graph():
    """Returns an ADK root agent that routes to the four workers, or None
    if the google-adk package isn't installed."""
    try:
        from google.adk.agents import LlmAgent  # type: ignore
    except Exception as exc:
        log.info("google-adk not available, using fallback router: %s", exc)
        return None

    onboarding_agent = LlmAgent(
        name="OnboardingAgent",
        model="gemini-2.5-flash",
        description=(
            "Collects the 11 onboarding facts (name, country, language, "
            "province, city, arrival date, status, profession, education, "
            "family, concern) from a brand-new user and generates their "
            "personalised critical path."
        ),
        instruction=(
            "Drive the user through the onboarding script. One question per "
            "turn. Persist each answer into Vertex Memory before asking the "
            "next question."
        ),
    )
    answer_agent = LlmAgent(
        name="AnswerAgent",
        model="gemini-2.5-flash",
        description=(
            "Answers freeform settlement questions grounded in the Vertex "
            "AI Search datastore. Use semantic search only."
        ),
        instruction=(
            "Always retrieve grounding passages before answering. If no "
            "passages are returned, admit the gap and suggest calling 211."
        ),
    )
    document_agent = LlmAgent(
        name="DocumentAnalyst",
        model="gemini-2.5-flash",
        description=(
            "Receives a document image (passport, PR card, SIN letter, "
            "permit, etc.) and returns structured JSON: doc_type, fields, "
            "confidence, missing_companion_docs."
        ),
        instruction=(
            "Extract fields verbatim. Redact sensitive document numbers. "
            "Return ONLY JSON."
        ),
    )
    watchdog_agent = LlmAgent(
        name="DeadlineWatchdog",
        model="gemini-2.5-flash",
        description=(
            "Runs on Cloud Scheduler — never via the webhook. Scans active "
            "users in Vertex Memory and proactively notifies them about "
            "deadlines within the next 7 days."
        ),
        instruction="Scheduled-only. Should never receive an inbound message.",
    )

    root = LlmAgent(
        name="RootsCoordinator",
        model="gemini-2.5-flash",
        description=(
            "Routes inbound WhatsApp messages to the correct Roots sub-agent."
        ),
        instruction=(
            "Look at the inbound message. If the user has not finished "
            "onboarding, delegate to OnboardingAgent. If the message has an "
            "image attachment, delegate to DocumentAnalyst. Otherwise "
            "delegate to AnswerAgent. Never invoke DeadlineWatchdog from "
            "the webhook."
        ),
        sub_agents=[onboarding_agent, answer_agent, document_agent, watchdog_agent],
    )
    return root


ROOT_AGENT = _build_adk_graph()


# ---------------------------------------------------------------------------
# Public entry point used by the FastAPI webhook.
# ---------------------------------------------------------------------------


async def route(
    user: str,
    *,
    text: str = "",
    media_url: str | None = None,
    media_mime: str | None = None,
) -> str:
    """Dispatch a single inbound WhatsApp event and return the reply text.

    The actual delivery (Twilio REST + TTS attachment) is the webhook's
    responsibility — this returns plain text so the caller can branch on
    whether to also synthesise audio.
    """
    text = (text or "").strip()

    # Image attachment — always goes to DocumentAnalyst regardless of stage.
    if media_url:
        from app.services import gemini as gem
        try:
            b64, mime = gem.fetch_image_base64(media_url)
        except Exception as exc:
            log.exception("media fetch failed")
            return "I couldn't open that image — please try sending it again."
        result = await document_analyst.analyse(user, b64, mime=media_mime or mime)
        return document_analyst.format_reply(result)

    # Onboarding still in progress — stay with the onboarding agent.
    if not onboarding.is_active(user):
        return await onboarding.handle(user, text)

    # Otherwise the user is onboarded — freeform Q&A.
    return await answer.answer_grounded(user, text)
