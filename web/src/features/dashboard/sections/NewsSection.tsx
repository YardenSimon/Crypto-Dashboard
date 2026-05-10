import type { PointerEventHandler } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { NewsItem } from '@/lib/types'
import { VoteButtons } from '../VoteButtons'
import { CoinMark } from '@/components/CoinMark'

const NEWS_ROW_H = 78

export interface DragHeaderProps {
  onPointerDown?: PointerEventHandler<HTMLDivElement>
}

interface NewsSectionProps {
  dragProps?: DragHeaderProps
}

export function NewsSkeleton() {
  return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse flex gap-3 py-2">
          <div className="w-7 h-7 rounded-full bg-surface3 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-surface3 rounded w-4/5" />
            <div className="h-3 bg-surface3 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function NewsSection({ dragProps = {} }: NewsSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    refetchInterval: 10 * 60_000,
    select: (d) => ({ items: d.news, cacheAge: d.cache_ages.news }),
  })

  return (
    <section className="rounded-2xl border border-line bg-surface shadow-card">
      <div
        {...dragProps}
        className={`flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line touch-none select-none ${dragProps?.onPointerDown ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="min-w-0 flex items-start gap-3">
          {dragProps?.onPointerDown && <DragHandle />}
          <h2 className="font-semibold text-[15px] text-ink leading-tight">Market News</h2>
        </div>
        {data?.cacheAge && (
          <span className="text-[11px] text-mute shrink-0">Updated {data.cacheAge}</span>
        )}
      </div>
      <div className="px-2 py-2">
        {isLoading ? (
          <NewsSkeleton />
        ) : !data?.items?.length ? (
          <p className="text-sm text-mute px-4 py-4">No news available.</p>
        ) : (
          <ul
            className="overflow-y-auto px-4 py-1"
            style={{ height: NEWS_ROW_H * 5 + 'px' }}
          >
            {data.items.map((item: NewsItem, i: number) => (
              <li
                key={item.url}
                className={`group flex items-start gap-4 py-3 ${i ? 'border-t border-line' : ''}`}
                style={{ minHeight: NEWS_ROW_H + 'px' }}
              >
                <div className="flex flex-col items-center pt-0.5">
                  {item.currencies.slice(0, 1).map((c) => (
                    <CoinMark key={c} sym={c} size={28} />
                  ))}
                  {item.currencies.length > 1 && (
                    <span className="mt-1 text-[10px] text-mute font-mono">+{item.currencies.length - 1}</span>
                  )}
                  {item.currencies.length === 0 && <CoinMark sym="?" size={28} />}
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[13.5px] font-semibold text-ink leading-snug group-hover:text-teal transition-colors"
                  >
                    {item.title}
                  </a>
                  <div className="mt-1.5 flex items-center gap-2 text-[11.5px] text-mute flex-wrap">
                    <span>{new Date(item.published_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    {item.currencies.length > 0 && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-line2 inline-block" />
                        <span className="font-semibold text-subt">{item.currencies.join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="pt-0.5">
                  <VoteButtons contentItemId={item.content_item_id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function DragHandle() {
  return (
    <span className="text-mute opacity-50 hover:opacity-100 mt-[3px]" aria-hidden="true" title="Long-press to drag">
      <svg viewBox="0 0 16 16" width="12" height="12">
        <circle cx="5" cy="4" r="1" fill="currentColor" />
        <circle cx="5" cy="8" r="1" fill="currentColor" />
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="11" cy="4" r="1" fill="currentColor" />
        <circle cx="11" cy="8" r="1" fill="currentColor" />
        <circle cx="11" cy="12" r="1" fill="currentColor" />
      </svg>
    </span>
  )
}
