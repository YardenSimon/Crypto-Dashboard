from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.content_item import ContentItem, ContentType
from app.models.daily_insight_cache import DailyInsightCache
from app.models.user import User
from app.schemas.dashboard import InsightItem
from app.services.llm.gemini import GeminiClient
from app.jobs.daily_insights import PROMPT_PATH

router = APIRouter()
_rate_limit: dict[str, datetime] = {}


@router.post("/insights/retry", response_model=list[InsightItem])
async def retry_insights(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uid = str(user.id)
    now = datetime.now(timezone.utc)
    last = _rate_limit.get(uid)
    if last and (now - last) < timedelta(hours=1):
        remaining = int((last + timedelta(hours=1) - now).total_seconds())
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Retry available in {remaining} seconds",
        )
    if not user.preferences:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Preferences not set")

    _rate_limit[uid] = now
    template = PROMPT_PATH.read_text()
    today = date.today()
    results = []

    for investor_type in user.preferences.investor_types:
        prompt = template.format(investor_type=investor_type)
        try:
            content = await GeminiClient().generate(prompt)
        except Exception:
            continue

        cache_entry = db.query(DailyInsightCache).filter_by(
            investor_type=investor_type, date=today
        ).first()

        if cache_entry:
            item = cache_entry.content_item
            item.body = content
            db.commit()
            db.refresh(item)
        else:
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
            db.add(DailyInsightCache(investor_type=investor_type, date=today, content_item_id=item.id))
            db.commit()
            db.refresh(item)

        results.append(InsightItem(id=str(item.id), investor_type=investor_type, body=item.body))

    return results
