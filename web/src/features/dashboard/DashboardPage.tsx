import { useCallback, useEffect, useRef, useState, type PointerEventHandler } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/hooks'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { Header } from '@/components/Header'
import { DashboardSkeleton } from './DashboardSkeleton'
import { NewsSection } from './sections/NewsSection'
import { PricesSection } from './sections/PricesSection'
import { InsightSection } from './sections/InsightSection'
import { MemeSection } from './sections/MemeSection'

export type DragHeaderProps = {
  onPointerDown?: PointerEventHandler<HTMLDivElement>
}

type SectionId = 'news' | 'prices' | 'insight' | 'meme'
type Column = 'left' | 'right'

interface DragState {
  id: SectionId
  fromCol: Column
  fromIdx: number
  ghostW: number
  ghostH: number
  x: number
  y: number
  offsetX: number
  offsetY: number
  hoverCol: Column
  hoverIdx: number
}

const LONG_PRESS_MS = 320

function greeting(name: string): string {
  const h = new Date().getHours()
  const timeOfDay = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return `Good ${timeOfDay}, ${name.split(' ')[0]}.`
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const CONTENT_TYPE_TO_SECTION: Record<string, SectionId> = {
  'Market News': 'news',
  'Charts': 'prices',
  'Social': 'insight',
  'Fun': 'meme',
}

const DEFAULT_LAYOUT = { left: ['news', 'insight'] as SectionId[], right: ['prices', 'meme'] as SectionId[] }

export function DashboardPage() {
  const { data: user, isLoading, isError } = useCurrentUser()
  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: api.getPreferences,
    enabled: !!user,
  })

  const allowedSections = new Set<SectionId>(
    preferences
      ? preferences.content_types.map((ct) => CONTENT_TYPE_TO_SECTION[ct]).filter(Boolean)
      : (['news', 'prices', 'insight', 'meme'] as SectionId[])
  )

  const [layout, setLayout] = useState<{ left: SectionId[]; right: SectionId[] }>(DEFAULT_LAYOUT)
  const layoutInitializedRef = useRef(false)
  const [drag, setDrag] = useState<DragState | null>(null)
  const leftParent  = useRef<HTMLDivElement | null>(null)
  const rightParent = useRef<HTMLDivElement | null>(null)
  const [leftAnimate]  = useAutoAnimate<HTMLDivElement>()
  const [rightAnimate] = useAutoAnimate<HTMLDivElement>()
  const leftRef  = useCallback((el: HTMLDivElement | null) => { leftAnimate(el); leftParent.current = el }, [leftAnimate])
  const rightRef = useCallback((el: HTMLDivElement | null) => { rightAnimate(el); rightParent.current = el }, [rightAnimate])

  const patchLayout = useMutation({
    mutationFn: api.patchLayout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  })

  useEffect(() => {
    if (!preferences) return

    const currentAllowed = new Set<SectionId>(
      preferences.content_types
        .map((ct) => CONTENT_TYPE_TO_SECTION[ct])
        .filter(Boolean) as SectionId[]
    )

    const isFirstInit = !layoutInitializedRef.current

    setLayout((prev) => {
      let baseLeft: SectionId[]
      let baseRight: SectionId[]

      if (isFirstInit) {
        const saved = preferences.dashboard_layout
        baseLeft  = ((saved?.left  ?? DEFAULT_LAYOUT.left)  as SectionId[]).filter((id) => currentAllowed.has(id))
        baseRight = ((saved?.right ?? DEFAULT_LAYOUT.right) as SectionId[]).filter((id) => currentAllowed.has(id))
      } else {
        baseLeft  = prev.left.filter((id) => currentAllowed.has(id))
        baseRight = prev.right.filter((id) => currentAllowed.has(id))
      }

      const placed = new Set([...baseLeft, ...baseRight])
      const missing = [...currentAllowed].filter((id) => !placed.has(id))
      const newLeft  = [...baseLeft]
      const newRight = [...baseRight]
      missing.forEach((id) => {
        if (newLeft.length <= newRight.length) newLeft.push(id)
        else newRight.push(id)
      })

      return { left: newLeft, right: newRight }
    })

    layoutInitializedRef.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences])

  const cardRefs = useRef<Partial<Record<SectionId, HTMLDivElement | null>>>({})

  const beginDrag = (id: SectionId, e: PointerEvent) => {
    const card = cardRefs.current[id]
    if (!card) return
    const rect = card.getBoundingClientRect()
    const fromCol: Column = layout.left.includes(id) ? 'left' : 'right'
    const fromIdx = layout[fromCol].indexOf(id)
    document.body.style.userSelect = 'none'
    setDrag({
      id, fromCol, fromIdx,
      ghostW: rect.width, ghostH: rect.height,
      x: rect.left, y: rect.top,
      offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top,
      hoverCol: fromCol, hoverIdx: fromIdx,
    })
    if (navigator.vibrate) navigator.vibrate(10)
  }

  useEffect(() => {
    if (!drag) return
    const onMove = (e: PointerEvent) => {
      const x = e.clientX - drag.offsetX
      const y = e.clientY - drag.offsetY
      const cx = e.clientX, cy = e.clientY
      let hoverCol: Column = drag.hoverCol
      const lc = leftParent.current?.getBoundingClientRect()
      const rc = rightParent.current?.getBoundingClientRect()
      if (lc && rc) {
        const lDist = Math.abs(cx - (lc.left + lc.width / 2))
        const rDist = Math.abs(cx - (rc.left + rc.width / 2))
        hoverCol = lDist <= rDist ? 'left' : 'right'
      }
      const visible = layout[hoverCol].filter((cid) => cid !== drag.id)
      const rects = visible.map((cid) => cardRefs.current[cid]?.getBoundingClientRect()).filter(Boolean) as DOMRect[]
      let hoverIdx = rects.findIndex((r) => cy < r.top + r.height / 2)
      if (hoverIdx === -1) hoverIdx = rects.length
      setDrag((d) => d ? { ...d, x, y, hoverCol, hoverIdx } : d)
    }
    const onUp = () => {
      if (!drag) { document.body.style.userSelect = ''; return }
      const { id, fromCol, fromIdx, hoverCol, hoverIdx } = drag
      const next = { left: [...layout.left], right: [...layout.right] }
      next[fromCol].splice(fromIdx, 1)
      const target = Math.max(0, Math.min(hoverIdx, next[hoverCol].length))
      next[hoverCol].splice(target, 0, id)
      setLayout(next)
      patchLayout.mutate(next)
      setDrag(null)
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [drag, layout])

  const makeDragProps = (id: SectionId): DragHeaderProps => ({
    onPointerDown: (e) => {
      if (e.button !== 0) return
      const start = { x: e.clientX, y: e.clientY }
      const nativeE = e.nativeEvent as PointerEvent
      const timer = setTimeout(() => { beginDrag(id, nativeE); cleanup() }, LONG_PRESS_MS)
      const moveCheck = (ev: PointerEvent) => {
        if (Math.abs(ev.clientX - start.x) + Math.abs(ev.clientY - start.y) > 8) cleanup()
      }
      const cleanup = () => {
        clearTimeout(timer)
        window.removeEventListener('pointermove', moveCheck)
        window.removeEventListener('pointerup', cleanup)
        window.removeEventListener('pointercancel', cleanup)
      }
      window.addEventListener('pointermove', moveCheck)
      window.addEventListener('pointerup', cleanup)
      window.addEventListener('pointercancel', cleanup)
    },
  })

  const renderCard = (id: SectionId, dragProps: DragHeaderProps) => {
    if (!allowedSections.has(id)) return null
    if (id === 'news')    return <NewsSection    dragProps={dragProps} />
    if (id === 'prices')  return <PricesSection  dragProps={dragProps} />
    if (id === 'insight') return <InsightSection dragProps={dragProps} />
    if (id === 'meme')    return <MemeSection    dragProps={dragProps} />
    return null
  }

  const DropSlot = () => (
    <div className="h-2 -my-1 relative" aria-hidden="true">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-teal shadow-[0_0_0_3px_rgba(134,187,189,0.18)]" />
    </div>
  )

  if (isLoading) return <DashboardSkeleton />
  if (isError || !user) return <Navigate to="/login" replace />
  if (!user.onboarding_completed) return <Navigate to="/onboarding" replace />

  return (
    <div className="min-h-screen bg-bg text-ink">
      <Header user={user} />
      <main className="max-w-[1280px] mx-auto px-8 pt-7 pb-16" data-screen-label="Dashboard">
        {/* greeting */}
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.14em] text-slate2Lift font-semibold mb-1">
              {todayLabel()}
            </p>
            <h1 className="text-[28px] font-extrabold tracking-tight text-ink leading-tight">
              {greeting(user.name)}
            </h1>
            <p className="text-[13.5px] text-subt mt-1">
              Your personalized crypto brief for today.
            </p>
          </div>
          {drag && (
            <p className="text-[11px] text-mute font-mono">Drop to rearrange · release anywhere</p>
          )}
        </div>

        {/* 2-column layout */}
        {(() => {
          const leftVisible  = layout.left.filter((id) => allowedSections.has(id))
          const rightVisible = layout.right.filter((id) => allowedSections.has(id))
          const singleCol    = leftVisible.length === 0 || rightVisible.length === 0
          return (
        <div className={singleCol ? 'flex flex-col gap-6 max-w-[640px] mx-auto' : 'grid grid-cols-2 gap-6 items-start'}>
          {(['left', 'right'] as Column[]).map((col) => {
            const visible = layout[col].filter((id) => !drag || drag.id !== id)
            return (
              <div
                key={col}
                ref={col === 'left' ? leftRef : rightRef}
                className="flex flex-col gap-6 min-h-[120px]"
              >
                {visible.map((id, vi) => (
                  <div key={id}>
                    {drag && drag.hoverCol === col && drag.hoverIdx === vi && <DropSlot />}
                    <div ref={(el) => { cardRefs.current[id] = el }}>
                      {renderCard(id as SectionId, makeDragProps(id as SectionId))}
                    </div>
                  </div>
                ))}
                {drag && drag.hoverCol === col && drag.hoverIdx === visible.length && <DropSlot />}
              </div>
            )
          })}
        </div>
          )
        })()}

        <footer className="pt-8 flex items-center justify-between text-[11.5px] text-mute">
          <span>© {new Date().getFullYear()} Cryptide · Personalized crypto for the rest of us</span>
          <span className="font-mono">v1.0</span>
        </footer>
      </main>

      {/* floating ghost card while dragging */}
      {drag && (
        <div
          className="fixed pointer-events-none z-50"
          style={{ left: drag.x, top: drag.y, width: drag.ghostW, transform: 'rotate(-0.4deg)', opacity: 0.94 }}
        >
          <div className="shadow-pop rounded-2xl ring-1 ring-teal/50">
            {renderCard(drag.id, {})}
          </div>
        </div>
      )}
    </div>
  )
}
