import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

  const initials = user.name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')

  return (
    <header className="border-b border-line bg-bg/85 backdrop-blur sticky top-0 z-30">
      <div className="max-w-[1280px] mx-auto px-8 h-[60px] flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <a className="flex items-center gap-2" href="#">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-teal text-bg">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M3 13c3-4 6-4 9 0s6 4 9 0"/>
                <path d="M3 18c3-4 6-4 9 0s6 4 9 0" opacity="0.55"/>
              </svg>
            </span>
            <span className="font-extrabold tracking-tight text-[17px] text-ink">Cryptide</span>
          </a>
          <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium">
            <Link to="/dashboard" className="px-3 py-1.5 rounded-md text-ink bg-surface2 transition-colors">Dashboard</Link>
          </nav>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 h-9 pl-1 pr-2.5 rounded-md hover:bg-surface2 transition-colors"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-mauveLift text-bg text-[12px] font-semibold">
              {initials}
            </span>
            <span className="text-[13px] text-ink font-medium">{user.name.split(' ')[0]}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-mute">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-44 rounded-md border border-line2 bg-surface2 shadow-pop py-1 text-sm z-40"
            >
              <Link
                to="/preferences"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-3 py-1.5 text-ink hover:bg-surface3 transition-colors"
              >
                Preferences
              </Link>
              <div className="my-1 h-px bg-line" />
              <button
                role="menuitem"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="w-full text-left px-3 py-1.5 text-ink hover:bg-surface3 transition-colors disabled:opacity-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
