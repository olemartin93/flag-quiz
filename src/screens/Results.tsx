import { useState } from 'react'
import { Confetti } from '../components/Confetti'
import { Flag } from '../components/Flag'
import { Card, SectionTitle, Stat, formatNumber } from '../components/ui'
import { COUNTRY_BY_CODE } from '../data/countries'
import { MODES } from '../lib/modes'
import { shareText, summaryShareText } from '../lib/share'
import type { QuizResult } from '../lib/useQuiz'

function verdict(ratio: number): { emoji: string; text: string } {
  if (ratio === 1) return { emoji: '🏆', text: 'Perfect!' }
  if (ratio >= 0.8) return { emoji: '🌟', text: 'Excellent!' }
  if (ratio >= 0.6) return { emoji: '👏', text: 'Nice work!' }
  if (ratio >= 0.4) return { emoji: '🙂', text: 'Not bad!' }
  return { emoji: '📚', text: 'Keep practicing!' }
}

export function Results({
  result,
  onPlayAgain,
  onHome,
}: {
  readonly result: QuizResult
  readonly onPlayAgain: (() => void) | null
  readonly onHome: () => void
}) {
  const { summary, record } = result
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle')
  const mode = MODES[summary.mode]
  const ratio = summary.total === 0 ? 0 : summary.correct / summary.total
  const v = verdict(ratio)
  const celebrate = record.isHighScore || ratio === 1 || record.unlocked.length > 0
  const avgSec = summary.total === 0 ? 0 : summary.answers.reduce((s, a) => s + a.timeMs, 0) / summary.total / 1000

  return (
    <div className="space-y-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      {celebrate && <Confetti />}

      <div className="animate-pop text-center">
        <div className="text-6xl">{v.emoji}</div>
        <h1 className="mt-2 text-3xl font-black">{v.text}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {mode.icon} {mode.title}
        </p>
      </div>

      <Card className="text-center">
        <div className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">Score</div>
        <div className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-5xl font-black text-transparent tabular-nums">
          {formatNumber(summary.score)}
        </div>
        {record.isHighScore && (
          <div className="mt-1 inline-block animate-pop rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            🏆 New best! {record.previousBest > 0 && `(was ${formatNumber(record.previousBest)})`}
          </div>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2 text-left">
          <Stat label="Correct" value={`${summary.correct}/${summary.total}`} />
          <Stat label="Best streak" value={`🔥${summary.bestStreak}`} />
          <Stat label="Avg time" value={`${avgSec.toFixed(1)}s`} />
        </div>
      </Card>

      {record.unlocked.length > 0 && (
        <>
          <SectionTitle>Achievements unlocked</SectionTitle>
          <div className="space-y-2">
            {record.unlocked.map((a) => (
              <div
                key={a.id}
                className="flex animate-slide-up items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-3 text-white shadow"
              >
                <span className="text-3xl">{a.icon}</span>
                <div>
                  <div className="font-extrabold">{a.title}</div>
                  <div className="text-xs opacity-90">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            void shareText(summaryShareText(summary)).then((how) => {
              if (how === 'copied') {
                setShareState('copied')
                window.setTimeout(() => setShareState('idle'), 2000)
              }
            })
          }}
          className="rounded-2xl bg-white py-3 font-bold shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
        >
          {shareState === 'copied' ? '✓ Copied' : '📤 Share'}
        </button>
        {onPlayAgain ? (
          <button type="button" onClick={onPlayAgain} className="rounded-2xl bg-indigo-600 py-3 font-bold text-white shadow">
            🔁 Play again
          </button>
        ) : (
          <button type="button" onClick={onHome} className="rounded-2xl bg-indigo-600 py-3 font-bold text-white shadow">
            Done
          </button>
        )}
      </div>
      <button type="button" onClick={onHome} className="w-full py-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
        Back to menu
      </button>

      {summary.answers.length > 0 && (
        <>
          <SectionTitle>Your answers</SectionTitle>
          <div className="space-y-2">
            {summary.answers.map((a, i) => {
              const c = COUNTRY_BY_CODE.get(a.code)
              if (!c) return null
              const given = COUNTRY_BY_CODE.get(a.given)
              const givenLabel =
                a.type === 'type-name' ? a.given || 'skipped' : a.type === 'flag-to-capital' ? given?.capital : given?.name
              return (
                <div
                  key={`${a.code}-${i}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
                >
                  <div className="w-14 shrink-0">
                    <Flag code={c.code} alt={c.name} className="rounded-md" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{c.name}</div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {a.correct ? `Capital: ${c.capital}` : `You said: ${givenLabel ?? '—'}`}
                    </div>
                  </div>
                  <div className={`text-right text-sm font-black tabular-nums ${a.correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {a.correct ? `+${a.points}` : '✗'}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
