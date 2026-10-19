import { ProgressBar } from '../components/ui'
import { ACHIEVEMENTS } from '../lib/achievements'
import { useAppState } from '../lib/store'

export function Awards() {
  const unlocked = useAppState((s) => s.achievements)
  const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-black">Achievements</h1>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {count}/{ACHIEVEMENTS.length}
        </span>
      </div>
      <ProgressBar value={count / ACHIEVEMENTS.length} />
      <div className="grid grid-cols-2 gap-3 pt-2">
        {ACHIEVEMENTS.map((a) => {
          const at = unlocked[a.id]
          return (
            <div
              key={a.id}
              className={`rounded-2xl p-3 ring-1 ${
                at
                  ? 'bg-gradient-to-br from-amber-50 to-orange-100 ring-amber-300 dark:from-amber-950 dark:to-orange-950 dark:ring-amber-700'
                  : 'bg-white ring-slate-200 dark:bg-slate-900 dark:ring-slate-800'
              }`}
            >
              <div className={`text-3xl ${at ? '' : 'opacity-30 grayscale'}`}>{a.icon}</div>
              <div className="mt-1 font-extrabold">{a.title}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{a.description}</div>
              {at && <div className="mt-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">✓ {new Date(at).toLocaleDateString()}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
