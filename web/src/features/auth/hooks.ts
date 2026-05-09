import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: api.getMe,
    retry: false,
    staleTime: 5 * 60_000,
  })
}
