from pydantic import BaseModel


class NewsItem(BaseModel):
    title: str
    url: str
    published_at: str
    currencies: list[str]


class PriceItem(BaseModel):
    symbol: str
    name: str
    price_usd: float
    change_24h: float
    market_cap_usd: float


class InsightItem(BaseModel):
    id: str
    investor_type: str
    body: str


class MemeItem(BaseModel):
    title: str
    image_url: str
    reddit_url: str
    upvotes: int


class DashboardResponse(BaseModel):
    news: list[NewsItem] | None
    prices: list[PriceItem] | None
    insights: list[InsightItem]
    meme: MemeItem | None
    cache_ages: dict[str, str]
