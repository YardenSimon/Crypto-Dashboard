from datetime import date
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.db import SessionLocal
from app.models.content_item import ContentItem, ContentType
from app.models.daily_insight_cache import DailyInsightCache
from app.services.llm.gemini import GeminiClient
from app.services.llm.groq import GroqClient

INVESTOR_TYPES = ["HODLer", "Day Trader", "NFT Collector"]
PROMPT_PATH = Path(__file__).parent.parent.parent / "prompts" / "daily_insight_v1.txt"


async def generate_insight_for(investor_type: str, db: Session) -> ContentItem | None:
    today = date.today()

    existing = (
        db.query(DailyInsightCache)
        .filter_by(investor_type=investor_type, date=today)
        .first()
    )
    if existing:
        return existing.content_item

    template = PROMPT_PATH.read_text()
    prompt = template.format(investor_type=investor_type)

    content: str | None = None
    for ClientClass in (GroqClient, GeminiClient):
        try:
            content = await ClientClass().generate(prompt)
            break
        except Exception:
            continue

    if not content:
        return None

    item = ContentItem(
        type=ContentType.insight,
        title=f"Daily Insight for {investor_type}",
        body=content,
        generated_for=investor_type,
        category_tags=[],
        meta={},
    )
    db.add(item)
    db.flush()

    try:
        db.add(DailyInsightCache(
            investor_type=investor_type,
            date=today,
            content_item_id=item.id,
        ))
        db.commit()
        db.refresh(item)
    except Exception:
        db.rollback()
        existing = (
            db.query(DailyInsightCache)
            .filter_by(investor_type=investor_type, date=today)
            .first()
        )
        return existing.content_item if existing else None

    return item


async def run_daily_insights_job() -> None:
    db = SessionLocal()
    try:
        for investor_type in INVESTOR_TYPES:
            await generate_insight_for(investor_type, db)
    finally:
        db.close()
