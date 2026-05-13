"""Vertex AI Memory Bank wrapper.

One memory namespace per user, keyed by the WhatsApp ``From`` number
(``whatsapp:+14155551234``). Every agent reads/writes through this module.

The Memory Bank's native API stores arbitrary fact strings inside a
``MemoryCorpus`` scoped to a ``user_id``. We layer a thin key/value
convenience API (``put``/``get``/``all``) on top by encoding values as
JSON-tagged fact strings — that way structured state (the onboarding
profile, deadlines, etc.) and freeform memories share the same storage.
"""
from __future__ import annotations

import json
import logging
import re
import threading
from datetime import datetime
from typing import Any

from app.config import settings

log = logging.getLogger(__name__)

_TAG_PREFIX = "::KV::"
_lock = threading.Lock()
_local_fallback: dict[str, dict[str, Any]] = {}
_active_users: set[str] = set()


def _safe_user_key(whatsapp_from: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "_", whatsapp_from or "anon")


def _client():
    """Lazy-import the Vertex Memory Bank client so the module is importable
    without GCP creds (e.g. in unit tests, local TwiML dev)."""
    try:
        from vertexai import rag  # type: ignore

        return rag
    except Exception as exc:  # pragma: no cover - import-time only
        log.warning("Vertex Memory client unavailable, using in-process store: %s", exc)
        return None


def _corpus_name() -> str:
    return settings.vertex_memory_corpus


def _encode_kv(key: str, value: Any) -> str:
    return f"{_TAG_PREFIX}{key}={json.dumps(value, default=str)}"


def _decode_kv(text: str) -> tuple[str, Any] | None:
    if not text.startswith(_TAG_PREFIX):
        return None
    payload = text[len(_TAG_PREFIX):]
    if "=" not in payload:
        return None
    key, raw = payload.split("=", 1)
    try:
        return key, json.loads(raw)
    except json.JSONDecodeError:
        return key, raw


def put(whatsapp_from: str, key: str, value: Any) -> None:
    """Write a structured key/value pair into this user's memory namespace."""
    user_key = _safe_user_key(whatsapp_from)
    _active_users.add(whatsapp_from)

    rag = _client()
    if rag is None or not _corpus_name():
        with _lock:
            _local_fallback.setdefault(user_key, {})[key] = value
        return

    try:
        # The Memory Bank treats each insert as an immutable fact. We
        # encode the kv as a tagged string and rely on ``all()`` to keep
        # the most recent value per key.
        rag.upload_file(  # type: ignore[attr-defined]
            corpus_name=_corpus_name(),
            path=None,
            display_name=f"{user_key}:{key}:{datetime.utcnow().isoformat()}",
            description=_encode_kv(key, value),
            metadata={"user": user_key, "key": key},
        )
    except Exception as exc:
        log.warning("Memory put failed (%s), falling back to local: %s", key, exc)
        with _lock:
            _local_fallback.setdefault(user_key, {})[key] = value


def get(whatsapp_from: str, key: str, default: Any = None) -> Any:
    return all_kv(whatsapp_from).get(key, default)


def all_kv(whatsapp_from: str) -> dict[str, Any]:
    """Return every structured kv pair for this user, latest-wins."""
    user_key = _safe_user_key(whatsapp_from)
    rag = _client()
    if rag is None or not _corpus_name():
        with _lock:
            return dict(_local_fallback.get(user_key, {}))

    try:
        results = rag.retrieval_query(  # type: ignore[attr-defined]
            rag_resources=[rag.RagResource(rag_corpus=_corpus_name())],
            text=f"user:{user_key}",
            similarity_top_k=200,
        )
        out: dict[str, Any] = {}
        for ctx in getattr(results, "contexts", []) or []:
            text = getattr(ctx, "text", "") or ""
            decoded = _decode_kv(text)
            if decoded is None:
                continue
            k, v = decoded
            out[k] = v
        return out
    except Exception as exc:
        log.warning("Memory all_kv failed, using local: %s", exc)
        with _lock:
            return dict(_local_fallback.get(user_key, {}))


def append_message(whatsapp_from: str, role: str, text: str) -> None:
    """Append a freeform conversation turn — useful for AnswerAgent context."""
    history = get(whatsapp_from, "history", []) or []
    history.append({"role": role, "text": text, "ts": datetime.utcnow().isoformat()})
    # Keep last 30 turns to bound memory growth.
    put(whatsapp_from, "history", history[-30:])


def history(whatsapp_from: str) -> list[dict[str, Any]]:
    return get(whatsapp_from, "history", []) or []


def list_active_users() -> list[str]:
    """Returns every WhatsApp number that has interacted, for the watchdog.

    When Memory Bank is configured we query it for the canonical list; the
    in-process set is the fallback for local dev.
    """
    rag = _client()
    if rag is None or not _corpus_name():
        return list(_active_users)
    try:
        # Memory Bank exposes a listing API for stored facts; we filter to
        # the ``user:`` tag we wrote on insert.
        files = rag.list_files(corpus_name=_corpus_name())  # type: ignore[attr-defined]
        users: set[str] = set()
        for f in files:
            user = (getattr(f, "metadata", {}) or {}).get("user")
            if user:
                users.add(user)
        return sorted(users)
    except Exception as exc:
        log.warning("Memory list_active_users failed: %s", exc)
        return list(_active_users)
