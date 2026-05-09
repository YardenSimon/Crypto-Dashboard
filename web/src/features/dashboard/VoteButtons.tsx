import { ThumbsUp, ThumbsDown } from 'lucide-react'
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
      if (context?.prev) {
        queryClient.setQueryData(['dashboard'], context.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const handleVote = (value: 1 | -1) => {
    mutate(currentVote === value ? 0 : value)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={isPending}
        aria-label="Upvote"
        className={`rounded p-1 transition-colors ${
          currentVote === 1
            ? 'text-green-600'
            : 'text-muted-foreground hover:text-green-600'
        }`}
      >
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleVote(-1)}
        disabled={isPending}
        aria-label="Downvote"
        className={`rounded p-1 transition-colors ${
          currentVote === -1
            ? 'text-red-500'
            : 'text-muted-foreground hover:text-red-500'
        }`}
      >
        <ThumbsDown className="h-4 w-4" />
      </button>
    </div>
  )
}
