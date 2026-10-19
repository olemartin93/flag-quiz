import { useEffect, useMemo, useState } from 'react'
import { Flag } from '../components/Flag'
import { Card, ProgressBar, SectionTitle, formatNumber } from '../components/ui'
import { CONTINENTS, type Continent, type Difficulty } from '../data/countries'
import { dailyStreak } from '../lib/achievements'
import { dateKey, msUntilTomorrow } from '../lib/dates'
import { DIFFICULTY_LABEL, MODES, PLAYABLE_MODES, type DifficultyFilter, type ModeId } from '../lib/modes'
import { buildPool, weakFlags } from '../lib/quiz'
import { BASE_POINTS, levelInfo } from '../lib/scoring'
import { updateSettings, useAppState } from '../lib/store'
import type { QuizSetup } from '../lib/useQuiz'
import { shareText, summaryShareText } from '../lib/share'

const CONTINENT_ICON: Record<Continent, string> = {
  Africa: '🌍',
  Asia: '🌏',
  Europe: '🏰',
  'North America': '🗽',
  'South America': '🌎',
  Oceania: '🏝️',
}

const DIFFICULTIES: readonly DifficultyFilter[] = ['all', 1, 2, 3]

function useCountdown(): string {
  const [ms, setMs] = useState(() => msUntilTomorrow())
  useEffect(() => {
    const t = window.setInterval(() => setMs(msUntilTomorrow()), 1000)
    return () => window.clearInterval(t)
  }, [])
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function DailyCard({ onStart }: { readonly onStart: () => void }) {
  const daily = useAppState((s) => s.daily)
  const today = dateKey()
  const result = daily[today]
  const streak = useAppState((s) => dailyStreak(s, today))
  const countdown = useCountdown()
  const [copied, setCopied] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-700 p-5 text-white shadow-lg">
      <div className="absolute -right-8 -bottom-10 text-9xl opacity-20" aria-hidden="true">
        🌍
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold tracking-wider uppercase opacity-80">Daily Challenge</div>
        <div className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">🔥 {streak} day{streak === 1 ? '' : 's'}</div>
      </div>
      {result ? (
        <>
          <div className="mt-2 text-3xl font-black tabular-nums">{formatNumber(result.score)} pts</div>
          <div className="text-sm opacity-90">
            {result.correct}/{result.total} correct · next in <span className="tabular-nums">{countdown}</span>
          </div>
          <div className="mt-2 text-lg tracking-widest">{result.answers.map((a) => (a.correct ? '🟩' : '🟥')).join('')}</div>
          <button
            type="button"
            className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-bold text-purple-700 shadow active:scale-95"
            onClick={() => {
              void shareText(summaryShareText(result)).then((how) => {
                if (how === 'copied') {
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 2000)
                }
              })
            }}
          >
            {copied ? 'Copied!' : 'Share result'}
          </button>
        </>
      ) : (
        <>
          <div className="mt-2 text-2xl font-black">Today&apos;s 10 flags</div>
          <div className="text-sm opacity-90">Same flags for everyone. Easy to hard, mixed question types.</div>
          <button
            type="button"
            onClick={onStart}
            className="mt-4 w-full rounded-xl bg-white py-3 font-extrabold text-purple-700 shadow-md transition active:scale-95"
          >
            Play today&apos;s challenge
          </button>
        </>
      )}
    </div>
  )
}

export function Home({ onStart }: { readonly onStart: (setup: QuizSetup) => void }) {
  const settings = useAppState((s) => s.settings)
  const totalPoints = useAppState((s) => s.totalPoints)
  const highScores = useAppState((s) => s.highScores)
  const flagStats = useAppState((s) => s.flagStats)
  const level = levelInfo(totalPoints)
  const { continents, difficulty } = settings
  const pool = useMemo(() => buildPool(continents, difficulty), [continents, difficulty])
  const weak = useMemo(() => weakFlags(flagStats), [flagStats])

  const toggleContinent = (c: Continent) => {
    const has = continents.includes(c)
    const next = has ? continents.filter((x) => x !== c) : [...continents, c]
    if (next.length > 0) updateSettings({ continents: CONTINENTS.filter((x) => next.includes(x)) })
  }
  const allSelected = continents.length === CONTINENTS.length

  const start = (mode: ModeId) => onStart({ mode, continents, difficulty })

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3 pt-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xl font-black text-white shadow">
          {level.level}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="truncate text-lg font-extrabold">{level.title}</h1>
            <span className="text-sm font-bold text-indigo-600 tabular-nums dark:text-indigo-400">
              {formatNumber(totalPoints)} pts
            </span>
          </div>
          <ProgressBar value={level.progress} className="mt-1" />
          <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
            {formatNumber(level.next - totalPoints)} pts to level {level.level + 1}
          </div>
        </div>
      </header>

      <DailyCard onStart={() => onStart({ mode: 'daily', continents: [...CONTINENTS], difficulty: 'all' })} />

      <SectionTitle>Continents</SectionTitle>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateSettings({ continents: [...CONTINENTS] })}
          className={`rounded-full px-3.5 py-2 text-sm font-semibold ring-1 transition active:scale-95 ${
            allSelected
              ? 'bg-indigo-600 text-white ring-indigo-600'
              : 'bg-white text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'
          }`}
        >
          🗺️ World
        </button>
        {CONTINENTS.map((c) => {
          const on = !allSelected && continents.includes(c)
          return (
            <button
              type="button"
              key={c}
              onClick={() => (allSelected ? updateSettings({ continents: [c] }) : toggleContinent(c))}
              aria-pressed={on}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold ring-1 transition active:scale-95 ${
                on
                  ? 'bg-indigo-600 text-white ring-indigo-600'
                  : 'bg-white text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'
              }`}
            >
              {CONTINENT_ICON[c]} {c}
            </button>
          )
        })}
      </div>

      <SectionTitle>Difficulty</SectionTitle>
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-200 p-1 dark:bg-slate-800">
        {DIFFICULTIES.map((d) => (
          <button
            type="button"
            key={d}
            onClick={() => updateSettings({ difficulty: d })}
            className={`rounded-xl px-1 py-2 text-center transition ${
              difficulty === d ? 'bg-white shadow dark:bg-slate-950' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="text-sm font-bold">{d === 'all' ? 'Mixed' : DIFFICULTY_LABEL[d]}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {d === 'all' ? '100–300' : BASE_POINTS[d as Difficulty]} pts
            </div>
          </button>
        ))}
      </div>
      <p className="px-1 text-xs text-slate-500 dark:text-slate-400">
        {pool.length} flags selected. Answer fast for up to +50% and build streaks for up to 2× points.
      </p>

      <SectionTitle>Game modes</SectionTitle>
      {pool.length < 4 ? (
        <Card className="text-sm">Pick more continents or another difficulty. At least 4 flags are needed.</Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {PLAYABLE_MODES.map((id) => {
            const m = MODES[id]
            const best = highScores[id]
            return (
              <button
                type="button"
                key={id}
                onClick={() => start(id)}
                className={`flex min-h-32 flex-col rounded-2xl bg-gradient-to-br ${m.gradient} p-4 text-left text-white shadow-md transition active:scale-95`}
              >
                <span className="text-2xl">{m.icon}</span>
                <span className="mt-1 font-extrabold">{m.title}</span>
                <span className="text-xs leading-snug opacity-90">{m.tagline}</span>
                {best !== undefined && <span className="mt-auto pt-2 text-[11px] font-bold opacity-90">🏆 {formatNumber(best)}</span>}
              </button>
            )
          })}
        </div>
      )}

      {weak.length > 0 && (
        <button
          type="button"
          onClick={() => onStart({ mode: 'review', continents: [...CONTINENTS], difficulty: 'all', pool: weak.slice(0, 10) })}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition active:scale-[0.98] dark:bg-slate-900 dark:ring-slate-800"
        >
          <div className="flex -space-x-3">
            {weak.slice(0, 3).map((c) => (
              <div key={c.code} className="w-10">
                <Flag code={c.code} className="ring-2 ring-white dark:ring-slate-900" />
              </div>
            ))}
          </div>
          <div className="flex-1">
            <div className="font-bold">🎯 Practice weak flags</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{weak.length} flags you often miss</div>
          </div>
          <span className="text-slate-400">›</span>
        </button>
      )}
    </div>
  )
}
