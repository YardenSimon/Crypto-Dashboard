import { useQuery, useMutation } from '@tanstack/react-query'
import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import type { PriceItem } from '@/lib/types'
import { CoinMark } from '@/components/CoinMark'
import type { DragHeaderProps } from './NewsSection'

/* ---- pseudo-random sparkline generator ---- */
function seriesFor(sym: string, nPoints: number, current: number): number[] {
  let seed = 0
  for (const ch of sym) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const drift = 0.06
  const arr = new Array(nPoints)
  let v = 1
  for (let i = 0; i < nPoints; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const r = ((seed >>> 8) & 0xffff) / 65535 - 0.5
    v += (r * drift) / 8 + (drift * (i / nPoints - 0.5)) / 30
    arr[i] = v
  }
  const min = Math.min(...arr), max = Math.max(...arr)
  const startMul = 1 - drift * (((seed >>> 12) & 0xff) / 255 - 0.4)
  const startPrice = current * startMul
  const out = arr.map((x, i) => {
    const t = i / (nPoints - 1)
    const norm = (x - min) / (max - min || 1)
    return (startPrice + (current - startPrice) * t) * (0.96 + norm * 0.08)
  })
  out[out.length - 1] = current
  return out
}

function seriesForRange(sym: string, range: string, current: number): number[] {
  const RANGE_POINTS: Record<string, number> = {
    '24H': 96, '7D': 84, '30D': 90, '90D': 90, '1Y': 96, All: 100,
  }
  return seriesFor(sym, RANGE_POINTS[range] ?? 84, current)
}

/* ---- sparkline SVG ---- */
function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  const w = 92, h = 28
  const min = Math.min(...points), max = Math.max(...points)
  const range = max - min || 1
  const stepX = w / (points.length - 1)
  const pts = points.map((p, i) => [i * stepX, h - ((p - min) / range) * (h - 2) - 1])
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = `${d} L ${w} ${h} L 0 ${h} Z`
  const stroke = up ? '#7DC9A8' : '#E08A82'
  const fill = up ? 'rgba(125,201,168,0.18)' : 'rgba(224,138,130,0.18)'
  const gradId = useMemo(() => 'spark-' + Math.random().toString(36).slice(2, 8), [])
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="1" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---- big chart SVG for modal ---- */
function BigAreaChart({ points, up }: { points: number[]; up: boolean }) {
  const w = 760, h = 260
  const min = Math.min(...points), max = Math.max(...points)
  const range = max - min || 1
  const stepX = w / (points.length - 1)
  const pts = points.map((p, i) => [i * stepX, h - ((p - min) / range) * (h - 30) - 15])
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = `${d} L ${w} ${h} L 0 ${h} Z`
  const stroke = up ? '#7DC9A8' : '#E08A82'
  const fillTop = up ? 'rgba(125,201,168,0.35)' : 'rgba(224,138,130,0.35)'
  const gradId = useMemo(() => 'big-' + Math.random().toString(36).slice(2, 8), [])
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[260px]">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fillTop} />
          <stop offset="100%" stopColor={fillTop} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.2, 0.4, 0.6, 0.8].map((g, i) => (
        <line key={i} x1="0" x2={w} y1={h * g} y2={h * g} stroke="#3B2C36" strokeDasharray="2 6" />
      ))}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="9" fill={stroke} opacity="0.18" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={stroke} />
    </svg>
  )
}

/* ---- coin chart modal ---- */
function fmtPrice(n: number) {
  return n >= 1
    ? '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
    : '$' + n.toFixed(4)
}

function fmtMcap(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}

function CoinChartModal({ coin, onClose }: { coin: PriceItem; onClose: () => void }) {
  const RANGES = ['24H', '7D', '30D', '90D', '1Y', 'All']
  const [range, setRange] = useState('7D')
  const [closing, setClosing] = useState(false)
  const points = useMemo(
    () => seriesForRange(coin.symbol, range, coin.price_usd),
    [coin.symbol, range, coin.price_usd],
  )
  const first = points[0], last = points[points.length - 1]
  const change = ((last - first) / first) * 100
  const up = change >= 0
  const high = Math.max(...points), low = Math.min(...points)

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 150)
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [handleClose])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 fade-in${closing ? ' opacity-0 transition-opacity duration-150' : ''}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={handleClose} />
      <div className={`relative w-full max-w-[860px] rounded-2xl border border-line2 bg-surface shadow-pop overflow-hidden${closing ? ' scale-95 opacity-0 transition-all duration-150' : ' pop-in'}`}>
        {/* header */}
        <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-5 border-b border-line">
          <div className="flex items-center gap-4">
            <CoinMark sym={coin.symbol} size={48} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[20px] text-ink leading-none">{coin.name}</h3>
                <span className="text-mute font-mono text-[12px] uppercase tracking-wider">{coin.symbol}</span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-3">
                <span className="font-extrabold text-[26px] text-ink tabular tracking-tight">{fmtPrice(coin.price_usd)}</span>
                <span className={`inline-flex items-center gap-0.5 text-[13px] font-semibold ${up ? 'text-up' : 'text-down'}`}>
                  {up
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M7 17 17 7M9 7h8v8"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M7 7l10 10M15 17H7V9"/></svg>
                  }
                  {up ? '+' : ''}{change.toFixed(2)}%
                  <span className="text-mute font-medium ml-1">· {range}</span>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="text-mute hover:text-ink p-1.5 rounded-md hover:bg-surface2 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* range tabs */}
        <div className="px-7 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-md border border-line p-0.5 bg-bg2">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 h-7 rounded text-[11.5px] font-semibold transition-colors ${
                  range === r ? 'bg-surface2 text-ink shadow-sm ring-1 ring-line2' : 'text-subt hover:text-ink'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11.5px] text-mute">
            <span>Mkt cap <span className="text-subt font-semibold ml-1">{fmtMcap(coin.market_cap_usd)}</span></span>
          </div>
        </div>

        {/* chart */}
        <div className="px-3 pb-2">
          <BigAreaChart points={points} up={up} />
        </div>

        {/* stats */}
        <div className="grid grid-cols-4 border-t border-line">
          {([['Range high', fmtPrice(high)], ['Range low', fmtPrice(low)], ['Open', fmtPrice(first)], ['Last', fmtPrice(last)]] as const).map(([k, v], i) => (
            <div key={k} className={`px-5 py-4 ${i ? 'border-l border-line' : ''}`}>
              <p className="text-[10.5px] uppercase tracking-[0.1em] text-mute font-semibold">{k}</p>
              <p className="text-ink font-semibold tabular text-[14px] mt-1">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---- row drag constants ---- */
const ROW_H = 60
const LONG_PRESS_MS = 320

/* ---- main section ---- */
interface PricesSectionProps {
  dragProps?: DragHeaderProps
}

export function PricesSkeleton() {
  return (
    <div className="space-y-1 px-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-3 px-2 py-3">
          <div className="w-7 h-7 rounded-full bg-surface3 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-surface3 rounded w-1/3" />
            <div className="h-3 bg-surface3 rounded w-1/4" />
          </div>
          <div className="h-4 bg-surface3 rounded w-20" />
          <div className="h-4 bg-surface3 rounded w-12" />
        </div>
      ))}
    </div>
  )
}

export function PricesSection({ dragProps = {} }: PricesSectionProps) {
  const { data: prices, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    refetchInterval: 60_000,
    select: (d) => d.prices,
  })

  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: api.getPreferences,
  })

  const patchCoinOrder = useMutation({
    mutationFn: api.patchCoinOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  })

  const [order, setOrder] = useState<string[]>([])
  const [orderInitialized, setOrderInitialized] = useState(false)
  const [activeCoin, setActiveCoin] = useState<PriceItem | null>(null)

  useEffect(() => {
    if (!prices || orderInitialized) return
    if (preferences?.coin_order?.length) {
      setOrder(preferences.coin_order)
    } else {
      setOrder(prices.map((p) => p.symbol))
    }
    setOrderInitialized(true)
  }, [prices, preferences, orderInitialized])

  const items = useMemo(() => {
    if (!prices) return []
    const priceMap = Object.fromEntries(prices.map((p) => [p.symbol, p]))
    const ordered = order.filter((sym) => sym in priceMap).map((sym) => priceMap[sym])
    const extra = prices.filter((p) => !order.includes(p.symbol))
    return [...ordered, ...extra]
  }, [prices, order])

  /* row drag state */
  const [dragSym, setDragSym] = useState<string | null>(null)
  const [pressSym, setPressSym] = useState<string | null>(null)
  const [dy, setDy] = useState(0)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const dragMeta = useRef({ startY: 0, startIdx: 0, pointerId: null as number | null, longPressTimer: null as ReturnType<typeof setTimeout> | null, didMove: false })
  const listRef = useRef<HTMLUListElement>(null)

  const cancelLongPress = useCallback(() => {
    if (dragMeta.current.longPressTimer) {
      clearTimeout(dragMeta.current.longPressTimer)
      dragMeta.current.longPressTimer = null
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent, sym: string, idx: number) => {
    if (e.button !== 0) return
    dragMeta.current.startY = e.clientY
    dragMeta.current.startIdx = idx
    dragMeta.current.pointerId = e.pointerId
    dragMeta.current.didMove = false
    setPressSym(sym)
    cancelLongPress()
    dragMeta.current.longPressTimer = setTimeout(() => {
      setDragSym(sym)
      setHoverIdx(idx)
      setDy(0)
      setPressSym(null)
      try { (e.target as Element).setPointerCapture?.(e.pointerId) } catch (_) {}
      if (navigator.vibrate) navigator.vibrate(8)
    }, LONG_PRESS_MS)
  }, [cancelLongPress])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (pressSym && !dragSym) {
      if (Math.abs(e.clientY - dragMeta.current.startY) > 6) {
        cancelLongPress()
        setPressSym(null)
      }
      return
    }
    if (!dragSym) return
    e.preventDefault()
    const offset = e.clientY - dragMeta.current.startY
    setDy(offset)
    const raw = dragMeta.current.startIdx + Math.round(offset / ROW_H)
    setHoverIdx(Math.max(0, Math.min(items.length - 1, raw)))
  }, [pressSym, dragSym, items.length, cancelLongPress])

  const finishDrag = useCallback(() => {
    if (!dragSym) return
    const startIdx = dragMeta.current.startIdx
    const target = hoverIdx ?? startIdx
    if (target !== startIdx) {
      setOrder((prev) => {
        const next = [...prev]
        const [moved] = next.splice(startIdx, 1)
        next.splice(target, 0, moved)
        patchCoinOrder.mutate(next)
        return next
      })
    }
    setDragSym(null)
    setHoverIdx(null)
    setDy(0)
  }, [dragSym, hoverIdx, patchCoinOrder])

  const onPointerUp = useCallback((e: React.PointerEvent, sym: string) => {
    cancelLongPress()
    if (dragSym) { finishDrag(); return }
    if (pressSym === sym) {
      const item = items.find((p) => p.symbol === sym)
      if (item) setActiveCoin(item)
    }
    setPressSym(null)
  }, [cancelLongPress, dragSym, finishDrag, pressSym, items])

  const onPointerCancel = useCallback(() => {
    cancelLongPress()
    setPressSym(null)
    if (dragSym) finishDrag()
  }, [cancelLongPress, dragSym, finishDrag])

  const draggedIdxOriginal = dragSym ? items.findIndex((p) => p.symbol === dragSym) : -1

  return (
    <>
      <section className="rounded-2xl border border-line bg-surface shadow-card">
        <div
          {...dragProps}
          className={`flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line touch-none select-none ${dragProps?.onPointerDown ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          <div className="min-w-0 flex items-start gap-3">
            {dragProps?.onPointerDown && <DragHandle />}
            <h2 className="font-semibold text-[15px] text-ink leading-tight">Coin Prices</h2>
          </div>
        </div>
        <div className="px-4 pt-3 pb-1">
          {isLoading ? (
            <PricesSkeleton />
          ) : !items.length ? (
            <p className="text-sm text-mute py-4">No price data available.</p>
          ) : (
            <>
              <div className="grid grid-cols-[28px_1.7fr_1fr_1fr_92px] items-center gap-3 px-1 pb-2 text-[10.5px] uppercase tracking-[0.1em] text-slate2Lift font-semibold border-b border-line">
                <span>#</span>
                <span>Coin</span>
                <span className="text-right">Price</span>
                <span className="text-right">24h</span>
                <span className="text-right pr-2">7d trend</span>
              </div>
              <ul
                ref={listRef}
                className="relative select-none"
                style={{ height: items.length * ROW_H + 'px', touchAction: dragSym ? 'none' : 'pan-y' }}
              >
                {items.map((p, i) => {
                  const isDragging = dragSym === p.symbol
                  const isPressed = pressSym === p.symbol
                  let translateY = 0
                  if (dragSym && !isDragging) {
                    const from = draggedIdxOriginal
                    const to = hoverIdx ?? from
                    if (from < to && i > from && i <= to) translateY = -ROW_H
                    else if (from > to && i >= to && i < from) translateY = ROW_H
                  }
                  const finalTop = isDragging ? i * ROW_H + dy : i * ROW_H + translateY
                  return (
                    <PriceRow
                      key={p.symbol}
                      item={p}
                      rank={i + 1}
                      isDragging={isDragging}
                      isPressed={isPressed}
                      finalTop={finalTop}
                      onPointerDown={(e) => onPointerDown(e, p.symbol, i)}
                      onPointerMove={onPointerMove}
                      onPointerUp={(e) => onPointerUp(e, p.symbol)}
                      onPointerCancel={onPointerCancel}
                    />
                  )
                })}
              </ul>
              <p className="mt-3 pb-2 text-[11px] text-mute text-center">Tap a coin for charts · long-press to drag &amp; reorder</p>
            </>
          )}
        </div>
      </section>
      {activeCoin && <CoinChartModal coin={activeCoin} onClose={() => setActiveCoin(null)} />}
    </>
  )
}

interface PriceRowProps {
  item: PriceItem
  rank: number
  isDragging: boolean
  isPressed: boolean
  finalTop: number
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onPointerCancel: () => void
}

function PriceRow({ item: p, rank, isDragging, isPressed, finalTop, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }: PriceRowProps) {
  const up = p.change_24h >= 0
  const spark = useMemo(() => seriesFor(p.symbol, 20, p.price_usd), [p.symbol, p.price_usd])
  return (
    <li
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={`absolute left-0 right-0 grid grid-cols-[28px_1.7fr_1fr_1fr_92px] items-center gap-3 px-2 rounded-md cursor-grab active:cursor-grabbing
        ${isDragging ? 'z-20 bg-surface2 ring-1 ring-teal/50 shadow-pop scale-[1.01]' : 'hover:bg-surface2/60'}
        ${isPressed && !isDragging ? 'bg-surface2/80 scale-[0.99]' : ''}`}
      style={{
        top: 0,
        height: ROW_H + 'px',
        transform: `translate3d(0, ${finalTop}px, 0)`,
        transition: isDragging
          ? 'box-shadow 160ms ease, background-color 160ms ease, transform 60ms linear'
          : 'transform 220ms cubic-bezier(.2,.7,.3,1), background-color 160ms ease',
        willChange: 'transform',
      }}
    >
      <span className="text-[11.5px] font-mono text-mute pointer-events-none">{rank}</span>
      <span className="flex items-center gap-2.5 min-w-0 pointer-events-none">
        <CoinMark sym={p.symbol} size={30} />
        <span className="min-w-0">
          <span className="block text-[13.5px] font-semibold text-ink leading-tight truncate">{p.name}</span>
          <span className="block text-[11px] font-mono text-mute uppercase">{p.symbol}</span>
        </span>
      </span>
      <span className="text-right text-[13.5px] font-semibold text-ink tabular pointer-events-none">{fmtPrice(p.price_usd)}</span>
      <span className={`text-right text-[12.5px] font-semibold tabular pointer-events-none ${up ? 'text-up' : 'text-down'}`}>
        <span className="inline-flex items-center gap-0.5 justify-end">
          {up
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M7 17 17 7M9 7h8v8"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M7 7l10 10M15 17H7V9"/></svg>
          }
          {up ? '+' : ''}{p.change_24h.toFixed(2)}%
        </span>
      </span>
      <span className="flex justify-end pr-1 pointer-events-none">
        <Sparkline points={spark} up={up} />
      </span>
    </li>
  )
}

function DragHandle() {
  return (
    <span className="text-mute opacity-50 hover:opacity-100 mt-[3px]" aria-hidden="true" title="Long-press to drag">
      <svg viewBox="0 0 16 16" width="12" height="12">
        <circle cx="5" cy="4" r="1" fill="currentColor" />
        <circle cx="5" cy="8" r="1" fill="currentColor" />
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="11" cy="4" r="1" fill="currentColor" />
        <circle cx="11" cy="8" r="1" fill="currentColor" />
        <circle cx="11" cy="12" r="1" fill="currentColor" />
      </svg>
    </span>
  )
}
