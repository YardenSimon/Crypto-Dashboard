import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { NewsItem } from '@/lib/types'
import { VoteButtons } from '../VoteButtons'

function NewsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-1">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}

export function NewsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    refetchInterval: 10 * 60_000,
    select: (d) => ({ items: d.news, cacheAge: d.cache_ages.news }),
  })

  return (
    <section className="rounded-xl border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">Market News</h2>
        {data?.cacheAge && (
          <span className="text-xs text-muted-foreground">Last updated: {data.cacheAge}</span>
        )}
      </div>
      {isLoading ? (
        <NewsSkeleton />
      ) : !data?.items?.length ? (
        <p className="text-sm text-muted-foreground">No news available.</p>
      ) : (
        <ul className="space-y-3">
          {data.items.map((item: NewsItem) => (
            <li key={item.url} className="flex items-start justify-between gap-2">
              <div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium hover:underline"
                >
                  {item.title}
                </a>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.published_at).toLocaleString()}
                  {item.currencies.length > 0 && ` · ${item.currencies.join(', ')}`}
                </p>
              </div>
              <VoteButtons contentItemId={item.content_item_id} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
