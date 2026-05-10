export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-bg">
      {/* skeleton header */}
      <div className="border-b border-line bg-bg/85 h-[60px] flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-surface3 animate-pulse" />
          <div className="h-4 w-20 bg-surface3 rounded animate-pulse" />
        </div>
        <div className="h-7 w-24 bg-surface3 rounded animate-pulse" />
      </div>

      <main className="max-w-[1280px] mx-auto px-8 pt-7 pb-16">
        {/* greeting skeleton */}
        <div className="mb-6 space-y-2">
          <div className="h-3 w-32 bg-surface3 rounded animate-pulse" />
          <div className="h-8 w-64 bg-surface3 rounded animate-pulse" />
          <div className="h-4 w-80 bg-surface3 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-2 gap-6 items-start">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface shadow-card p-6 space-y-4">
              <div className="h-4 w-32 bg-surface3 rounded animate-pulse" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="animate-pulse space-y-1.5">
                    <div className="h-3.5 bg-surface3 rounded w-4/5" />
                    <div className="h-3 bg-surface3 rounded w-1/3" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
