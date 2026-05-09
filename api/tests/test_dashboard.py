from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.security import hash_password
from app.models.api_cache import APICache
from app.models.user import User
from app.models.user_preference import UserPreference

FAKE_RSS = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Bitcoin hits new high</title>
      <link>https://example.com/bitcoin-news</link>
      <pubDate>Mon, 09 May 2026 12:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>"""


@pytest.fixture()
def news_user(db):
    user = User(
        email="newstest@example.com",
        name="News Tester",
        password_hash=hash_password("password123"),
        onboarding_completed=True,
    )
    db.add(user)
    db.flush()
    pref = UserPreference(
        user_id=user.id,
        coins=["BTC"],
        investor_types=[],
        content_types=["Market News"],
    )
    db.add(pref)
    db.commit()
    db.refresh(user)
    yield user
    db.delete(user)
    db.commit()


@pytest.fixture()
def news_auth_client(client, news_user):
    client.post("/auth/login", json={"email": "newstest@example.com", "password": "password123"})
    return client


def test_unauthenticated_dashboard_returns_401(client):
    resp = client.get("/dashboard")
    assert resp.status_code == 401


def test_news_cache_hit_skips_external_call(news_auth_client, db, mocker):
    now = datetime.now(timezone.utc)
    cache_entry = APICache(
        key="crypto_news",
        payload={"items": [
            {"title": "Cached News", "url": "https://example.com/cached", "published_at": now.isoformat(), "currencies": ["BTC"]}
        ]},
        fetched_at=now,
        expires_at=now + timedelta(minutes=10),
    )
    db.merge(cache_entry)
    db.commit()

    try:
        mock_class = mocker.patch("app.services.news.httpx.AsyncClient")
        resp = news_auth_client.get("/dashboard")
        assert resp.status_code == 200
        mock_class.assert_not_called()
    finally:
        entry = db.get(APICache, "crypto_news")
        if entry:
            db.delete(entry)
            db.commit()


def test_news_cache_miss_calls_external_feed(news_auth_client, db, mocker):
    existing = db.get(APICache, "crypto_news")
    if existing:
        db.delete(existing)
        db.commit()

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.text = FAKE_RSS

    mock_async_client = AsyncMock()
    mock_async_client.get.return_value = mock_response

    mock_class = mocker.patch("app.services.news.httpx.AsyncClient")
    mock_class.return_value.__aenter__ = AsyncMock(return_value=mock_async_client)
    mock_class.return_value.__aexit__ = AsyncMock(return_value=False)

    resp = news_auth_client.get("/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    news = data.get("news") or []
    assert any("Bitcoin" in item["title"] for item in news)

    entry = db.get(APICache, "crypto_news")
    if entry:
        db.delete(entry)
        db.commit()
