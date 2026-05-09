# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cryptide** — a personalized crypto investor dashboard. Users complete an onboarding quiz to capture their interests; the dashboard then shows four sections of daily curated content tailored to those preferences, with thumbs-up/down voting on each item.

**Priorities:** clean UX, readable code, good structure.

## Stack

- **Frontend:** React + Vite + TypeScript, TailwindCSS + shadcn/ui, TanStack Query, React Router, React Hook Form + Zod
- **Backend:** FastAPI (Python 3.11+), SQLAlchemy 2.0 + Alembic, Pydantic v2, argon2-cffi, python-jose, httpx
- **Database:** PostgreSQL 16 (Railway in prod, docker-compose locally)
- **External APIs:** Groq (Llama 3.3 70B, primary LLM), Google Gemini Flash 2.0 (fallback LLM), CoinGecko (prices), CryptoPanic (news), Reddit JSON endpoint (memes)
- **Testing:** pytest + httpx test client (backend), Vitest + React Testing Library (frontend)
- **Deployment:** Vercel (frontend), Railway (backend + DB)

## Local Dev

```bash
git clone <repo>
cp .env.example .env
docker-compose up
```

`docker-compose up` starts:
- `postgres` on port 5432
- `api` (FastAPI with hot reload) on port 8000
- `web` (Vite dev server) on port 5173

Alembic migrations run automatically on backend container start.

## Commands

### Backend (`/api`)
```bash
pytest                          # run all tests
pytest tests/test_auth.py       # run a single test file
alembic upgrade head            # apply migrations
alembic revision --autogenerate -m "description"  # generate migration
```

### Frontend (`/web`)
```bash
npm run dev       # start dev server
npm run build     # production build
npm run lint      # lint
npx vitest        # run all tests
npx vitest run tests/Quiz.test.tsx  # run a single test file
```

## Architecture

### Folder Structure

```
/api
  app/
    core/         # config.py (Pydantic settings), db.py, security.py (JWT/hashing), deps.py (FastAPI deps)
    models/       # SQLAlchemy models, one file per table
    schemas/      # Pydantic request/response schemas
    services/
      coingecko.py
      cryptopanic.py
      reddit_memes.py
      llm/        # base.py (LLMClient interface), groq.py, gemini.py
      cache.py    # api_cache table helpers
      recommender.py  # filters content by user preferences
    routers/      # auth.py, me.py, dashboard.py, votes.py, insights.py
    jobs/         # daily_insights.py (scheduled 00:05 UTC)
    main.py
  prompts/
    daily_insight_v1.txt
  tests/
  alembic/

/web
  src/
    components/ui/    # shadcn primitives
    features/
      auth/           # Login, Signup, hooks
      onboarding/     # Quiz form
      dashboard/
        sections/     # NewsSection, PricesSection, InsightSection, MemeSection
        VoteButtons.tsx
        DashboardPage.tsx
      preferences/
    lib/
      api.ts          # fetch wrapper (sends cookies)
      queryClient.ts
      types.ts
    routes/
    App.tsx
```

### Key Flows

**Auth:** JWT stored in httpOnly + Secure + SameSite=Lax cookie, 7-day sliding expiry. Logout via `POST /auth/logout`.

**Routing:** `/` redirects to `/login` (unauthenticated), `/onboarding` (onboarding incomplete), or `/dashboard`. Authenticated pages block access to `/dashboard` until onboarding is done.

**Dashboard:** Single `GET /dashboard` endpoint returns all four sections filtered by user preferences. Each section loads independently with its own skeleton. Sections shown based on content preferences: "Market News" → news, "Charts" → prices, "Fun" → meme; AI insight is always shown.

**AI Insight caching:** One insight per `(investor_type, date)` — max 3 LLM calls/day regardless of user count. Pre-generated at 00:05 UTC; lazy generation on first request if the job fails. Fallback chain: Groq → Gemini (on retry) → static error message.

**Voting:** Upsert/toggle — same value removes the vote, opposite value replaces it. One vote per `(user, content_item)`. Optimistic UI updates via TanStack Query with rollback on error.

**Caching:** News cached server-side for 10 min, memes for 6 hours (stored in `api_cache` table). Coin prices are live (no cache). Stale data served with "Last updated: X ago" indicator on fetch failure.

### Data Model (key tables)

- `users` — id, email, name, password_hash, onboarding_completed
- `user_preferences` — coins[], investor_types[] (max 2), content_types[]
- `content_items` — type (news|price|insight|meme), title, body, category_tags[], meta (jsonb)
- `votes` — user_id, content_item_id, value (-1|1), unique constraint
- `daily_insights_cache` — investor_type, date, content_item_id, unique per (investor_type, date)
- `api_cache` — key, payload (jsonb), fetched_at, expires_at

## Environment Variables

### Backend
```
DATABASE_URL
JWT_SECRET
JWT_ALGORITHM=HS256
COOKIE_DOMAIN
FRONTEND_ORIGIN
COINGECKO_API_KEY
CRYPTOPANIC_API_KEY
GROQ_API_KEY
GEMINI_API_KEY
```

### Frontend
```
VITE_API_BASE_URL
```