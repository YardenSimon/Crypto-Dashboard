import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { DashboardPage } from './DashboardPage'

vi.mock('@/features/auth/hooks', () => ({
  useCurrentUser: () => ({
    data: { id: '1', email: 'a@b.com', name: 'Alice', onboarding_completed: false },
    isLoading: false,
    isError: false,
  }),
}))

describe('DashboardPage onboarding redirect', () => {
  it('redirects to /onboarding when user has not completed onboarding', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/onboarding" element={<div>Onboarding Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(screen.getByText('Onboarding Page')).toBeInTheDocument()
  })
})
