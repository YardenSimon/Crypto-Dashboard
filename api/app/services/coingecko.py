import httpx

from app.core.config import settings

COINGECKO_ID_MAP = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "BNB": "binancecoin",
    "XRP": "ripple",
    "ADA": "cardano",
    "DOGE": "dogecoin",
    "MATIC": "matic-network",
    "DOT": "polkadot",
    "AVAX": "avalanche-2",
    "LINK": "chainlink",
    "UNI": "uniswap",
}

COINGECKO_NAME_MAP = {v: k for k, v in COINGECKO_ID_MAP.items()}

COIN_NAMES = {
    "BTC": "Bitcoin",
    "ETH": "Ethereum",
    "SOL": "Solana",
    "BNB": "BNB",
    "XRP": "XRP",
    "ADA": "Cardano",
    "DOGE": "Dogecoin",
    "MATIC": "Polygon",
    "DOT": "Polkadot",
    "AVAX": "Avalanche",
    "LINK": "Chainlink",
    "UNI": "Uniswap",
}


async def fetch_prices(coins: list[str]) -> list[dict]:
    """
    Returns list of:
      {"symbol": "BTC", "name": "Bitcoin", "price_usd": 65000.0,
       "change_24h": 2.3, "market_cap_usd": 1.2e12}
    Raises httpx.HTTPError on network/API failure.
    """
    ids = [COINGECKO_ID_MAP[symbol] for symbol in coins if symbol in COINGECKO_ID_MAP]
    ids_param = ",".join(ids)

    headers = {}
    if settings.COINGECKO_API_KEY:
        headers["x-cg-demo-api-key"] = settings.COINGECKO_API_KEY

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            "https://api.coingecko.com/api/v3/simple/price",
            params={
                "ids": ids_param,
                "vs_currencies": "usd",
                "include_24hr_change": "true",
                "include_market_cap": "true",
            },
            headers=headers,
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for symbol in coins:
        cg_id = COINGECKO_ID_MAP.get(symbol)
        if not cg_id or cg_id not in data:
            continue
        coin_data = data[cg_id]
        results.append({
            "symbol": symbol,
            "name": COIN_NAMES.get(symbol, symbol),
            "price_usd": coin_data.get("usd", 0.0),
            "change_24h": coin_data.get("usd_24h_change", 0.0),
            "market_cap_usd": coin_data.get("usd_market_cap", 0.0),
        })

    return results
