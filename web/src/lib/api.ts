import type { Preferences, User } from './types'

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { detail?: string }).detail ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export const api = {
  getMe: () => apiFetch<User>('/me'),
  getPreferences: () => apiFetch<Preferences>('/me/preferences'),
  putPreferences: (body: Preferences) =>
    apiFetch<Preferences>('/me/preferences', { method: 'PUT', body: JSON.stringify(body) }),
}
