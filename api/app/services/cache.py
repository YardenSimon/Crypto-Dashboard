from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.api_cache import APICache


def get_stale_cached(key: str, db: Session) -> tuple[dict, datetime] | None:
    entry = db.get(APICache, key)
    if entry:
        return entry.payload, entry.fetched_at.replace(tzinfo=timezone.utc)
    return None


def format_cache_age(fetched_at: datetime) -> str:
    minutes = int((datetime.now(timezone.utc) - fetched_at).total_seconds() / 60)
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    hours = minutes // 60
    return f"{hours} hour{'s' if hours != 1 else ''} ago"


def get_cached(key: str, db: Session) -> dict | None:
    entry = db.get(APICache, key)
    if entry and entry.expires_at.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
        return entry.payload
    return None


def set_cached(key: str, payload: dict, ttl_seconds: int, db: Session) -> None:
    now = datetime.now(timezone.utc)
    expires = now + timedelta(seconds=ttl_seconds)
    entry = db.get(APICache, key)
    if entry:
        entry.payload = payload
        entry.fetched_at = now
        entry.expires_at = expires
    else:
        db.add(APICache(key=key, payload=payload, fetched_at=now, expires_at=expires))
    db.commit()
