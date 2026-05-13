"""AnswerAgent — grounded Q&A over the Vertex AI Search datastore."""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings
from app.services import memory, vertex_search

log = logging.getLogger(__name__)

_SYSTEM = (
    "You are Roots, a warm, knowledgeable AI companion for newcomers to "
    "Canada. Answer the user's question using ONLY the provided grounding "
    "passages. If the passages don't cover the question, say so honestly and "
    "suggest calling 211. Always reply in the same language the user wrote in. "
    "Be concise (2-3 short paragraphs max) and end with one practical next step."
)


async def answer_grounded(user: str, question: str) -> str:
    profile = memory.get(user, "profile") or {}
    hits = vertex_search.query(question, top_k=5)
    grounding = "\n\n".join(
        f"[{i+1}] {h.title}\n{h.snippet}\nSource: {h.uri}"
        for i, h in enumerate(hits)
    ) or "(no grounding passages retrieved)"

    profile_blob = ", ".join(f"{k}: {v}" for k, v in profile.items() if v)
    user_block = (
        f"User profile: {profile_blob or 'unknown'}\n\n"
        f"Question: {question}\n\n"
        f"Grounding passages:\n{grounding}"
    )

    answer = await _gemini_synthesise(_SYSTEM, user_block)

    # Persist the turn so the next message has continuity.
    memory.append_message(user, "user", question)
    memory.append_message(user, "model", answer)
    return answer


async def _gemini_synthesise(system: str, user_block: str) -> str:
    import os

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not configured")

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent?key={api_key}"
    )
    body: dict[str, Any] = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user_block}]}],
    }
    async with httpx.AsyncClient(timeout=60) as http:
        r = await http.post(url, json=body)
        r.raise_for_status()
        data = r.json()
    parts = data["candidates"][0]["content"]["parts"]
    return (parts[0].get("text") or "").strip() or "I'm here to help."
