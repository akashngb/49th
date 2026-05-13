"""Cloud Scheduler-compatible entry points.

Two ways to invoke the watchdog:

1. **HTTP** — Cloud Scheduler hits ``POST /jobs/deadline-watchdog`` on the
   same Cloud Run service (defined in ``app.main``). Recommended.

2. **CLI** — ``python -m app.jobs.scheduler watchdog`` runs the same code
   path locally or from a Cloud Run Job. Useful for backfills.
"""
from __future__ import annotations

import json
import sys

from app.agents import deadline_watchdog


def main(argv: list[str]) -> int:
    if len(argv) < 2 or argv[1] != "watchdog":
        print("usage: python -m app.jobs.scheduler watchdog", file=sys.stderr)
        return 2
    print(json.dumps(deadline_watchdog.run(), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
