import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '@/features/auth/hooks'
import { NewsSection } from './sections/NewsSection'
import { PricesSection } from './sections/PricesSection'
import { InsightSection } from './sections/InsightSection'
import { MemeSection } from './sections/MemeSection'

export function DashboardPage() {
  const { data: user, isLoading, isError } = useCurrentUser()

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading…</span>
    </div>
  )
  if (isError || !user) return <Navigate to="/login" replace />
  if (!user.onboarding_completed) return <Navigate to="/onboarding" replace />

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-8 py-4 flex items-center justify-between">
        <span className="font-bold text-lg">Cryptide</span>
        <span className="text-sm text-muted-foreground">{user.name}</span>
      </header>
      <main className="grid grid-cols-2 gap-6 p-8 max-w-screen-xl mx-auto">
        <NewsSection />
        <PricesSection />
        <InsightSection />
        <MemeSection />
      </main>
    </div>
  )
}
