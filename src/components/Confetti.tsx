import { useMemo, type CSSProperties } from 'react'

const COLORS = ['bg-pink-500', 'bg-amber-400', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-rose-500']

export function Confetti({ count = 80 }: { readonly count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 200,
        spin: 360 + Math.random() * 1080,
        size: 6 + Math.random() * 6,
        color: COLORS[i % COLORS.length] ?? 'bg-pink-500',
        round: Math.random() > 0.6,
      })),
    [count],
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`absolute top-0 animate-confetti ${p.color} ${p.round ? 'rounded-full' : 'rounded-sm'}`}
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * (p.round ? 1 : 0.5),
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
