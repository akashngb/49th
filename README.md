# 49th: The AI that settles you in

---

## Inspiration

Someone on our team has a family member who missed his OHIP deadline because nobody told him the clock would start the moment he landed. He found out at a walk-in clinic.

That's what inspired this. Not the big dramatic stuff about immigration. The small, stupid, fixable things that fall through the cracks because nobody is actually watching out for you.

It lives on WhatsApp because that's where newcomers already are. No app to download, no account to create, no learning curve. The same app they used to message family back home the moment the plane landed is the same app that tells them what to do next.

It speaks your language. Not just translates it. If Hindi is how you think, that's how 49th talks back. As a voice note, out loud, in your WhatsApp. Someone who can't read a word of English can use this whole thing just by talking to it.

And when there's a government form standing between you and health coverage, it doesn't hand you a link and wish you luck. It opens the page itself, reads it, figures out what to click, and fills in the fields. If it needs something only you know, it asks once. Then it keeps going.

It also never forgets you. Your status, your family, your documents, what's done and what isn't. Every surface connected, every conversation remembered. It picks up exactly where you left off.

---

## What it does

49th is an end-to-end AI settlement system for newcomers to Canada, built across three surfaces.

**WhatsApp** is the primary interface. A newcomer sends their first message and 49th begins a dynamic onboarding conversation, gathering their city, immigration status, language preference, profession, family situation, and primary concern. At the end of onboarding, Gemini 2.5 Flash generates a personalised, sequenced critical path of 5 to 7 tasks specific to that exact person. Not a generic checklist. A roadmap built for their situation.

From that point forward, the agent works through Backboard persistent memory threads. Every message, every answer, every completed task is stored permanently. A newcomer can come back three weeks later and the agent picks up exactly where they left off, referencing their name, city, status, and progress without ever asking again.

The agent also handles voice. ElevenLabs synthesises every AI response into a natural voice note delivered through WhatsApp using the multilingual v2 model. Newcomers can also reply with a voice note, which gets transcribed before the agent responds. The entire settlement assistant is accessible to someone who cannot read or write English.

**The dashboard** is a secondary surface for visual tracking. It is a React + TypeScript SPA authenticated through Auth0. The settlement profile (city, critical path progress, completed tasks, family situation) is pulled live from Auth0 user_metadata on every login, stamped into the JWT via a post-login Action, and available to every component through a `useRootsUser` hook without any additional API calls.

The dashboard includes household role management. A primary account holder has full access including task automation. A family member logging in, such as a spouse still in their home country, can see all progress but cannot trigger automations. The role is assigned via a second post-login Action and enforced on the frontend through a `RoleProtectedAction` component.

**The browser agent** is the most technically ambitious part. From the Arrival Engine page, a newcomer can trigger an autonomous agent that navigates real government websites on their behalf: Canada.ca for SIN applications, provincial health portals for OHIP, and others. The agent uses Playwright to control a Chromium instance, takes JPEG screenshots at each step, and sends them to Claude Vision with the task context. Claude returns a structured JSON action:

```json
{ "action": "click", "x": 842, "y": 310, "reason": "Locating the online application button" }
{ "action": "type", "x": 512, "y": 440, "text": "John Smith", "reason": "Filling legal name field" }
{ "action": "ask_user", "question": "What is your date of birth?" }
{ "action": "done", "summary": "SIN application submitted successfully" }
```

No hardcoded selectors. No scripts that break when a government website updates its layout. The agent sees the page the same way a person would and decides what to do next. An overlay panel injected into the browser shows each step in real time with Stop and Pause controls. When the task is complete, a WhatsApp confirmation is sent, Auth0 user_metadata is updated, and the dashboard checklist reflects the change.

---

## How we built it

### Architecture overview

```
WhatsApp (Twilio) → Express webhook → Coordinator agent
                                          ↓
                               Backboard thread (persistent memory)
                                          ↓
                               Gemini 2.5 Flash (onboarding, critical path,
                                                  document extraction, STT)
                                          ↓
                               ElevenLabs (TTS → voice note)
                                          ↓
                               Auth0 (profile sync, role, security)
                                          ↓
                               Cloudinary (media storage, document enhancement,
                                           generative PNG cards)
                                          ↓
                               Dashboard (React + Auth0) ← Browser agent (Playwright + Claude Vision)
```

### Backend

The backend is a Node.js + Express server with a coordinator agent at its core (`backend/agents/coordinator.js`). Every incoming WhatsApp message is routed through the coordinator, which handles four stages.

**SECURE / RESTORE intercepts** run before anything else. If a user replies `SECURE`, the coordinator calls `auth0Manager.blockUser()` via the Auth0 Management API and immediately disables their dashboard login. `RESTORE` reverses it. This runs synchronously before the Backboard thread is ever touched.

**Session restoration** checks `thread_map.json` on disk for a persisted session. If the user's stage is `active`, the session is rebuilt from disk so server restarts are invisible to users.

**Auth0 profile injection** runs on the first WhatsApp message from a user who linked their dashboard account. The coordinator fetches their full `user_metadata` from Auth0 via the Management API, builds a structured context message, silently primes the Backboard thread with it, and then routes the actual message. This means the agent already knows their name, city, status, and completed tasks before they say a word.

**Onboarding flow** uses Gemini 2.5 Flash to dynamically rephrase each question based on the conversation so far, via `generateNextQuestion()`. The questions are not static. Gemini reads the full Q&A context and rephrases the next question naturally in whatever language the user is speaking. An interrupt classifier also runs on each answer to detect if the user is asking a question instead of answering one, and handles it without losing their place in the flow.

**Active stage** routes all messages through `backboard.chat()`. The coordinator injects the user's profile as a prefix context string, then sends to Backboard which manages the thread. If a response includes the `[GRAPHIC]` marker, added by Gemini when immigration statistics are discussed, a Pulse card is generated via Node Canvas, uploaded to Cloudinary, and sent as a WhatsApp media message.

**Task completion detection** scans active-stage messages for natural language keywords such as `"got my SIN"` or `"opened a bank account"` and silently calls `auth0Manager.updateProfileField()` to update the relevant flag in Auth0 user_metadata.

### Backboard persistent memory

Backboard (`backboard-sdk`) manages one thread per user. Thread IDs are persisted to `thread_map.json` on disk alongside the user's stage, profile, and Auth0 user ID. The `chat()` function resolves or creates a thread, sends the message with `model_name: gemini-2.5-flash` and `memory: Auto`, and returns the response. Memory Auto mode means Backboard continuously compresses and synthesises the thread history so the context window never hits a limit across months of conversation.

### Gemini API

Gemini 2.5 Flash is used in four distinct ways.

1. **Critical path generation.** Structured JSON output from a user profile, producing a sequenced task list with urgency levels, day-from-arrival targets, and time estimates.
2. **Dynamic question generation.** Natural language rephrasing of onboarding questions based on full conversation context, with hard language matching.
3. **Multimodal document extraction.** Base64 document images sent inline. Gemini identifies the document type, extracts key fields, redacts sensitive numbers, identifies missing companion documents, and returns the next recommended action.
4. **Audio transcription.** Voice notes are sent as base64 with MIME type. Gemini returns the transcription in the original language, never translated.

### ElevenLabs

ElevenLabs is integrated in both directions. `textToSpeech()` uses the JS SDK with model `eleven_multilingual_v2`, converting AI text responses to MP3 buffers delivered as WhatsApp voice notes via Twilio. `textToSpeechUrl()` uses the REST API directly for cases where a Cloudinary URL is needed. Voice note transcription uses Gemini for language accuracy.

### Auth0

Auth0 runs two applications: a SPA application for dashboard login (Google + Apple OAuth) and an M2M application for backend Management API calls.

Three post-login Actions run in sequence on every login.

1. **Add user_metadata to token.** Reads the user's `user_metadata` and stamps all settlement fields as custom claims under the `https://49th.app/` namespace into the JWT.
2. **Assign default role.** Stamps `https://49th.app/role` as `primary` unless a role already exists.
3. **WhatsApp security alert.** Calls the Twilio REST API directly via native `fetch` with no npm dependency, firing a WhatsApp message on first login or anomalous device detection.

The `useRootsUser` hook in the frontend reads all custom claims from the decoded JWT. Every page loads with real profile data instantly, with no secondary API call needed. The `RoleProtectedAction` component wraps all browser automation buttons and disables them for family role users with a tooltip.

### Cloudinary

Cloudinary handles three distinct use cases.

**Document enhancement.** Incoming WhatsApp document photos are streamed through `upload_stream` with three chained transformations: `enhance`, `sharpen:100`, and `auto_contrast`. This makes photographed government documents legible regardless of lighting conditions.

**Generative Pulse cards.** Node Canvas renders 1080x566 PNG graphics server-side from real IRCC seed data. Three card types: processing trend line charts, task progress bars, and application approval breakdowns. The canvas buffer is streamed directly to Cloudinary via `uploadBuffer()` with no temp files. The returned Cloudinary URL is sent as a WhatsApp media message.

**Dashboard document rendering.** `@cloudinary/react` `AdvancedImage` with `lazyload`, `placeholder`, `format(auto())`, and `quality(autoQuality())` for all document images in the Documents page.

### Vision-guided browser agent

The Playwright browser agent (`backend/services/playwrightBrowser.js`) launches a Chromium instance via `playwright.chromium.launch()`. At each step:

1. Take a full-page JPEG screenshot via `page.screenshot({ type: 'jpeg', quality: 80 })`
2. Send to Claude Vision (Anthropic SDK) as a base64 inline image with the task prompt and user profile as context
3. Parse the returned JSON action
4. Execute via Playwright: `page.click()`, `page.fill()`, `page.keyboard.type()`, `page.evaluate()` for scroll, `page.goto()` for navigate
5. Re-inject the overlay if it was lost after navigation
6. Repeat until `done` or `ask_user`

Loop detection prevents the same action from repeating more than three times. Sessions are keyed by `userId` in `activeSessions{}` in memory, supporting concurrent users. Stop and Pause are handled via `window.__roots_stopped` and `window.__roots_paused` flags evaluated inside the page context.

The overlay is injected as a DOM element via `page.evaluate()` after every navigation. It shows the current step reasoning, a language selector, a Stop button, and a Pause/Resume button, all styled in 49th's brand colours.

### Frontend

The dashboard is React 19 + TypeScript + Vite + Tailwind CSS. Routes are protected via `ProtectedRoute` which checks `isAuthenticated` from `@auth0/auth0-react`. The `useRootsUser` hook extracts all settlement claims from the Auth0 JWT. The Arrival Engine page polls `GET /api/browser-status` every 2 seconds during an active browser session and updates the `BrowserTaskPanel` state accordingly.

---

## Challenges we ran into

**Persistent memory across restarts.** In-memory session state was the obvious first implementation but made every server restart a reset. We solved this with `thread_map.json`, a flat JSON file on disk keyed by WhatsApp number that stores the thread ID, stage, profile, and Auth0 user ID. On every incoming message the coordinator checks disk before memory. The Backboard thread itself is already persistent so this gives us full continuity.

**Connecting WhatsApp identity to Auth0 identity.** These are two completely separate identity spaces. A user could onboard on WhatsApp first, then create a dashboard account, or the other way around. We solved this with an explicit phone linking step at `/phone-link` after Auth0 login. The link writes in both directions simultaneously: phone number to Auth0 user_metadata and auth0UserId to thread_map.json. The coordinator checks for this link on every message and injects the full Auth0 profile as silent context when found.

**The browser agent breaking on government website layout changes.** Traditional Playwright automation uses CSS selectors that break the moment a page updates. Claude Vision reading screenshots eliminates this entirely. The agent understands the visual layout and intent of each page rather than targeting specific elements. The cost is speed (one screenshot plus one API call per step) but the reliability is dramatically better.

**Onboarding interruptions.** Users naturally ask questions mid-onboarding instead of just answering. We added an intent classifier that runs on every onboarding answer, a lightweight Gemini call that asks whether the message is a question rather than an answer. If it is, the coordinator handles it directly via Backboard and then reminds the user which question they were on. This adds one extra API call per message during onboarding but makes the experience feel natural.

**ElevenLabs audio delivery through Twilio.** Twilio requires a publicly accessible URL for media messages and cannot accept a raw audio buffer. We upload every ElevenLabs MP3 to Cloudinary first and pass the `secure_url` to `twilio.messages.create()`. This added a Cloudinary upload step to every voice response but gave us persistent audio storage as a side benefit.

---

## Accomplishments that we're proud of

**A genuinely working end-to-end loop.** A newcomer can send a WhatsApp message, complete onboarding, receive a personalised critical path, and trigger an autonomous browser agent that navigates a real government website, with every step reflected in Auth0 and the dashboard. This is not a mock. Every surface is live.

**Language-transparent settlement.** The agent detects language automatically and responds in kind. ElevenLabs multilingual v2 handles voice synthesis. Gemini handles transcription in the original language. A newcomer speaking Arabic never needs to switch to English at any point in the process.

**The Backboard memory architecture.** One thread per user, persisted to disk, compressing across months of conversation. The agent never asks the same question twice. This is the technical foundation that separates 49th from any standard chatbot implementation.

**The generative Pulse card system.** Personalised immigration intelligence cards rendered server-side from real IRCC data, uploaded to Cloudinary, and delivered through WhatsApp. Not a dashboard feature. A WhatsApp message. Something someone would actually send to their family.

**Auth0 as a full identity layer, not just a login button.** Three post-login Actions, custom JWT claims, household roles, M2M backend access, and a WhatsApp security alert system, all built on top of Auth0's infrastructure.

---

## What we learned

Building for newcomers specifically forced a discipline that most apps avoid: you cannot assume your user has a reliable data plan, a desktop browser, time to onboard, English literacy, or familiarity with Canadian institutions. Every architecture decision had to justify itself against those constraints. WhatsApp-first was not a gimmick. It was the answer to almost every one of those constraints at once.

We also learned that persistent memory is not a nice-to-have for this use case. It is the product. The difference between an assistant that forgets you and one that remembers your work permit status three weeks later is the difference between a tool and a companion. Backboard's thread architecture made this possible without us having to build a custom memory layer from scratch.

The vision-guided browser agent taught us that the brittleness problem in web automation is not a technical limitation. It is an architectural one. Replacing selectors with vision eliminates an entire class of failures. The slowness is a reasonable trade-off.

---

## What's next for 49th

**Proactive alerts.** Backboard already holds every user's context. The next step is a scheduled trigger that checks processing time changes, approaching deadlines, and OHIP waiting period completions, sending a WhatsApp message when something the user cares about changes. The infrastructure is already there.

**Voice calls.** A newcomer standing in a government office who does not know what to say next should be able to call 49th directly. Vapi is already integrated in the codebase. The settlement agent as a real-time phone assistant is the next surface.

**Expanded browser automation.** Currently the agent handles SIN, OHIP, school enrollment, bank account setup, and job search. Every provincial health portal, every Service Canada form, every credential recognition pathway is a candidate. The vision-guided architecture means adding a new task is writing a prompt, not writing selectors.

**Multilingual onboarding.** The agent already responds in any language. The next step is detecting the user's language from their first message and conducting the entire onboarding in that language without them ever needing to specify it.

**Community and peer matching.** The proxy matching system (`proxyMatcher.js`) already seeds users with stories from people who made the same move. Connecting newcomers with established community members who share their profession, country of origin, and city, through the same WhatsApp thread, is the human layer on top of the AI layer.

