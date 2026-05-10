import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { VoteButtons } from '../VoteButtons'
import type { DragHeaderProps } from './NewsSection'

interface MemeSectionProps {
  dragProps?: DragHeaderProps
}

export function MemeSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="rounded-xl aspect-[16/9] bg-surface3 w-full" />
    </div>
  )
}

export function MemeSection({ dragProps = {} }: MemeSectionProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
    select: (d) => ({ meme: d.meme, cacheAge: d.cache_ages.meme }),
  })
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)

  const closeOverlay = () => {
    setClosing(true)
    setTimeout(() => { setOpen(false); setClosing(false) }, 150)
  }

  return (
    <section className="rounded-2xl border border-line bg-surface shadow-card">
      <div
        {...dragProps}
        className={`flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line touch-none select-none ${dragProps?.onPointerDown ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="min-w-0 flex items-start gap-3">
          {dragProps?.onPointerDown && <DragHandle />}
          <h2 className="font-semibold text-[15px] text-ink leading-tight">Meme of the day</h2>
        </div>
        {data?.meme && <VoteButtons contentItemId={data.meme.content_item_id} />}
      </div>

      <div className="px-6 py-5">
        {isLoading ? (
          <MemeSkeleton />
        ) : !data?.meme ? (
          <div className="relative rounded-xl overflow-hidden border border-line2 aspect-[16/9] stripes bg-bg2">
            <div className="absolute inset-0 dotgrid opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-mute">No meme available today.</p>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-line2 w-full bg-bg2">
            <img
              src={data.meme.image_url}
              alt="Crypto meme of the day"
              className="w-full h-auto max-h-[500px] object-contain mx-auto cursor-zoom-in"
              onClick={() => setOpen(true)}
            />
          </div>
        )}
        {data?.cacheAge && (
          <p className="mt-2 text-[11px] text-mute text-right">Updated {data.cacheAge}</p>
        )}
      </div>

      {open && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/75 fade-in${closing ? ' opacity-0 transition-opacity duration-150' : ''}`}
          onClick={closeOverlay}
        >
          <div
            className={`relative max-w-[90vw] max-h-[90vh]${closing ? ' scale-95 opacity-0 transition-all duration-150' : ' pop-in'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeOverlay}
              className="absolute -top-3 -right-3 z-10 rounded-full bg-surface2 border border-line2 w-8 h-8 flex items-center justify-center text-subt hover:text-ink transition-colors"
            >✕</button>
            <img src={data?.meme?.image_url} alt="Crypto meme of the day" className="rounded-xl max-w-full max-h-[90vh] object-contain" />
          </div>
        </div>
      )}
    </section>
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
