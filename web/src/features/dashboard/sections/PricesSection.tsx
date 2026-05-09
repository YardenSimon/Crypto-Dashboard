import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PriceItem } from '@/lib/types'
import { VoteButtons } from '../VoteButtons'

function PricesSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse flex justify-between">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/6" />
        </div>
      ))}
    </div>
  )
}

function formatPrice(n: number): string {
  return n >= 1
    ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    : `$${n.toFixed(6)}`
}

export function PricesSection() {
  const { data: prices, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    refetchInterval: 60_000,
    select: (d) => d.prices,
  })

  return (
    <section className="rounded-xl border p-6 space-y-4">
      <h2 className="font-semibold text-base">Coin Prices</h2>
      {isLoading ? (
        <PricesSkeleton />
      ) : !prices?.length ? (
        <p className="text-sm text-muted-foreground">No price data available.</p>
      ) : (
        <ul className="space-y-2">
          {prices.map((item: PriceItem) => (
            <li key={item.symbol} className="flex items-center justify-between text-sm gap-2">
              <span className="font-medium">
                {item.symbol}{' '}
                <span className="text-muted-foreground font-normal">{item.name}</span>
              </span>
              <span className="tabular-nums">{formatPrice(item.price_usd)}</span>
              <span className={item.change_24h >= 0 ? 'text-green-600' : 'text-red-500'}>
                {item.change_24h >= 0 ? '+' : ''}{item.change_24h.toFixed(2)}%
              </span>
              <VoteButtons contentItemId={item.content_item_id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
