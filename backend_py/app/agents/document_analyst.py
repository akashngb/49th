"""DocumentAnalyst — accepts a base64 image from WhatsApp and runs it
through Gemini 2.5 Flash multimodal. Stores the result in memory and
returns a structured JSON payload."""
from __future__ import annotations

import logging
from datetime import date
from typing import Any

from app.services import gemini, memory

log = logging.getLogger(__name__)


async def analyse(user: str, image_b64: str, mime: str = "image/jpeg") -> dict[str, Any]:
    """Return ``{doc_type, fields, confidence, missing_companion_docs}``."""
    parsed = await gemini.analyse_document(image_b64, mime=mime)

    # Defensive shape — fall back to empty values if Gemini drifted.
    out = {
        "doc_type": parsed.get("doc_type", "unknown"),
        "fields": parsed.get("fields", {}) or {},
        "confidence": float(parsed.get("confidence", 0.0) or 0.0),
        "missing_companion_docs": parsed.get("missing_companion_docs", []) or [],
    }

    # Persist the document into the user's memory namespace, so future
    # turns and the watchdog can reason over it.
    docs = memory.get(user, "documents", []) or []
    docs.append({**out, "ts": date.today().isoformat()})
    memory.put(user, "documents", docs)

    # If the doc has an expiry date, surface it as a deadline.
    expiry = (out["fields"].get("expiry_date") or "").strip()
    if expiry:
        deadlines = memory.get(user, "deadlines", []) or []
        deadlines.append({
            "task_id": f"doc-expiry-{out['doc_type'].lower().replace(' ', '-')}",
            "title": f"{out['doc_type']} expires",
            "due_date": expiry,
        })
        memory.put(user, "deadlines", deadlines)

    return out


def format_reply(result: dict[str, Any]) -> str:
    """Human-readable WhatsApp reply summarising the structured result."""
    fields = result.get("fields", {})
    field_lines = "\n".join(f"• {k}: {v}" for k, v in fields.items() if v)
    missing = result.get("missing_companion_docs") or []
    missing_block = ""
    if missing:
        missing_block = "\n\nDocuments you may still need:\n" + "\n".join(
            f"• {m}" for m in missing
        )
    confidence = result.get("confidence", 0)
    return (
        f"*{result.get('doc_type','Document')}* detected "
        f"(confidence {confidence:.0%})\n\n{field_lines}{missing_block}"
    )
