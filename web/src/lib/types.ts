export interface User {
  id: string
  email: string
  name: string
  onboarding_completed: boolean
}

export interface Preferences {
  coins: string[]
  investor_types: string[]
  content_types: string[]
}
