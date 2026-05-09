import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import type { InsightItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { VoteButtons } from '../VoteButtons'

export function InsightSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="h-3 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      ))}
    </div>
  )
}

export function InsightSection() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    select: (d) => d.insights,
  })

  const retry = useMutation({
    mutationFn: api.retryInsight,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
  })

  return (
    <section className="rounded-xl border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base">AI Insight of the Day</h2>
        <Button
          size="sm"
          variant="outline"
          disabled={retry.isPending}
          onClick={() => retry.mutate()}
        >
          {retry.isPending ? 'Retrying…' : 'Retry'}
        </Button>
      </div>
      {retry.isError && (
        <p className="text-xs text-destructive">{(retry.error as Error).message}</p>
      )}
      {isLoading ? (
        <InsightSkeleton />
      ) : !insights?.length ? (
        <p className="text-sm text-muted-foreground">
          No insight available. Try the Retry button.
        </p>
      ) : (
        <ul className="space-y-4">
          {insights.map((item: InsightItem) => (
            <li key={item.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {item.investor_type}
                </p>
                <VoteButtons contentItemId={item.id} />
              </div>
              <p className="text-sm leading-relaxed">{item.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
