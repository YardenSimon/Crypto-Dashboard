import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.user import User
from app.services import coingecko, news as news_svc, reddit_memes
from app.services.cache import format_cache_age, get_cached, get_stale_cached
from app.jobs.daily_insights import generate_insight_for
from app.services.news import CACHE_KEY as NEWS_KEY
from app.services.reddit_memes import CACHE_KEY as MEME_KEY


async def assemble_dashboard(user: User, db: Session) -> dict:
    prefs = user.preferences
    if not prefs:
        return {"news": None, "prices": None, "insights": [], "meme": None, "cache_ages": {}}

    content_types = set(prefs.content_types)
    coros, labels = [], []

    if "Market News" in content_types:
        coros.append(news_svc.fetch_news(prefs.coins, db))
        labels.append("news")
    if "Charts" in content_types:
        coros.append(coingecko.fetch_prices(prefs.coins))
        labels.append("prices")
    if "Fun" in content_types:
        coros.append(reddit_memes.fetch_meme(db))
        labels.append("meme")
    for it in prefs.investor_types:
        coros.append(generate_insight_for(it, db))
        labels.append(f"insight_{it}")

    raw = await asyncio.gather(*coros, return_exceptions=True)
    results = dict(zip(labels, raw))

    cache_ages = {}

    # ── News ──────────────────────────────────────────────────────────────
    news_data = None
    if "Market News" in content_types:
        raw_news = results.get("news")
        if isinstance(raw_news, Exception) or not raw_news:
            stale = get_stale_cached(NEWS_KEY, db)
            if stale:
                raw_news, fetched_at = stale[0]["items"], stale[1]
                cache_ages["news"] = format_cache_age(fetched_at)
        if raw_news and not isinstance(raw_news, Exception):
            user_coins = set(prefs.coins)
            news_data = [
                item for item in raw_news
                if not item["currencies"] or bool(set(item["currencies"]) & user_coins)
            ]

    # ── Prices ────────────────────────────────────────────────────────────
    prices_data = None
    if "Charts" in content_types:
        raw_prices = results.get("prices")
        if not isinstance(raw_prices, Exception):
            prices_data = raw_prices

    # ── Meme ──────────────────────────────────────────────────────────────
    meme_data = None
    if "Fun" in content_types:
        raw_meme = results.get("meme")
        if isinstance(raw_meme, Exception) or not raw_meme:
            stale = get_stale_cached(MEME_KEY, db)
            if stale:
                meme_data, fetched_at = stale[0], stale[1]
                cache_ages["meme"] = format_cache_age(fetched_at)
        elif raw_meme:
            meme_data = raw_meme

    # ── Insights ──────────────────────────────────────────────────────────
    insights_data = []
    for it in prefs.investor_types:
        item = results.get(f"insight_{it}")
        if item and not isinstance(item, Exception):
            insights_data.append({
                "id": str(item.id),
                "investor_type": it,
                "body": item.body,
            })

    return {
        "news": news_data,
        "prices": prices_data,
        "insights": insights_data,
        "meme": meme_data,
        "cache_ages": cache_ages,
    }
