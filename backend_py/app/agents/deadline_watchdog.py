"""DeadlineWatchdog — iterates active users from Vertex Memory, finds any
deadlines inside the configured window, and DMs them on WhatsApp.

Triggered by Cloud Scheduler via ``app.jobs.scheduler``; never called from
the inbound webhook.
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Any

from app.config import settings
from app.services import memory, twilio_client

log = logging.getLogger(__name__)


def _parse_date(value: Any) -> date | None:
    if not value:
        return None
    if isinstance(value, date):
        return value
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y", "%B %Y", "%b %Y"):
        try:
            return datetime.strptime(str(value), fmt).date()
        except ValueError:
            continue
    return None


def _due_soon(deadline: dict[str, Any], today: date, window: int) -> bool:
    due = _parse_date(deadline.get("due_date"))
    if due is None:
        return False
    delta = (due - today).days
    return 0 <= delta <= window


def _format_message(profile: dict[str, Any], due: list[dict[str, Any]]) -> str:
    name = (profile.get("name") or "").split()[0] if profile.get("name") else None
    greeting = f"Hi {name} — heads up:" if name else "Heads up:"
    lines = [greeting, ""]
    for d in due:
        lines.append(f"• *{d.get('title','Upcoming deadline')}* — due {d.get('due_date')}")
    lines.append("")
    lines.append("Reply here if you want help getting it done.")
    return "\n".join(lines)


def run(window_days: int | None = None) -> dict[str, Any]:
    """Scan every user, send a WhatsApp message for any in-window deadlines.

    Returns a summary dict so Cloud Scheduler logs are useful.
    """
    today = date.today()
    window = window_days or settings.deadline_window_days
    users = memory.list_active_users()

    summary: dict[str, Any] = {
        "scanned": len(users),
        "notified": 0,
        "skipped": 0,
        "errors": [],
    }
    for user in users:
        try:
            deadlines = memory.get(user, "deadlines", []) or []
            due = [d for d in deadlines if _due_soon(d, today, window)]
            if not due:
                summary["skipped"] += 1
                continue

            profile = memory.get(user, "profile") or {}
            body = _format_message(profile, due)
            twilio_client.send_whatsapp(user, body)

            # Mark which deadlines we've already pinged so we don't spam.
            notified = memory.get(user, "notified_deadlines", []) or []
            notified.extend(d.get("task_id") for d in due if d.get("task_id"))
            memory.put(user, "notified_deadlines", sorted(set(notified)))

            summary["notified"] += 1
        except Exception as exc:
            log.exception("watchdog failed for %s", user)
            summary["errors"].append({"user": user, "error": str(exc)})

    log.info("watchdog summary=%s", summary)
    return summary
