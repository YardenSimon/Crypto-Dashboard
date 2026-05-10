const COIN_STYLES: Record<string, { bg: string; fg: string; glyph: string }> = {
  BTC:  { bg: '#7C5469', fg: '#F0E6E1', glyph: '₿' },
  ETH:  { bg: '#9685A8', fg: '#161015', glyph: 'Ξ' },
  SOL:  { bg: '#86BBBD', fg: '#161015', glyph: '◎' },
  ADA:  { bg: '#A4BFC8', fg: '#161015', glyph: '₳' },
  DOGE: { bg: '#9D9FB7', fg: '#161015', glyph: 'Ð' },
  LINK: { bg: '#533747', fg: '#86BBBD', glyph: '⛓' },
  XRP:  { bg: '#76949F', fg: '#161015', glyph: '✕' },
  DOT:  { bg: '#9685A8', fg: '#F0E6E1', glyph: '●' },
  AVAX: { bg: '#E08A82', fg: '#161015', glyph: 'A' },
  MATIC:{ bg: '#7C5469', fg: '#F0E6E1', glyph: 'M' },
}

export function CoinMark({ sym, size = 32 }: { sym: string; size?: number }) {
  const c = COIN_STYLES[sym] ?? { bg: '#5F506B', fg: '#F0E6E1', glyph: sym[0] }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-mono shrink-0"
      style={{
        width: size,
        height: size,
        background: c.bg,
        color: c.fg,
        fontSize: size * 0.46,
        lineHeight: 1,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)',
      }}
      aria-hidden="true"
    >
      {c.glyph}
    </span>
  )
}
