import { NewsSkeleton } from './sections/NewsSection'
import { PricesSkeleton } from './sections/PricesSection'
import { InsightSkeleton } from './sections/InsightSection'
import { MemeSkeleton } from './sections/MemeSection'

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-8 py-4 flex items-center justify-between">
        <div className="h-5 w-24 bg-muted rounded animate-pulse" />
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
      </div>
      <main className="grid grid-cols-2 gap-6 p-8 max-w-screen-xl mx-auto">
        {[NewsSkeleton, PricesSkeleton, InsightSkeleton, MemeSkeleton].map((Skel, i) => (
          <section key={i} className="rounded-xl border p-6 space-y-4">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <Skel />
          </section>
        ))}
      </main>
    </div>
  )
}
