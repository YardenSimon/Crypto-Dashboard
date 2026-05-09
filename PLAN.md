# Cryptide — Macro Implementation Plan

## Phase 1 — Project Skeleton & Infrastructure

Set up the repo structure, Docker Compose (postgres + api + web), empty FastAPI app, and empty React/Vite/TS app — all running locally with health checks passing. Wire `.env.example`.

**Deliverable:** `docker-compose up` brings up all three services with no errors.

---

## Phase 2 — Data Layer

Define all SQLAlchemy ORM models (`users`, `user_preferences`, `content_items`, `votes`, `daily_insights_cache`, `api_cache`) and generate the initial Alembic migration.

**Deliverable:** `alembic upgrade head` runs cleanly against the local Postgres instance.

---

## Phase 3 — Authentication

Implement signup, login, logout, and `/me` endpoints with Argon2 password hashing, JWT issued as a `httpOnly`/`Secure`/`SameSite=Lax` cookie with 7-day sliding expiry. Add the FastAPI `Depends` for `get_current_user`.

Frontend: `/signup`, `/login` pages with React Hook Form + Zod validation, button spinner on submit, error display. Cookie-based auth plumbing in `lib/api.ts`.

**Deliverable:** Full auth round-trip works end-to-end.

---

## Phase 4 — Onboarding Quiz & Preferences API

Backend: `GET /me/preferences` and `PUT /me/preferences` endpoints. Submitting sets `onboarding_completed = true`.

Frontend: Three-question multi-select quiz at `/onboarding`. Root `/` redirect logic (unauthenticated → `/login`, incomplete onboarding → `/onboarding`, else → `/dashboard`).

**Deliverable:** New user can sign up, complete the quiz, and land on `/dashboard`.

---

## Phase 5 — External Data Services

Implement the four backend service integrations independently:

- **CoinGecko** — live coin prices (no cache)
- **RSS feeds** (CoinTelegraph, Decrypt, CoinDesk) — news headlines (server-side `api_cache`, 10-min TTL; no API key required)
- **Reddit JSON** — daily meme from `r/cryptocurrencymemes` (server-side `api_cache`, 6-hour TTL)
- **LLM (Groq + Gemini)** — `LLMClient` base interface, Groq primary, Gemini fallback; versioned prompt at `prompts/daily_insight_v1.txt`; `daily_insights_cache` keyed by `(investor_type, date)`; scheduled job at 00:05 UTC with lazy-generation fallback

**Deliverable:** Each service can be exercised independently; cache hit/miss behavior verified.

---

## Phase 6 — Dashboard Endpoint & UI

Backend: `GET /dashboard` assembles all four sections filtered by `user_preferences` via `services/recommender.py`. Returns `cache_age` metadata per section. Graceful degradation: serve stale `api_cache` data with timestamp if live fetch fails.

Frontend: `DashboardPage` with 2×2 grid; four independent section components (`NewsSection`, `PricesSection`, `InsightSection`, `MemeSection`), each with its own loading skeleton and TanStack Query fetch. Prices poll every 60 s; news refetches every 10 min. Section visibility driven by `content_types` preference (AI Insight always shown).

`POST /insights/retry` endpoint with 1-retry-per-hour rate limit (Gemini fallback).

**Deliverable:** Authenticated user with completed onboarding sees a fully populated dashboard.

---

## Phase 7 — Voting

Backend: `POST /votes` upsert/toggle — same value removes, opposite replaces; unique `(user_id, content_item_id)` constraint enforced.

Frontend: `VoteButtons` component on every content card with optimistic UI via TanStack Query mutation + rollback on server error.

**Deliverable:** Votes persist correctly; UI responds instantly and rolls back on failure.

---

## Phase 8 — Preferences Page

`/preferences` page (authenticated + onboarding complete): same quiz form pre-filled with current values, allows updating at any time.

**Deliverable:** User can update preferences post-onboarding and dashboard refreshes accordingly.

---

## Phase 9 — Polish & Tests

- Loading skeletons: full-grid skeleton on first dashboard load post-onboarding; per-section skeletons on subsequent loads.
- Header with user dropdown (Preferences, Logout).
- Backend tests (~8): auth happy path, vote toggle, feed assembly with mocked external APIs, onboarding redirect, cache hit/miss.
- Frontend tests (~5): quiz form validation, vote optimistic update + rollback, login error display, onboarding redirect, skeleton render while loading.

**Deliverable:** All tests pass; UI feels polished.

---

## Phase 10 — Deployment

- Deploy backend + DB to Railway; wire all backend env vars.
- Deploy frontend to Vercel; set `VITE_API_BASE_URL`.
- Verify CORS (`FRONTEND_ORIGIN`) and cookie domain (`COOKIE_DOMAIN`) for production.
- Add README with screenshots and one-command local setup (`docker-compose up`).

**Deliverable:** Live production URL accessible; local setup works from a clean clone.

---

## Critical Files

| Area | Path |
|---|---|
| Docker Compose | `docker-compose.yml` |
| FastAPI entrypoint | `api/app/main.py` |
| Config / env | `api/app/core/config.py` |
| DB session + deps | `api/app/core/db.py`, `api/app/core/deps.py` |
| JWT / hashing | `api/app/core/security.py` |
| ORM models | `api/app/models/` |
| Pydantic schemas | `api/app/schemas/` |
| Routers | `api/app/routers/` |
| External services | `api/app/services/` |
| LLM prompt | `api/prompts/daily_insight_v1.txt` |
| Daily job | `api/app/jobs/daily_insights.py` |
| Frontend lib | `web/src/lib/api.ts`, `queryClient.ts`, `types.ts` |
| Dashboard UI | `web/src/features/dashboard/` |
| Auth UI | `web/src/features/auth/` |
| Onboarding UI | `web/src/features/onboarding/` |
