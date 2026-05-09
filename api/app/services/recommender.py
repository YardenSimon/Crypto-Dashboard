import asyncio
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.content_item import ContentItem, ContentType
from app.models.vote import Vote
from app.models.user import User
from app.services import coingecko, news as news_svc, reddit_memes
from app.services.cache import format_cache_age, get_cached, get_stale_cached
from app.jobs.daily_insights import generate_insight_for
from app.services.news import CACHE_KEY as NEWS_KEY
from app.services.reddit_memes import CACHE_KEY as MEME_KEY


def _upsert_news_content_items(items: list[dict], db: Session) -> None:
    urls = [item["url"] for item in items]
    existing = {
        row.source_url: str(row.id)
        for row in db.execute(
            select(ContentItem.id, ContentItem.source_url)
            .where(ContentItem.source_url.in_(urls))
        ).all()
    }
    new_pairs: list[tuple[dict, ContentItem]] = []
    for item in items:
        if item["url"] not in existing:
            ci = ContentItem(
                type=ContentType.news,
                title=item["title"],
                body=item["title"],
                source_url=item["url"],
                category_tags=item.get("currencies", []),
                meta={},
            )
            db.add(ci)
            new_pairs.append((item, ci))
    if new_pairs:
        db.flush()
    for item in items:
        item["content_item_id"] = existing.get(item["url"]) or next(
            (str(ci.id) for d, ci in new_pairs if d is item), None
        )


def _upsert_price_content_items(items: list[dict], db: Session) -> None:
    symbols = [item["symbol"] for item in items]
    existing = {
        row.title: str(row.id)
        for row in db.execute(
            select(ContentItem.id, ContentItem.title)
            .where(ContentItem.type == ContentType.price, ContentItem.title.in_(symbols))
        ).all()
    }
    new_pairs: list[tuple[dict, ContentItem]] = []
    for item in items:
        if item["symbol"] not in existing:
            ci = ContentItem(
                type=ContentType.price,
                title=item["symbol"],
                body=item["name"],
                category_tags=[item["symbol"]],
                meta={"symbol": item["symbol"]},
            )
            db.add(ci)
            new_pairs.append((item, ci))
    if new_pairs:
        db.flush()
    for item in items:
        item["content_item_id"] = existing.get(item["symbol"]) or next(
            (str(ci.id) for d, ci in new_pairs if d is item), None
        )


def _upsert_meme_content_item(meme: dict, db: Session) -> None:
    url = meme.get("reddit_url")
    if not url:
        return
    existing_id = db.execute(
        select(ContentItem.id).where(ContentItem.source_url == url)
    ).scalar_one_or_none()
    if existing_id:
        meme["content_item_id"] = str(existing_id)
    else:
        ci = ContentItem(
            type=ContentType.meme,
            title=meme["title"],
            body="",
            source_url=url,
            image_url=meme.get("image_url"),
            category_tags=[],
            meta={},
        )
        db.add(ci)
        db.flush()
        meme["content_item_id"] = str(ci.id)


async def assemble_dashboard(user: User, db: Session) -> dict:
    prefs = user.preferences
    if not prefs:
        return {"news": None, "prices": None, "insights": [], "meme": None, "cache_ages": {}, "user_votes": {}}

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

    if news_data:
        _upsert_news_content_items(news_data, db)
    if prices_data:
        _upsert_price_content_items(prices_data, db)
    if meme_data:
        _upsert_meme_content_item(meme_data, db)
    db.commit()

    all_ids: list[uuid.UUID] = []
    if news_data:
        all_ids += [uuid.UUID(i["content_item_id"]) for i in news_data if i.get("content_item_id")]
    if prices_data:
        all_ids += [uuid.UUID(i["content_item_id"]) for i in prices_data if i.get("content_item_id")]
    if meme_data and meme_data.get("content_item_id"):
        all_ids.append(uuid.UUID(meme_data["content_item_id"]))
    for insight in insights_data:
        try:
            all_ids.append(uuid.UUID(insight["id"]))
        except (ValueError, KeyError):
            pass

    user_votes: dict[str, int] = {}
    if all_ids:
        rows = db.execute(
            select(Vote.content_item_id, Vote.value)
            .where(Vote.user_id == user.id, Vote.content_item_id.in_(all_ids))
        ).all()
        user_votes = {str(row.content_item_id): row.value for row in rows}

    return {
        "news": news_data,
        "prices": prices_data,
        "insights": insights_data,
        "meme": meme_data,
        "cache_ages": cache_ages,
        "user_votes": user_votes,
    }
