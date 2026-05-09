export interface User {
  id: string
  email: string
  name: string
  onboarding_completed: boolean
}

export interface Preferences {
  coins: string[]
  investor_types: string[]
  content_types: string[]
}

export interface NewsItem {
  title: string
  url: string
  published_at: string
  currencies: string[]
}

export interface PriceItem {
  symbol: string
  name: string
  price_usd: number
  change_24h: number
  market_cap_usd: number
}

export interface InsightItem {
  id: string
  investor_type: string
  body: string
}

export interface MemeItem {
  title: string
  image_url: string
  reddit_url: string
  upvotes: number
}

export interface DashboardResponse {
  news: NewsItem[] | null
  prices: PriceItem[] | null
  insights: InsightItem[]
  meme: MemeItem | null
  cache_ages: Record<string, string>
}
