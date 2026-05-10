import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import type { InsightItem } from '@/lib/types'
import { VoteButtons } from '../VoteButtons'
import type { DragHeaderProps } from './NewsSection'

interface InsightSectionProps {
  dragProps?: DragHeaderProps
}

export function InsightSkeleton() {
  return (
    <div className="space-y-5 px-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="animate-pulse pl-4 space-y-2">
          <div className="h-3 bg-surface3 rounded w-1/4" />
          <div className="h-4 bg-surface3 rounded w-full" />
          <div className="h-4 bg-surface3 rounded w-5/6" />
          <div className="h-4 bg-surface3 rounded w-4/5" />
        </div>
      ))}
    </div>
  )
}

export function InsightSection({ dragProps = {} }: InsightSectionProps) {
  const { data: insights, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    select: (d) => d.insights,
  })

  const retry = useMutation({
    mutationFn: api.retryInsight,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  })

  const hasFailed = isError || (!isLoading && insights !== undefined && insights.length === 0)

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <section className="rounded-2xl border border-line bg-surface shadow-card">
      {/* header */}
      <div
        {...dragProps}
        className={`flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line touch-none select-none ${dragProps?.onPointerDown ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="min-w-0 flex items-start gap-3">
          {dragProps?.onPointerDown && <DragHandle />}
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate2Lift mb-1">
              Llama 3.3 70B · Generated 00:05 UTC · {today}
            </p>
            <h2 className="font-semibold text-[15px] text-ink leading-tight">AI Insight of the Day</h2>
          </div>
        </div>
        {hasFailed && (
          retry.isPending ? (
            <p className="text-xs text-muted-foreground italic shrink-0">Bribing the AI with memecoins... one sec 🤞</p>
          ) : (
            <button
              onClick={() => retry.mutate()}
              className="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-md border border-line2 bg-surface text-ink hover:bg-surface2 hover:border-mauveLift/50 transition-colors shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M21 12a9 9 0 1 1-3-6.7L21 8"/>
                <path d="M21 3v5h-5"/>
              </svg>
              Retry
            </button>
          )
        )}
      </div>

      <div className="px-6 py-5">
        {retry.isError && (
          <p className="text-xs text-down mb-3">{(retry.error as Error).message}</p>
        )}
        {isLoading ? (
          <InsightSkeleton />
        ) : !insights?.length ? (
          <p className="text-sm text-mute">No insight available. Try the Retry button.</p>
        ) : (
          <ul className="space-y-5">
            {insights.map((item: InsightItem) => (
              <li key={item.id} className="relative pl-4">
                <span className="absolute left-0 top-1.5 bottom-1 w-0.5 rounded-full bg-gradient-to-b from-teal to-plumLift" />
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[10.5px] font-semibold uppercase tracking-[0.08em] bg-plumLift/30 text-ink border-plumLift/60">
                      {item.investor_type}
                    </span>
                    <span className="text-[11px] text-mute">· tailored for you</span>
                  </div>
                  <VoteButtons contentItemId={item.id} />
                </div>
                <p className="text-[13.5px] leading-relaxed text-ink">{item.body}</p>
              </li>
            ))}
          </ul>
        )}

        {insights?.length && (
          <div className="mt-5 pt-4 border-t border-line text-[11.5px] text-mute flex items-center justify-between">
            <span>
              Personalized to your investor types:{' '}
              <span className="text-subt font-semibold">
                {insights.map((i) => i.investor_type).join(' · ')}
              </span>
            </span>
            <a href="/preferences" className="text-ink font-semibold hover:text-teal transition-colors inline-flex items-center gap-1">
              Adjust preferences
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <path d="M14 4h6v6"/><path d="M10 14 20 4"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>
              </svg>
            </a>
          </div>
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
