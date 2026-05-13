"""Gemini calls used outside the ADK agents.

The ADK agents drive their own Gemini conversation, but a handful of
non-agent flows (critical-path generation, conversational onboarding
phrasing, raw multimodal extraction) still need direct access.
"""
from __future__ import annotations

import base64
import json
import logging
import re
from typing import Any

import httpx

from app.config import settings

log = logging.getLogger(__name__)

_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def _api_key() -> str:
    import os

    key = os.getenv("GEMINI_API_KEY", "")
    if not key:
        raise RuntimeError("GEMINI_API_KEY not configured")
    return key


def _strip_fences(text: str) -> str:
    return re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()


async def generate_critical_path(profile: dict[str, Any]) -> dict[str, Any]:
    """Return ``{"tasks": [...]}`` — same shape the JS coordinator expects."""
    prompt = (
        "You are an expert on Canadian immigration and newcomer onboarding.\n"
        "Given this immigrant profile, generate a sequenced critical path of "
        "tasks for their first 90 days.\n"
        "Return JSON only. No markdown. No backticks. No explanation.\n\n"
        f"Profile: {json.dumps(profile, default=str)}\n\n"
        "Return exactly this structure with 5-7 tasks: "
        '{"tasks":[{"id":"sin","title":"...","description":"...",'
        '"daysFromArrival":1,"urgency":"critical","estimatedTime":"2-3 hours",'
        '"dueDate":"YYYY-MM-DD"}]}'
    )
    text = await _gen(prompt)
    return json.loads(_strip_fences(text))


async def next_onboarding_question(prior_qa: list[str], target_topic: str) -> str:
    context = ""
    if prior_qa:
        context = "Here is what we know about the user so far:\n" + "\n".join(prior_qa) + "\n\n"

    prompt = (
        "You are Roots, a warm AI companion for newcomers to Canada.\n"
        "You are currently onboarding a new user.\n"
        f"{context}"
        "It is your turn to ask the user a question. The core information you "
        f"need to gather is:\n\"{target_topic}\"\n\n"
        "Rephrase this core question into a single, naturally conversational "
        "and friendly message. You can briefly acknowledge their previous "
        "answer if it makes sense, but keep it short.\n"
        "DO NOT provide any advice yet, just ask the question.\n"
        "CRITICAL: Match the language the user has been writing in.\n"
        "Your entire response must be ONLY the question (1-2 sentences max)."
    )
    return (await _gen(prompt)).strip()


async def classify_interrupt(last_question: str, message: str) -> bool:
    prompt = (
        f"User is in onboarding. Last question asked: \"{last_question}\"\n\n"
        f"User said: \"{message}\"\n\n"
        "Is the user asking a question, expressing a concern, or asking for "
        "help that's UNRELATED to answering the specific question above? "
        "Respond with only 'YES' or 'NO'."
    )
    out = (await _gen(prompt)).strip().upper()
    return "YES" in out


async def analyse_document(image_b64: str, mime: str = "image/jpeg") -> dict[str, Any]:
    """DocumentAnalyst's actual Gemini call — multimodal extraction."""
    prompt = (
        "You are a strict data extraction assistant for Canadian immigrant "
        "documents.\n"
        "1. Identify the document type (passport, visa, PR card, SIN letter, "
        "study permit, work permit, driver's license, etc.).\n"
        "2. Extract key fields: name, document_number, expiry_date, "
        "issuing_country, plus any document-specific fields you see.\n"
        "3. NEVER output sensitive ID numbers in plain text. Always redact as "
        "\"[REDACTED XXXXX]\".\n"
        "4. Provide a confidence between 0 and 1.\n"
        "5. List intuitively missing companion documents in "
        "missing_companion_docs.\n\n"
        "Return ONLY JSON matching this shape:\n"
        '{"doc_type":"...","fields":{"name":"...","document_number":"[REDACTED XXXXX]",'
        '"expiry_date":"YYYY-MM-DD","issuing_country":"..."},'
        '"confidence":0.0,"missing_companion_docs":["..."]}'
    )

    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": mime, "data": image_b64}},
                ]
            }
        ],
        "generationConfig": {"response_mime_type": "application/json"},
    }
    text = await _post(body)
    return json.loads(_strip_fences(text))


async def _gen(prompt: str) -> str:
    return await _post({"contents": [{"parts": [{"text": prompt}]}]})


async def _post(body: dict[str, Any]) -> str:
    url = f"{_API_BASE}/{settings.gemini_model}:generateContent?key={_api_key()}"
    async with httpx.AsyncClient(timeout=60) as http:
        r = await http.post(url, json=body)
        r.raise_for_status()
        data = r.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


def fetch_image_base64(url: str) -> tuple[str, str]:
    """Synchronously download a Twilio media URL and return (b64, mime)."""
    import requests

    auth = (settings.twilio_account_sid, settings.twilio_auth_token)
    r = requests.get(url, auth=auth, timeout=30)
    r.raise_for_status()
    mime = r.headers.get("Content-Type", "image/jpeg").split(";")[0]
    return base64.b64encode(r.content).decode("ascii"), mime
