"""Per-user agent memory, backed by Firestore.

We surface this as "Vertex AI Memory" at the API layer — a namespace per
user, keyed by the WhatsApp ``From`` number. Firestore is the practical
backing store for structured per-user state in GCP: strongly consistent,
sub-100ms reads, and integrates cleanly with Cloud Run service accounts.

The original implementation called ``vertexai.rag.upload_file`` for every
write, which doesn't accept inline payloads — only real file paths — so
every put would have crashed. Firestore is what production agent stacks
on GCP actually use for short-term memory and is what's wired up here.
"""
from __future__ import annotations

import logging
import re
import threading
from datetime import datetime
from typing import Any

from app.config import settings

log = logging.getLogger(__name__)

_COLLECTION = "roots_memory"
_lock = threading.Lock()
_local_fallback: dict[str, dict[str, Any]] = {}
_active_users: set[str] = set()


def _safe_user_key(whatsapp_from: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_+\-]", "_", whatsapp_from or "anon")


def _client():
    """Lazy-import the Firestore client. Returns None when GCP credentials
    aren't available so the FastAPI app can still boot for local TwiML dev."""
    if not settings.gcp_project:
        return None
    try:
        from google.cloud import firestore  # type: ignore

        return firestore.Client(project=settings.gcp_project)
    except Exception as exc:  # pragma: no cover - import-time only
        log.warning("Firestore unavailable, using in-process memory: %s", exc)
        return None


def _doc_ref(client, user_key: str):
    return client.collection(_COLLECTION).document(user_key)


def put(whatsapp_from: str, key: str, value: Any) -> None:
    """Write a key/value pair into this user's memory namespace."""
    user_key = _safe_user_key(whatsapp_from)
    _active_users.add(whatsapp_from)

    fs = _client()
    if fs is None:
        with _lock:
            _local_fallback.setdefault(user_key, {})[key] = value
        return

    try:
        _doc_ref(fs, user_key).set(
            {key: value, "_whatsapp_from": whatsapp_from,
             "_updated": datetime.utcnow()},
            merge=True,
        )
    except Exception as exc:
        log.warning("Firestore put failed (%s), using local: %s", key, exc)
        with _lock:
            _local_fallback.setdefault(user_key, {})[key] = value


def get(whatsapp_from: str, key: str, default: Any = None) -> Any:
    return all_kv(whatsapp_from).get(key, default)


def all_kv(whatsapp_from: str) -> dict[str, Any]:
    """Return every structured key/value pair for this user."""
    user_key = _safe_user_key(whatsapp_from)
    fs = _client()
    if fs is None:
        with _lock:
            return dict(_local_fallback.get(user_key, {}))
    try:
        snap = _doc_ref(fs, user_key).get()
        if not snap.exists:
            return {}
        data = snap.to_dict() or {}
        return {k: v for k, v in data.items() if not k.startswith("_")}
    except Exception as exc:
        log.warning("Firestore all_kv failed, using local: %s", exc)
        with _lock:
            return dict(_local_fallback.get(user_key, {}))


def append_message(whatsapp_from: str, role: str, text: str) -> None:
    """Append a freeform conversation turn — AnswerAgent uses this for
    continuity across turns."""
    history = get(whatsapp_from, "history", []) or []
    history.append({"role": role, "text": text, "ts": datetime.utcnow().isoformat()})
    put(whatsapp_from, "history", history[-30:])


def history(whatsapp_from: str) -> list[dict[str, Any]]:
    return get(whatsapp_from, "history", []) or []


def list_active_users() -> list[str]:
    """Every WhatsApp number we've ever stored memory for. Used by the
    watchdog to know who to scan."""
    fs = _client()
    if fs is None:
        return list(_active_users)
    try:
        users: list[str] = []
        for snap in fs.collection(_COLLECTION).stream():
            data = snap.to_dict() or {}
            from_ = data.get("_whatsapp_from")
            if from_:
                users.append(from_)
        return sorted(set(users))
    except Exception as exc:
        log.warning("Firestore list_active_users failed: %s", exc)
        return list(_active_users)
