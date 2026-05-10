import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import { OnboardingPage } from './OnboardingPage'
import { api } from '@/lib/api'

vi.mock('@/features/auth/hooks', () => ({
  useCurrentUser: () => ({
    data: { id: '1', email: 'a@b.com', name: 'Alice', onboarding_completed: false },
    isLoading: false,
    isError: false,
  }),
}))

vi.mock('@/lib/api', () => ({
  api: {
    getMe: vi.fn(),
    putPreferences: vi.fn(() => new Promise(() => {})),
  },
}))

describe('OnboardingPage form validation', () => {
  it('shows validation error when no coins are selected', async () => {
    renderWithProviders(<OnboardingPage />)
    await userEvent.click(screen.getByRole('button', { name: /get my dashboard/i }))
    expect(await screen.findByText('Select at least one coin')).toBeInTheDocument()
  })

  it('disables extra investor type options once 2 are selected', async () => {
    renderWithProviders(<OnboardingPage />)
    const hodlerBtn = screen.getByRole('button', { name: /HODLer/i })
    const traderBtn = screen.getByRole('button', { name: /Day Trader/i })
    const nftBtn = screen.getByRole('button', { name: /NFT Collector/i })

    expect(nftBtn).not.toBeDisabled()

    await userEvent.click(hodlerBtn)
    await userEvent.click(traderBtn)

    expect(nftBtn).toBeDisabled()
  })
})
