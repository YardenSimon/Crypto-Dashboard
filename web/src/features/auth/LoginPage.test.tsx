import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import { LoginPage } from './LoginPage'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: {
    login: vi.fn(() => Promise.reject(new Error('Invalid credentials'))),
    getMe: vi.fn(),
  },
}))

describe('LoginPage error display', () => {
  it('shows server error message after failed login', async () => {
    renderWithProviders(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
  })
})
