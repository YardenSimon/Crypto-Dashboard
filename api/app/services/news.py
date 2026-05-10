import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

import httpx
from sqlalchemy.orm import Session

from app.services.cache import get_cached, set_cached

NEWS_TTL = 600  # 10 minutes
CACHE_KEY = "crypto_news"

RSS_FEEDS = [
    "https://cointelegraph.com/rss",
    "https://decrypt.co/feed",
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
]

COIN_KEYWORDS = {
    "BTC": ["bitcoin", "btc"],
    "ETH": ["ethereum", "eth", "ether"],
    "SOL": ["solana", "sol"],
    "BNB": ["bnb", "binance coin"],
    "XRP": ["xrp", "ripple"],
    "ADA": ["cardano", "ada"],
    "DOGE": ["dogecoin", "doge"],
    "POL": ["polygon", "matic", "pol"],
    "DOT": ["polkadot", "dot"],
    "AVAX": ["avalanche", "avax"],
    "LINK": ["chainlink", "link"],
    "UNI": ["uniswap", "uni"],
}


async def fetch_news(_coins: list[str], db: Session) -> list[dict]:
    """
    Returns list of up to 10:
      {"title": "...", "url": "...", "published_at": "...", "currencies": ["BTC", "ETH"]}
    Fetches from crypto RSS feeds with a 10-minute server-side cache.
    Returns [] if all feeds are unreachable.
    """
    cached = get_cached(CACHE_KEY, db)
    if cached is not None:
        return cached["items"]

    items = []
    async with httpx.AsyncClient(timeout=15.0, headers={"User-Agent": "cryptide/1.0"}) as client:
        for feed_url in RSS_FEEDS:
            try:
                response = await client.get(feed_url)
                response.raise_for_status()
                root = ET.fromstring(response.text)
                for item in root.findall(".//item"):
                    title = (item.findtext("title") or "").strip()
                    url = (item.findtext("link") or "").strip()
                    pub_date = (item.findtext("pubDate") or "").strip()

                    if not title or not url:
                        continue

                    try:
                        published_at = parsedate_to_datetime(pub_date).isoformat()
                    except Exception:
                        published_at = pub_date

                    title_lower = title.lower()
                    currencies = [
                        symbol
                        for symbol, keywords in COIN_KEYWORDS.items()
                        if any(kw in title_lower for kw in keywords)
                    ]

                    items.append({
                        "title": title,
                        "url": url,
                        "published_at": published_at,
                        "currencies": currencies,
                    })
            except Exception:
                continue

    items.sort(key=lambda x: x["published_at"], reverse=True)
    items = items[:10]

    if items:
        set_cached(CACHE_KEY, {"items": items}, NEWS_TTL, db)

    return items
