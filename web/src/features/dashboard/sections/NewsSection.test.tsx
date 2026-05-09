import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { NewsSection } from './NewsSection'

vi.mock('@/lib/api', () => ({
  api: {
    getDashboard: vi.fn(() => new Promise(() => {})),
  },
}))

describe('NewsSection skeleton while loading', () => {
  it('renders skeleton pulse elements when data is loading', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { container } = render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <NewsSection />
        </MemoryRouter>
      </QueryClientProvider>
    )
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })
})
