import { Navigate } from 'react-router-dom'
import { useCurrentUser } from '@/features/auth/hooks'
import { Header } from '@/components/Header'
import { DashboardSkeleton } from './DashboardSkeleton'
import { NewsSection } from './sections/NewsSection'
import { PricesSection } from './sections/PricesSection'
import { InsightSection } from './sections/InsightSection'
import { MemeSection } from './sections/MemeSection'

export function DashboardPage() {
  const { data: user, isLoading, isError } = useCurrentUser()

  if (isLoading) return <DashboardSkeleton />
  if (isError || !user) return <Navigate to="/login" replace />
  if (!user.onboarding_completed) return <Navigate to="/onboarding" replace />

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="grid grid-cols-2 gap-6 p-8 max-w-screen-xl mx-auto">
        <NewsSection />
        <PricesSection />
        <InsightSection />
        <MemeSection />
      </main>
    </div>
  )
}
