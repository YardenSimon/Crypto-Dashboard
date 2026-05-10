# Cryptide — Project Brief

## Goal

Cryptide is a personalized crypto investor dashboard. Users sign up, complete a short onboarding quiz capturing their crypto interests, and are shown a daily customized dashboard with four content sections filtered to their preferences. Users can thumbs-up or thumbs-down individual content items to inform future recommendations.

**Stated priorities:** clean UX, readable code, good structure.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI 0.111+ (Python 3.11+) |
| ASGI Server | Uvicorn 0.29+ |
| ORM | SQLAlchemy 2.0+ |
| Migrations | Alembic 1.13+ |
| Validation & serialization | Pydantic v2.7+ (Pydantic-Settings 2.2+) |
| Password hashing | argon2-cffi 23.1+ |
| JWT | python-jose 3.3+ (HS256) |
| HTTP client (external APIs) | httpx 0.27+ (async) |
| Database driver | psycopg2-binary 2.9+ |
| Testing | pytest 8.2+, pytest-asyncio 0.23+ |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React + Vite + TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| Data fetching & caching | TanStack Query (React Query) |
| Routing | React Router |
| Forms & validation | React Hook Form + Zod |
| Testing | Vitest + React Testing Library |

### Database
- **PostgreSQL 16** (Railway managed in production; Docker Compose locally)

### External APIs
| Service | Purpose | Auth |
|---|---|---|
| Groq API (Llama 3.3 70B) | Primary LLM for daily insight generation | API key |
| Google Gemini Flash 2.0 | Fallback LLM (on insight retry) | API key |
| CoinGecko API | Live coin price data | Free demo key |
| RSS feeds (CoinTelegraph, Decrypt, CoinDesk) | Crypto news headlines | None required |
| Reddit JSON endpoint (`r/cryptocurrencymemes`) | Daily meme | None required |

### Deployment
| Target | Platform |
|---|---|
| Frontend | Vercel |
| Backend + Database | Railway |
| Local development | Docker Compose |

---

## Architecture

### Directory Layout

```
Crypto-Dashboard/
├── api/                          # Backend
│   ├── app/
│   │   ├── main.py               # FastAPI app init, router registration, CORS
│   │   ├── core/
│   │   │   ├── config.py         # Pydantic Settings, reads from .env
│   │   │   ├── db.py             # SQLAlchemy engine, Session factory
│   │   │   ├── security.py       # JWT encode/decode, argon2 hashing
│   │   │   └── deps.py           # FastAPI Depends: get_db, get_current_user
│   │   ├── models/               # SQLAlchemy ORM models (one file per table)
│   │   │   ├── user.py
│   │   │   ├── user_preference.py
│   │   │   ├── content_item.py
│   │   │   ├── vote.py
│   │   │   ├── daily_insight_cache.py
│   │   │   └── api_cache.py
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   │   ├── auth.py           # SignupRequest, LoginRequest
│   │   │   ├── user.py           # UserResponse
│   │   │   └── preferences.py    # PreferencesRequest/Response with validators
│   │   ├── routers/
│   │   │   ├── auth.py           # /auth/signup, /login, /logout
│   │   │   ├── me.py             # GET /me, GET+PUT /me/preferences
│   │   │   ├── dashboard.py      # GET /dashboard
│   │   │   ├── votes.py          # POST /votes
│   │   │   └── insights.py       # POST /insights/retry
│   │   ├── services/
│   │   │   ├── coingecko.py
│   │   │   ├── news.py
│   │   │   ├── reddit_memes.py
│   │   │   ├── llm/
│   │   │   │   ├── base.py       # LLMClient interface
│   │   │   │   ├── groq.py
│   │   │   │   └── gemini.py
│   │   │   ├── cache.py          # api_cache table helpers
│   │   │   └── recommender.py    # Filters content by user preferences
│   │   └── jobs/
│   │       └── daily_insights.py # Scheduled insight generation (00:05 UTC)
│   ├── prompts/
│   │   └── daily_insight_v1.txt  # Versioned LLM prompt template
│   ├── tests/
│   ├── alembic/
│   ├── pyproject.toml
│   └── Dockerfile
│
└── web/                          # Frontend
    └── src/
        ├── components/ui/        # shadcn primitives
        ├── features/
        │   ├── auth/             # Login, Signup, hooks
        │   ├── onboarding/       # Quiz form
        │   ├── dashboard/
        │   │   ├── sections/     # NewsSection, PricesSection, InsightSection, MemeSection
        │   │   ├── VoteButtons.tsx
        │   │   └── DashboardPage.tsx
        │   └── preferences/
        ├── lib/
        │   ├── api.ts            # fetch wrapper, sends cookies
        │   ├── queryClient.ts
        │   └── types.ts
        └── routes/
```

### Key Architectural Patterns

- **Dependency injection:** FastAPI `Depends()` for DB sessions and authenticated user retrieval.
- **Database sessions:** Injected per-request with automatic commit/rollback.
- **Configuration:** `Pydantic BaseSettings` reads from environment variables and `.env` file.
- **Model layer:** SQLAlchemy 2.0 `mapped_column` with full type annotations.
- **Schema layer:** Pydantic v2 with field validators (email normalization, list constraints).
- **JWT:** Stored exclusively in `httpOnly`, `Secure`, `SameSite=Lax` cookies (never localStorage). 7-day expiry, refreshed on every authenticated request (sliding session).
- **CORS:** Configured to allow only the Vercel frontend origin.

---

## Data Model

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key, auto-generated |
| email | text | Unique, stored lowercase |
| name | text | |
| password_hash | text | Argon2 |
| onboarding_completed | boolean | Default false |
| created_at, updated_at | timestamptz | |

### `user_preferences`
| Column | Type | Notes |
|---|---|---|
| user_id | UUID | PK + FK → users.id |
| coins | text[] | e.g. `['BTC', 'ETH', 'SOL']`, min 1 |
| investor_types | text[] | Max 2: HODLer / Day Trader / NFT Collector |
| content_types | text[] | Subset of: Market News, Coin Prices, AI Insight of the Day, Daily Meme |
| updated_at | timestamptz | |

### `content_items`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| type | enum | `news` / `price` / `insight` / `meme` |
| title | text | |
| body | text | |
| source_url | text | Nullable |
| image_url | text | Nullable |
| category_tags | text[] | e.g. `['nft', 'news']`, used for vote aggregation |
| generated_for | text | Nullable — investor_type for insights |
| meta | jsonb | Raw payload from source API |
| created_at | timestamptz | |

### `votes`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → users.id |
| content_item_id | UUID | FK → content_items.id |
| value | smallint | -1 or 1 |
| created_at, updated_at | timestamptz | |
| — | unique | (user_id, content_item_id) |

Toggle behavior: same value → removes vote; opposite value → replaces it.

### `daily_insights_cache`
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| investor_type | text | |
| date | date | |
| content_item_id | UUID | FK → content_items.id |
| — | unique | (investor_type, date) |

Ensures at most 3 LLM calls per day regardless of user count (one per investor type).

### `api_cache`
| Column | Type | Notes |
|---|---|---|
| key | text | Primary key (e.g. `crypto_news`, `reddit_meme`) |
| payload | jsonb | |
| fetched_at | timestamptz | |
| expires_at | timestamptz | News: 10 min; Memes: 6 hours |

---

## API Endpoints

```
POST /auth/signup          { email, name, password }
                           → UserResponse; sets JWT cookie

POST /auth/login           { email, password }
                           → UserResponse; sets JWT cookie

POST /auth/logout          → 204; clears JWT cookie

GET  /me                   → UserResponse (+ refreshes cookie)

GET  /me/preferences       → PreferencesResponse

PUT  /me/preferences       { coins, investor_types, content_types }
                           → PreferencesResponse; sets onboarding_completed=true

GET  /dashboard            → { news[], prices[], insights[], meme }
                             Filtered by user preferences.
                             Each section includes cache_age metadata.

POST /votes                { content_item_id, value: 1 | -1 | 0 }
                             Upsert/toggle. value=0 removes the vote.

POST /insights/retry       → Regenerates today's insight via Gemini fallback.
                             Rate-limited: 1 retry/hour after first failure.

GET  /health               → { status: "ok" }
```

All authenticated endpoints require the JWT cookie. CORS allows only the configured frontend origin.

---

## Features

### Authentication
- Email + password signup with Argon2 hashing.
- JWT login with sliding 7-day httpOnly cookie.
- Logout clears the cookie server-side.
- Pydantic validation: email normalization, password constraints.
- No password reset or email verification in v1.

### Onboarding Quiz
- Three multi-select questions stored in `user_preferences`.
- Coins: BTC, ETH, SOL, BNB, XRP, ADA, DOGE, POL, DOT, AVAX, LINK, UNI (min 1).
- Investor types: HODLer, Day Trader, NFT Collector (min 1, max 2).
- Content types: Market News, Coin Prices, AI Insight of the Day, Daily Meme (min 1, max 4).
- Submitting the quiz sets `onboarding_completed = true` and redirects to `/dashboard`.

### Dashboard — Four Independent Sections

| Section | Data Source | Cache Strategy | Frontend Refresh |
|---|---|---|---|
| Market News | RSS feeds (CoinTelegraph, Decrypt, CoinDesk) | Server-side, 10 min (`api_cache`) | On open + every 10 min |
| Coin Prices | CoinGecko API | None (live) | Every 60s while page open |
| AI Insight of the Day | Groq → Gemini | Per `(investor_type, date)` | Once per day |
| Crypto Meme | Reddit JSON | Server-side, 6 hours (`api_cache`) | On open |

Section visibility is controlled by content preferences:
- "Market News" → News section
- "Coin Prices" → Coin Prices section
- "AI Insight of the Day" → Insight section
- "Daily Meme" → Meme section

Graceful degradation: stale `api_cache` data is served with "Last updated: X ago" if a live fetch fails. Sections never show as broken.

### AI Insight of the Day
- Generated by Groq (Llama 3.3 70B) using a versioned prompt (`prompts/daily_insight_v1.txt`).
- Prompt includes the investor type and top 5–10 relevant news headlines.
- Output: 2–3 plain-English sentences, no jargon.
- One insight per investor type per day (max 3 LLM API calls/day total).
- Pre-generated at 00:05 UTC by a scheduled job; generated lazily on first request if job fails.
- Users with 2 investor types see both insights stacked vertically.
- Fallback chain: Groq → Gemini Flash 2.0 (on retry) → static error message.
- Retry button rate-limited to once per hour after first failure.

### Voting
- Vote on any content item (news article, price card, insight, or meme).
- One vote per `(user, content_item)`. Toggle/upsert behavior.
- Frontend uses optimistic UI via TanStack Query with rollback on server error.
- `category_tags` on content items enable future vote aggregation by category.

### Preferences Page
- Same form as onboarding, pre-filled with the user's current values.
- Allows updating preferences at any time post-onboarding.

### Frontend
- Routing: `/login`, `/signup`, `/onboarding`, `/dashboard`, `/preferences`.
- `/` redirects based on auth state: unauthenticated → /login, onboarding incomplete → /onboarding, else → /dashboard.
- Header with app name and user dropdown (Preferences, Logout).
- Desktop-only 2×2 grid layout for the dashboard.
- Each dashboard section loads independently with its own loading skeleton.
- Full-grid skeleton on first dashboard load after completing onboarding.
- Button spinner on login/signup submit.

### Tests
- Backend (~8 tests): auth happy path, vote toggle, feed assembly with mocked external APIs, onboarding redirect middleware, cache hit/miss for news endpoint.
- Frontend (~5 tests): quiz form validation (min/max selections), vote optimistic update + rollback, login error display, onboarding redirect, skeleton render while loading.

---

## Routing & Pages

```
/login           — Public. Email + password form.
/signup          — Public. Name, email, password form.
/onboarding      — Authenticated only. Three-question quiz. Blocks /dashboard.
/dashboard       — Authenticated + onboarding complete. 2×2 grid.
/preferences     — Authenticated + onboarding complete. Pre-filled quiz form.
/                — Redirects: unauthenticated → /login,
                              onboarding incomplete → /onboarding,
                              else → /dashboard
```

---

## Environment Variables

### Backend
```
DATABASE_URL            # PostgreSQL connection string
JWT_SECRET              # Signing secret for HS256 JWTs
JWT_ALGORITHM=HS256
ENVIRONMENT             # development | production
COOKIE_DOMAIN           # localhost or production domain
FRONTEND_ORIGIN         # CORS allowed origin (e.g. http://localhost:5173)
COINGECKO_API_KEY
GROQ_API_KEY
GEMINI_API_KEY
```

### Frontend
```
VITE_API_BASE_URL       # Backend URL (e.g. http://localhost:8000)
```

---

## Local Development

```bash
git clone <repo>
cp .env.example .env
docker-compose up
```

Docker Compose starts:
- `postgres` on port 5432
- `api` (FastAPI with hot reload) on port 8000
- `web` (Vite dev server) on port 5173

Alembic migrations run automatically on backend container start (`alembic upgrade head`).
