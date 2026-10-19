import { useMemo } from 'react'
import { Card, ProgressBar, SectionTitle, Stat, formatNumber } from '../components/ui'
import { CONTINENTS, COUNTRIES } from '../data/countries'
import { dailyStreak } from '../lib/achievements'
import { addDays, dateKey } from '../lib/dates'
import { MODES, PLAYABLE_MODES } from '../lib/modes'
import { levelInfo } from '../lib/scoring'
import { useAppState } from '../lib/store'

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.round(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const h = Math.round(min / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export function Stats() {
  const s = useAppState((st) => st)
  const today = dateKey()
  const level = levelInfo(s.totalPoints)
  const accuracy = s.totalAnswered === 0 ? 0 : s.totalCorrect / s.totalAnswered
  const known = COUNTRIES.filter((c) => (s.flagStats[c.code]?.correct ?? 0) > 0).length

  const byContinent = useMemo(
    () =>
      CONTINENTS.map((cont) => {
        let seen = 0
        let correct = 0
        let knownHere = 0
        const countries = COUNTRIES.filter((c) => c.continent === cont)
        for (const c of countries) {
          const st = s.flagStats[c.code]
          seen += st?.seen ?? 0
          correct += st?.correct ?? 0
          if ((st?.correct ?? 0) > 0) knownHere++
        }
        return { cont, accuracy: seen ? correct / seen : null, known: knownHere, total: countries.length }
      }),
    [s.flagStats],
  )

  // Last 5 weeks of daily results, oldest first.
  const days = Array.from({ length: 35 }, (_, i) => addDays(today, i - 34))

  return (
    <div className="space-y-3 pt-2">
      <h1 className="text-2xl font-black">Your stats</h1>

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl font-black text-white">
            {level.level}
          </div>
          <div className="flex-1">
            <div className="font-extrabold">{level.title}</div>
            <ProgressBar value={level.progress} className="mt-1" />
            <div className="mt-1 text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {formatNumber(s.totalPoints - level.current)} / {formatNumber(level.next - level.current)} XP
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Stat icon="🪙" label="Total points" value={formatNumber(s.totalPoints)} />
        <Stat icon="🎮" label="Games played" value={formatNumber(s.gamesPlayed)} />
        <Stat icon="🎯" label="Accuracy" value={`${Math.round(accuracy * 100)}%`} />
        <Stat icon="🔥" label="Best streak" value={s.bestStreak} />
        <Stat icon="🚩" label="Flags known" value={`${known}/${COUNTRIES.length}`} />
        <Stat icon="📅" label="Daily streak" value={`${dailyStreak(s, today)} ${dailyStreak(s, today) === 1 ? 'day' : 'days'}`} />
      </div>

      <SectionTitle>Daily challenge · last 5 weeks</SectionTitle>
      <Card>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const r = s.daily[d]
            const ratio = r ? r.correct / Math.max(1, r.total) : -1
            const color =
              ratio < 0
                ? 'bg-slate-100 dark:bg-slate-800'
                : ratio >= 0.9
                  ? 'bg-emerald-500'
                  : ratio >= 0.7
                    ? 'bg-emerald-400'
                    : ratio >= 0.5
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
            return (
              <div
                key={d}
                title={r ? `${d}: ${r.correct}/${r.total}, ${r.score} pts` : d}
                className={`aspect-square rounded-md ${color} ${d === today ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`}
              />
            )
          })}
        </div>
      </Card>

      <SectionTitle>By continent</SectionTitle>
      <Card className="space-y-3">
        {byContinent.map((row) => (
          <div key={row.cont}>
            <div className="flex justify-between text-sm">
              <span className="font-semibold">{row.cont}</span>
              <span className="text-slate-500 tabular-nums dark:text-slate-400">
                {row.known}/{row.total} known{row.accuracy !== null && ` · ${Math.round(row.accuracy * 100)}%`}
              </span>
            </div>
            <ProgressBar value={row.known / row.total} className="mt-1" />
          </div>
        ))}
      </Card>

      <SectionTitle>High scores</SectionTitle>
      <Card className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
        {[...PLAYABLE_MODES, 'daily' as const].map((id) => (
          <div key={id} className="flex items-center justify-between px-4 py-3">
            <span className="font-semibold">
              {MODES[id].icon} {MODES[id].title}
            </span>
            <span className="font-black tabular-nums">{s.highScores[id] !== undefined ? formatNumber(s.highScores[id] ?? 0) : '—'}</span>
          </div>
        ))}
      </Card>

      {s.history.length > 0 && (
        <>
          <SectionTitle>Recent games</SectionTitle>
          <Card className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
            {s.history.slice(0, 10).map((g) => (
              <div key={g.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="font-semibold">
                    {MODES[g.mode].icon} {MODES[g.mode].title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {g.correct}/{g.total} correct · {relativeTime(g.playedAt)}
                  </div>
                </div>
                <span className="font-black tabular-nums">{formatNumber(g.score)}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  )
}
