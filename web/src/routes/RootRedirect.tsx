import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '@/features/auth/hooks'

export function RootRedirect() {
  const { data: user, isLoading, isError } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading…</span>
      </div>
    )
  }
  if (isError || !user) return <Navigate to="/login" replace />
  if (!user.onboarding_completed) return <Navigate to="/onboarding" replace />
  return <Navigate to="/dashboard" replace />
}
