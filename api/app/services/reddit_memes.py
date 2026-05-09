import httpx
from sqlalchemy.orm import Session

from app.services.cache import get_cached, set_cached

MEME_TTL = 21600  # 6 hours
CACHE_KEY = "reddit_meme"
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".gif", ".webp")


async def fetch_meme(db: Session) -> dict | None:
    """
    Returns:
      {"title": "...", "image_url": "...", "reddit_url": "...", "upvotes": 1234}
    or None if no suitable post found or API unreachable.
    """
    cached = get_cached(CACHE_KEY, db)
    if cached is not None:
        return cached

    try:
        async with httpx.AsyncClient(
            timeout=15.0,
            headers={"User-Agent": "cryptide/1.0"},
            follow_redirects=True,
        ) as client:
            response = await client.get(
                "https://www.reddit.com/r/cryptocurrencymemes/hot.json",
                params={"limit": 20},
            )
            response.raise_for_status()
            data = response.json()

        posts = data.get("data", {}).get("children", [])
        meme = None
        for child in posts:
            post = child.get("data", {})
            if post.get("is_video") or post.get("over_18"):
                continue
            url = post.get("url", "")
            if not any(url.lower().endswith(ext) for ext in IMAGE_EXTENSIONS):
                continue
            meme = {
                "title": post.get("title", ""),
                "image_url": url,
                "reddit_url": f"https://reddit.com{post.get('permalink', '')}",
                "upvotes": post.get("ups", 0),
            }
            break

        if meme:
            set_cached(CACHE_KEY, meme, MEME_TTL, db)

        return meme

    except Exception:
        return None
