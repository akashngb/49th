"""Onboarding agent — ported from backend/agents/coordinator.js.

Preserves the same 11-question script, the same Gemini-driven natural
phrasing of each question, the same critical-path generation, and writes
the resulting profile + tasks into Vertex Memory.
"""
from __future__ import annotations

import logging
from typing import Any

from app.services import gemini, memory

log = logging.getLogger(__name__)

ONBOARDING_QUESTIONS = [
    "What is your full name?",
    "Which country are you originally from?",
    "What language do you prefer to communicate in? (e.g. English, French, Spanish, Hindi, Urdu, Tagalog, Ukrainian)",
    "Which province are you settling in? (e.g. Ontario, British Columbia, Alberta, Quebec)",
    "Which city did you land in?",
    "When did you arrive in Canada? (e.g. January 2025)",
    "What is your immigration status? (e.g. Permanent Resident, Work Permit, Study Permit, Refugee Claimant, Citizen)",
    "What is your profession?",
    "What is your highest level of education? (e.g. High School, Bachelor's, Master's, PhD, Trade Certificate)",
    "What is your marital status, and do you have children with you? (e.g. Single, Married with 2 kids)",
    "What is your biggest concern right now as you settle in Canada?",
]

PROFILE_FIELDS = [
    "name", "country", "language", "province", "city", "arrival_date",
    "status", "profession", "education", "family", "concern",
]

WELCOME = (
    "Welcome to Roots\n\n"
    "I help newcomers to Canada navigate their settlement journey — from "
    "documents and healthcare to career and community.\n\n"
    "Let's start with a few quick questions so I can build your personal "
    "roadmap.\n\n"
    "First: What is your full name?"
)


def _session(user: str) -> dict[str, Any]:
    s = memory.get(user, "onboarding") or {}
    if not s:
        s = {
            "stage": "onboarding",
            "question_index": 0,
            "answers": [],
            "qa_pairs": [],
            "last_question": ONBOARDING_QUESTIONS[0],
        }
    return s


def _save_session(user: str, session: dict[str, Any]) -> None:
    memory.put(user, "onboarding", session)


async def handle(user: str, message: str) -> str:
    """Process one inbound onboarding message and return the agent's reply."""
    session = _session(user)

    # Fresh user — kick off the script.
    if not session.get("answers") and session.get("question_index", 0) == 0 and not memory.get(user, "profile"):
        # First time we hear from them, but they sent a real message — log it as
        # the answer to question 0 only if they responded to the welcome. To
        # keep parity with the JS coordinator's first-touch behaviour we instead
        # always greet on the first interaction and let the next message become
        # the answer to Q0.
        if not session.get("welcomed"):
            session["welcomed"] = True
            _save_session(user, session)
            return WELCOME

    # Interrupt detection — if the user asks an off-topic question, answer it
    # and re-pose the pending onboarding question.
    last_q = session.get("last_question") or ONBOARDING_QUESTIONS[0]
    try:
        if await gemini.classify_interrupt(last_q, message):
            from app.agents.answer import answer_grounded  # late import — cycle guard
            answered = await answer_grounded(user, message)
            return f"{answered}\n\n(Whenever you're ready, let's continue: *{last_q}*)"
    except Exception as exc:
        log.warning("interrupt classifier failed: %s", exc)

    # Record this answer against the pending question.
    session["answers"].append(message)
    session["qa_pairs"].append(f"Question: {last_q}\nAnswer: {message}")
    session["question_index"] = session.get("question_index", 0) + 1

    # More questions to go — generate the next one via Gemini.
    if session["question_index"] < len(ONBOARDING_QUESTIONS):
        topic = ONBOARDING_QUESTIONS[session["question_index"]]
        try:
            next_q = await gemini.next_onboarding_question(session["qa_pairs"], topic)
        except Exception as exc:
            log.warning("dynamic question failed, falling back: %s", exc)
            next_q = f"Got it. Now, {topic.lower()}"
        session["last_question"] = next_q
        _save_session(user, session)
        return next_q

    # Onboarding complete — build the profile, persist, and generate the path.
    profile = {field: ans for field, ans in zip(PROFILE_FIELDS, session["answers"])}
    memory.put(user, "profile", profile)
    memory.put(user, "stage", "active")

    try:
        path = await gemini.generate_critical_path(profile)
    except Exception as exc:
        log.error("critical path failed: %s", exc)
        path = {"tasks": []}

    tasks = (path.get("tasks") or [])[:5]
    memory.put(user, "critical_path", tasks)

    # Extract deadlines from the path for the watchdog.
    deadlines: list[dict[str, Any]] = []
    for t in tasks:
        due = t.get("dueDate") or t.get("due_date")
        if due:
            deadlines.append({
                "task_id": t.get("id"),
                "title": t.get("title"),
                "due_date": due,
            })
    memory.put(user, "deadlines", deadlines)

    # Clear the onboarding scratch state.
    memory.put(user, "onboarding", {"stage": "done"})

    if not tasks:
        return (
            "Here's your critical path — your next steps are: SIN application, "
            "bank account, and healthcare registration. Type *STATUS* to check "
            "any application timeline."
        )

    lines = ["Here's your critical path for the next 90 days\n"]
    for i, t in enumerate(tasks, 1):
        urgency = t.get("urgency", "medium")
        emoji = "🔴" if urgency == "critical" else "🟡" if urgency == "high" else "🟢"
        lines.append(
            f"{emoji} *{i}. {t.get('title','')}*\n"
            f"{t.get('description','')}\n"
            f"⏱ {t.get('estimatedTime','')}\n"
        )
    lines.append(
        "Just ask me anything — I'm here to help. You can also send a photo of "
        "any document and I'll explain what it is and what to do next."
    )
    return "\n".join(lines)


def is_active(user: str) -> bool:
    """Onboarding is considered complete once a profile exists."""
    return bool(memory.get(user, "profile"))
