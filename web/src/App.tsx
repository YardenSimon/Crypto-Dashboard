import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { RootRedirect } from '@/routes/RootRedirect'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'

function Placeholder({ name }: { name: string }) {
  return <div className="p-8 text-center text-muted-foreground">{name} — not yet implemented</div>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Placeholder name="Login" />} />
          <Route path="/signup" element={<Placeholder name="Signup" />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<Placeholder name="Dashboard" />} />
          <Route path="/preferences" element={<Placeholder name="Preferences" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
