import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import type { User } from '@/lib/types'

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSettled: () => {
      queryClient.clear()
      navigate('/login', { replace: true })
    },
  })

  return (
    <header className="border-b px-8 py-4 flex items-center justify-between">
      <span className="font-bold text-lg">Cryptide</span>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {user.name}
          <ChevronDown className="h-4 w-4" />
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-1 w-40 rounded-md border bg-popover shadow-md z-50"
          >
            <Link
              to="/preferences"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              Preferences
            </Link>
            <button
              role="menuitem"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
