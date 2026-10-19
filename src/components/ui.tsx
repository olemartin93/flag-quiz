import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { readonly children: ReactNode }) {
  return <h2 className="mt-6 mb-2 px-1 text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">{children}</h2>
}

export function ProgressBar({ value, className = '' }: { readonly value: number; readonly className?: string }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  )
}

export function Stat({ label, value, icon }: { readonly label: string; readonly value: ReactNode; readonly icon?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {icon ? `${icon} ` : ''}
        {label}
      </div>
      <div className="mt-0.5 text-xl font-extrabold tabular-nums">{value}</div>
    </div>
  )
}

export function Modal({ children, onClose }: { readonly children: ReactNode; readonly onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md animate-slide-up rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  readonly checked: boolean
  readonly onChange: (v: boolean) => void
  readonly label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between py-2"
    >
      <span className="font-medium">{label}</span>
      <span className={`relative h-7 w-12 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
        <span
          className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </span>
    </button>
  )
}

export const formatNumber = (n: number) => n.toLocaleString()
