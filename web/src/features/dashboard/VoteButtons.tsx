import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { api } from '@/lib/api'
import type { DashboardResponse } from '@/lib/types'

interface VoteButtonsProps {
  contentItemId: string
}

export function VoteButtons({ contentItemId }: VoteButtonsProps) {
  const { data: currentVote } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    enabled: false,
    select: (d) => d.user_votes?.[contentItemId] ?? null,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (value: -1 | 1 | 0) => api.postVote(contentItemId, value),
    onMutate: async (newValue) => {
      await queryClient.cancelQueries({ queryKey: ['dashboard'] })
      const prev = queryClient.getQueryData<DashboardResponse>(['dashboard'])
      queryClient.setQueryData<DashboardResponse>(['dashboard'], (old) => {
        if (!old) return old
        const updated = { ...old.user_votes }
        if (newValue === 0) {
          delete updated[contentItemId]
        } else {
          updated[contentItemId] = newValue
        }
        return { ...old, user_votes: updated }
      })
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['dashboard'], context.prev)
    },
  })

  const handleVote = (value: 1 | -1) => {
    mutate(currentVote === value ? 0 : value)
  }

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Tune your feed">
      <button
        onClick={() => handleVote(1)}
        disabled={isPending}
        title="Show me more like this"
        aria-label="Show me more like this"
        aria-pressed={currentVote === 1}
        className={`flex items-center justify-center rounded-md w-7 h-7 transition-colors ${
          currentVote === 1
            ? 'text-up bg-up/15 ring-1 ring-up/40'
            : 'text-mute hover:text-up hover:bg-surface2'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
          <path d="M7 10v11h10.6a2 2 0 0 0 2-1.6l1.4-7a2 2 0 0 0-2-2.4H14V6.5A2.5 2.5 0 0 0 11.5 4l-.5 0L7 10Z"/>
          <path d="M3 10h4v11H3z"/>
        </svg>
      </button>
      <button
        onClick={() => handleVote(-1)}
        disabled={isPending}
        title="Show me less like this"
        aria-label="Show me less like this"
        aria-pressed={currentVote === -1}
        className={`flex items-center justify-center rounded-md w-7 h-7 transition-colors ${
          currentVote === -1
            ? 'text-down bg-down/15 ring-1 ring-down/40'
            : 'text-mute hover:text-down hover:bg-surface2'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px]">
          <path d="M17 14V3H6.4a2 2 0 0 0-2 1.6l-1.4 7a2 2 0 0 0 2 2.4H10v3.5A2.5 2.5 0 0 0 12.5 20l.5 0L17 14Z"/>
          <path d="M21 14h-4V3h4z"/>
        </svg>
      </button>
    </div>
  )
}
