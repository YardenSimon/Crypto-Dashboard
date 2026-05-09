from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.jobs.daily_insights import run_daily_insights_job
from app.routers import auth, me, dashboard, insights, votes

scheduler = AsyncIOScheduler(timezone="UTC")


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        run_daily_insights_job,
        CronTrigger(hour=0, minute=5, timezone="UTC"),
        id="daily_insights",
        replace_existing=True,
    )
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Cryptide API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(me.router)
app.include_router(dashboard.router)
app.include_router(insights.router)
app.include_router(votes.router)


@app.get("/health")
def health():
    return {"status": "ok"}
