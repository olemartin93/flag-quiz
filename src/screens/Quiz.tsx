import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Flag } from '../components/Flag'
import { Modal } from '../components/ui'
import type { Country } from '../data/countries'
import { isNameMatch } from '../lib/match'
import { DIFFICULTY_LABEL, MODES } from '../lib/modes'
import type { Question } from '../lib/quiz'
import { BASE_POINTS, SPEED_WINDOW_MS, streakMultiplier } from '../lib/scoring'
import { useQuiz, type QuizResult, type QuizSetup, type QuizState } from '../lib/useQuiz'

const PROMPT: Record<Question['type'], string> = {
  'flag-to-name': 'Which country is this?',
  'name-to-flag': 'Find the flag of',
  'flag-to-capital': 'What is the capital?',
  'type-name': 'Type the country name',
}

const DIFFICULTY_BADGE = {
  1: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  3: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
} as const

function optionState(state: QuizState, q: Question, option: Country): 'idle' | 'correct' | 'wrong' | 'dim' {
  if (state.phase !== 'feedback' || !state.last) return 'idle'
  if (option.code === q.country.code) return 'correct'
  if (option.code === state.last.given) return 'wrong'
  return 'dim'
}

const OPTION_STYLE = {
  idle: 'bg-white ring-slate-200 hover:ring-indigo-400 active:scale-[0.97] dark:bg-slate-900 dark:ring-slate-700',
  correct: 'bg-emerald-500 text-white ring-emerald-500 animate-pop',
  wrong: 'bg-rose-500 text-white ring-rose-500 animate-shake',
  dim: 'bg-white opacity-50 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700',
} as const

function TextOptions({ state, q, onPick }: { readonly state: QuizState; readonly q: Question; readonly onPick: (c: Country) => void }) {
  return (
    <div className="grid gap-2.5">
      {q.options.map((o, i) => {
        const st = optionState(state, q, o)
        const hidden = state.hidden.includes(o.code)
        return (
          <button
            type="button"
            key={o.code}
            disabled={state.phase !== 'question' || hidden}
            onClick={() => onPick(o)}
            className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold ring-2 transition ${OPTION_STYLE[st]} ${
              hidden ? 'invisible' : ''
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                st === 'idle' || st === 'dim' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800' : 'bg-white/25'
              }`}
            >
              {i + 1}
            </span>
            <span className="flex-1">{q.type === 'flag-to-capital' ? o.capital : o.name}</span>
            {st === 'correct' && <span>✓</span>}
            {st === 'wrong' && <span>✗</span>}
          </button>
        )
      })}
    </div>
  )
}

function FlagOptions({ state, q, onPick }: { readonly state: QuizState; readonly q: Question; readonly onPick: (c: Country) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {q.options.map((o, i) => {
        const st = optionState(state, q, o)
        const hidden = state.hidden.includes(o.code)
        const ring = {
          idle: 'ring-transparent hover:ring-indigo-400 active:scale-95',
          correct: 'ring-emerald-500 animate-pop',
          wrong: 'ring-rose-500 animate-shake',
          dim: 'ring-transparent opacity-40',
        }[st]
        return (
          <button
            type="button"
            key={o.code}
            disabled={state.phase !== 'question' || hidden}
            onClick={() => onPick(o)}
            aria-label={`Option ${i + 1}`}
            className={`relative rounded-xl p-1 ring-4 transition ${ring} ${hidden ? 'invisible' : ''}`}
          >
            <Flag code={o.code} alt={`Option ${i + 1}`} />
            {state.phase === 'feedback' && (st === 'correct' || st === 'wrong') && (
              <span className="absolute inset-x-1 bottom-1 rounded-b-lg bg-black/60 px-1 py-0.5 text-xs font-semibold text-white">
                {o.name}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function TypeAnswer({
  state,
  q,
  onSubmit,
}: {
  readonly state: QuizState
  readonly q: Question
  readonly onSubmit: (text: string) => void
}) {
  const [text, setText] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    setText('')
    input.current?.focus()
  }, [q.id])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (text.trim()) onSubmit(text)
  }
  const fb = state.phase === 'feedback' ? state.last : null
  const hintText = q.country.name
    .split('')
    .map((ch, i) => (i === 0 || ch === ' ' || ch === '-' ? ch : '_'))
    .join(' ')

  return (
    <form onSubmit={submit} className="space-y-3">
      {state.hintUsed && !fb && (
        <div className="text-center font-mono text-lg tracking-wide text-indigo-600 dark:text-indigo-400">{hintText}</div>
      )}
      <input
        ref={input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={state.phase !== 'question'}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        enterKeyHint="done"
        placeholder="Country name…"
        className={`w-full rounded-2xl bg-white px-4 py-4 text-lg font-semibold ring-2 outline-none focus:ring-indigo-500 dark:bg-slate-900 ${
          fb ? (fb.correct ? 'ring-emerald-500' : 'animate-shake ring-rose-500') : 'ring-slate-200 dark:ring-slate-700'
        }`}
      />
      {fb && !fb.correct && (
        <div className="rounded-xl bg-rose-50 px-4 py-2 text-center text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          It was <b>{q.country.name}</b>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={state.phase !== 'question'}
          onClick={() => onSubmit('')}
          className="rounded-2xl bg-slate-200 py-3 font-bold text-slate-700 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200"
        >
          Skip
        </button>
        <button
          type="submit"
          disabled={state.phase !== 'question' || !text.trim()}
          className="col-span-2 rounded-2xl bg-indigo-600 py-3 font-bold text-white disabled:opacity-50"
        >
          Submit
        </button>
      </div>
    </form>
  )
}

function TopBar({ state, setup, onQuit }: { readonly state: QuizState; readonly setup: QuizSetup; readonly onQuit: () => void }) {
  const mode = MODES[setup.mode]
  const total = mode.length === null ? null : state.questions.length
  const timeLeft = state.endsAt === null ? null : Math.max(0, state.endsAt - state.now)
  const progress =
    timeLeft !== null && mode.timeLimitSec !== null
      ? timeLeft / (mode.timeLimitSec * 1000)
      : total !== null
        ? state.answers.length / total
        : null

  return (
    <div className="sticky top-0 z-10 -mx-4 bg-slate-100/90 px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur dark:bg-slate-950/90">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onQuit}
          aria-label="Quit"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm dark:bg-slate-900"
        >
          ✕
        </button>
        <div className="flex-1 text-sm font-bold">
          {mode.icon} {mode.title}
          <div className="text-xs font-semibold text-slate-500 tabular-nums dark:text-slate-400">
            {timeLeft !== null ? (
              <span className={timeLeft < 10_000 ? 'text-rose-500' : ''}>⏱ {(timeLeft / 1000).toFixed(1)}s</span>
            ) : total !== null ? (
              `Question ${Math.min(state.index + 1, total)} of ${total}`
            ) : (
              `Question ${state.index + 1}`
            )}
            {state.lives !== null && (
              <span className="ml-2" aria-label={`${state.lives} lives`}>
                {'❤️'.repeat(Math.max(0, state.lives))}
                {'🖤'.repeat(Math.max(0, (mode.lives ?? 0) - state.lives))}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-indigo-600 tabular-nums dark:text-indigo-400">{state.score.toLocaleString()}</div>
          <div className={`text-xs font-bold tabular-nums ${state.streak >= 3 ? 'text-orange-500' : 'text-slate-400'}`}>
            🔥 {state.streak} · ×{streakMultiplier(state.streak).toFixed(1)}
          </div>
        </div>
      </div>
      {progress !== null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${timeLeft !== null && timeLeft < 10_000 ? 'bg-rose-500' : 'bg-indigo-500'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function Quiz({ setup, onFinish }: { readonly setup: QuizSetup; readonly onFinish: (r: QuizResult) => void }) {
  const { state, question: q, answer, hint, quit } = useQuiz(setup, onFinish)
  const [confirmQuit, setConfirmQuit] = useState(false)

  const pick = (c: Country) => {
    if (q) answer(c.code, c.code === q.country.code)
  }

  // Number keys 1–4 pick an answer, H uses a hint.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!q || q.type === 'type-name' || e.target instanceof HTMLInputElement) return
      const n = Number(e.key)
      const option = q.options[n - 1]
      if (option && !state.hidden.includes(option.code)) pick(option)
      if (e.key.toLowerCase() === 'h') hint()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!q) return null
  const fb = state.phase === 'feedback' ? state.last : null
  const showsFlag = q.type !== 'name-to-flag'

  return (
    <div className="flex min-h-dvh flex-col pb-6">
      <TopBar state={state} setup={setup} onQuit={() => (state.answers.length === 0 ? quit() : setConfirmQuit(true))} />

      <div key={q.id} className="mt-3 flex flex-1 animate-fade-in flex-col gap-4">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500 dark:text-slate-400">{PROMPT[q.type]}</span>
          <span className={`rounded-full px-2 py-0.5 ${DIFFICULTY_BADGE[q.country.difficulty]}`}>
            {DIFFICULTY_LABEL[q.country.difficulty]} · {BASE_POINTS[q.country.difficulty]}
          </span>
        </div>

        <div className="relative">
          {showsFlag ? (
            <div className="mx-auto max-w-sm">
              <Flag code={q.country.code} alt="Mystery flag" className="rounded-xl shadow-xl" />
            </div>
          ) : (
            <div className="rounded-2xl bg-white py-8 text-center text-3xl font-black shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              {q.country.name}
            </div>
          )}
          {fb?.breakdown && (
            <div className="pointer-events-none absolute top-1/2 left-1/2 animate-float-up rounded-full bg-emerald-500 px-4 py-1.5 text-xl font-black whitespace-nowrap text-white shadow-lg">
              +{fb.breakdown.total}
            </div>
          )}
        </div>

        {/* Speed bonus meter: drains over the bonus window. */}
        <div className="h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          {state.phase === 'question' && (
            <div className="h-full animate-shrink bg-amber-400" style={{ animationDuration: `${SPEED_WINDOW_MS}ms` }} />
          )}
        </div>

        <div className="min-h-6 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          {fb?.breakdown ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              {fb.breakdown.base} base
              {fb.breakdown.speedBonus > 0 && ` · ⚡ +${fb.breakdown.speedBonus}`}
              {fb.breakdown.streakMultiplier > 1 && ` · 🔥 ×${fb.breakdown.streakMultiplier.toFixed(1)}`}
            </span>
          ) : fb && q.type !== 'type-name' ? (
            <span className="text-rose-600 dark:text-rose-400">
              {q.type === 'flag-to-capital' ? `${q.country.capital} is the capital of ${q.country.name}` : `That was ${q.country.name}`}
            </span>
          ) : (
            'Answer within 10s for a speed bonus'
          )}
        </div>

        {q.type === 'type-name' ? (
          <TypeAnswer state={state} q={q} onSubmit={(text) => answer(text, isNameMatch(text, q.country))} />
        ) : q.type === 'name-to-flag' ? (
          <FlagOptions state={state} q={q} onPick={pick} />
        ) : (
          <TextOptions state={state} q={q} onPick={pick} />
        )}

        <button
          type="button"
          onClick={hint}
          disabled={state.phase !== 'question' || state.hintUsed || state.hintsLeft <= 0}
          className="mx-auto rounded-full bg-white px-4 py-2 text-sm font-bold text-indigo-600 shadow-sm ring-1 ring-slate-200 disabled:opacity-40 dark:bg-slate-900 dark:text-indigo-400 dark:ring-slate-800"
        >
          💡 {q.type === 'type-name' ? 'Show letters' : '50 / 50'} ({state.hintsLeft} left · half points)
        </button>
      </div>

      {confirmQuit && (
        <Modal onClose={() => setConfirmQuit(false)}>
          <h3 className="text-lg font-extrabold">End this game?</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {setup.mode === 'daily'
              ? "Your answers so far count as today's result. You can't replay the daily challenge."
              : 'Your score so far will be saved.'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" className="rounded-xl bg-slate-200 py-3 font-bold dark:bg-slate-800" onClick={() => setConfirmQuit(false)}>
              Keep playing
            </button>
            <button
              type="button"
              className="rounded-xl bg-rose-600 py-3 font-bold text-white"
              onClick={() => {
                setConfirmQuit(false)
                quit()
              }}
            >
              End game
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
