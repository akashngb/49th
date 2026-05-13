# Roots — Python backend

FastAPI + Google ADK rebuild of the Node.js coordinator. Deploys to Cloud Run.

## Topology

```
Twilio WhatsApp ─▶ POST /webhook ─▶ ADK Coordinator
                                       ├─ OnboardingAgent     (11-question script + Gemini critical path)
                                       ├─ AnswerAgent         (Vertex AI Search, semantic-only)
                                       └─ DocumentAnalyst     (Gemini 2.5 Flash multimodal)
                                       │
                                       └─ Vertex AI Memory    (one namespace per WhatsApp From)

Cloud Scheduler ─▶ POST /jobs/deadline-watchdog ─▶ DeadlineWatchdog ─▶ Twilio REST
```

Every agent reply runs through ElevenLabs TTS and is attached as an MP3 voice
note alongside the text via a Twilio media message.

## Layout

- `app/main.py` — FastAPI app; `/webhook` (Twilio) + `/jobs/deadline-watchdog` (Cloud Scheduler)
- `app/agents/coordinator.py` — ADK root agent + intent router fallback
- `app/agents/onboarding.py` — 11-question script ported from `backend/agents/coordinator.js`
- `app/agents/answer.py` — grounded Q&A over Vertex AI Search
- `app/agents/document_analyst.py` — multimodal extraction → structured JSON
- `app/agents/deadline_watchdog.py` — scans Vertex Memory for due-within-7-day deadlines
- `app/services/memory.py` — Vertex AI Memory wrapper (per-user namespace)
- `app/services/vertex_search.py` — semantic search client
- `app/services/gemini.py` — direct Gemini calls (critical path, multimodal, classifiers)
- `app/services/twilio_client.py` — REST send
- `app/services/elevenlabs_tts.py` — voice note synthesis
- `app/services/media_storage.py` — public GCS upload so Twilio can fetch the MP3
- `app/jobs/scheduler.py` — CLI entry point (`python -m app.jobs.scheduler watchdog`)

## Local dev

```bash
cd backend_py
cp .env.example .env  # fill in secrets
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

Without GCP creds, `memory.py` falls back to an in-process store and
`vertex_search.py` returns empty hits — enough to exercise the webhook +
onboarding flow against `ngrok` and Twilio's sandbox.

## Deploy

Run from inside `backend_py/` so the build context only includes the Python
service (the JS backend, frontend, and node_modules are not uploaded):

```bash
cd backend_py
gcloud builds submit . --config cloudbuild.yaml \
  --substitutions=_REGION=us-central1,\
_VERTEX_SEARCH_DATASTORE=your-datastore-id,\
_MEDIA_BUCKET=your-public-bucket
```

`cloudbuild.yaml` builds the image, deploys to Cloud Run (1 vCPU / 1 GiB /
concurrency 20 / 120s request timeout), and idempotently creates/updates the
Cloud Scheduler job that pings the watchdog daily at 14:00 America/Toronto.

## One-time setup

```bash
# Artifact Registry repo for the image
gcloud artifacts repositories create roots --repository-format=docker --location=us-central1

# Runtime service account
gcloud iam service-accounts create roots-runtime
for role in datastore.user discoveryengine.viewer storage.objectAdmin \
            secretmanager.secretAccessor run.invoker; do
  gcloud projects add-iam-policy-binding "$(gcloud config get-value project)" \
    --member="serviceAccount:roots-runtime@$(gcloud config get-value project).iam.gserviceaccount.com" \
    --role="roles/$role"
done

# Public-read GCS bucket Twilio fetches MP3s from
gsutil mb -l us-central1 gs://your-public-bucket
gsutil iam ch allUsers:objectViewer gs://your-public-bucket
```

## Secrets

The build pulls these from Secret Manager (`--set-secrets`):

- `GEMINI_API_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
- `ELEVENLABS_API_KEY`
- `SCHEDULER_SHARED_SECRET` (additional belt-and-suspenders on top of OIDC)

Project + location + datastore + bucket IDs are passed as plain build
substitutions and end up as plain env vars on the service.

## Memory backend

The "Vertex AI Memory" abstraction is backed by **Firestore** in this
build — one document per WhatsApp number under the `roots_memory`
collection. Firestore is the production GCP pattern for short-term
agent memory: strongly consistent, sub-100ms reads, and natively
integrates with the Cloud Run service account.
