import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

function MemeSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-48 bg-muted rounded-lg w-full" />
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/4" />
    </div>
  )
}

export function MemeSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    select: (d) => ({ meme: d.meme, cacheAge: d.cache_ages.meme }),
  })

  return (
    <section className="rounded-xl border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">Crypto Meme</h2>
        {data?.cacheAge && (
          <span className="text-xs text-muted-foreground">Last updated: {data.cacheAge}</span>
        )}
      </div>
      {isLoading ? (
        <MemeSkeleton />
      ) : !data?.meme ? (
        <p className="text-sm text-muted-foreground">No meme available today.</p>
      ) : (
        <div className="space-y-2">
          <a href={data.meme.reddit_url} target="_blank" rel="noreferrer">
            <img
              src={data.meme.image_url}
              alt={data.meme.title}
              className="rounded-lg w-full object-contain max-h-64"
            />
          </a>
          <p className="text-sm">{data.meme.title}</p>
          <p className="text-xs text-muted-foreground">{data.meme.upvotes.toLocaleString()} upvotes</p>
        </div>
      )}
    </section>
  )
}
