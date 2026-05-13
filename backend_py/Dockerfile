FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8080

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --shell /bin/bash app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

USER app

EXPOSE 8080

# One worker — Cloud Run handles concurrency horizontally. Multiple
# Uvicorn workers compete for the same CPU and burn memory without
# adding throughput on a managed-Cloud-Run instance.
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1
