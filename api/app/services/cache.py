from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.api_cache import APICache


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
