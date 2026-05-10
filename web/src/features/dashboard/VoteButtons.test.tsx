import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi, beforeEach, afterEach } from 'vitest'
import { queryClient } from '@/lib/queryClient'
import { VoteButtons } from './VoteButtons'
import type { DashboardResponse } from '@/lib/types'

vi.mock('@/lib/api', () => ({
  api: {
    getDashboard: vi.fn(),
    postVote: vi.fn(
      () => new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Vote failed')), 50))
    ),
  },
}))

const SEED: DashboardResponse = {
  news: [],
  prices: [],
  insights: [],
  meme: null,
  cache_ages: {},
  user_votes: {},
}

function renderComponent() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <VoteButtons contentItemId="abc" />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('VoteButtons optimistic update and rollback', () => {
  beforeEach(() => {
    queryClient.setQueryData(['dashboard'], SEED)
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  it('applies optimistic vote then rolls back on error', async () => {
    renderComponent()
    const upvoteBtn = screen.getByRole('button', { name: /show me more like this/i })

    expect(upvoteBtn).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(upvoteBtn)

    await waitFor(() => expect(upvoteBtn).toHaveAttribute('aria-pressed', 'true'))

    await waitFor(() => expect(upvoteBtn).toHaveAttribute('aria-pressed', 'false'))
  })
})
