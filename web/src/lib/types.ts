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
  dashboard_layout: { left: string[]; right: string[] } | null
  coin_order: string[] | null
}

export interface VoteResponse {
  content_item_id: string
  value: -1 | 1 | 0
}

export interface NewsItem {
  content_item_id: string
  title: string
  url: string
  published_at: string
  currencies: string[]
}

export interface PriceItem {
  content_item_id: string
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
  content_item_id: string
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
  user_votes: Record<string, -1 | 1>
}
