import { useEffect, useReducer, useRef } from 'react'
import type { Continent, Country } from '../data/countries'
import { dateKey } from './dates'
import { play } from './feedback'
import { MODES, type DifficultyFilter, type ModeId } from './modes'
import { buildDailyQuestions, buildPool, buildQuestions, type Question } from './quiz'
import { recordGame, type RecordResult } from './record'
import { scoreAnswer, type ScoreBreakdown } from './scoring'
import type { AnswerRecord, GameSummary } from './store'

export interface QuizSetup {
  readonly mode: ModeId
  readonly continents: readonly Continent[]
  readonly difficulty: DifficultyFilter
  /** Fixed list of countries (Practice mode). */
  readonly pool?: readonly Country[]
}

export type Phase = 'question' | 'feedback' | 'done'

export interface QuizState {
  readonly day: string
  readonly questions: readonly Question[]
  readonly index: number
  readonly phase: Phase
  readonly answers: readonly AnswerRecord[]
  readonly score: number
  readonly streak: number
  readonly bestStreak: number
  readonly lives: number | null
  readonly startedAt: number
  readonly endsAt: number | null
  readonly now: number
  readonly questionStartedAt: number
  readonly hidden: readonly string[]
  readonly hintsLeft: number
  readonly hintUsed: boolean
  readonly last: { readonly correct: boolean; readonly given: string; readonly breakdown: ScoreBreakdown | null } | null
}

type Action =
  | { type: 'answer'; given: string; correct: boolean; at: number }
  | { type: 'next'; at: number }
  | { type: 'tick'; at: number }
  | { type: 'hint' }
  | { type: 'quit' }

const TIME_PENALTY_MS = 3_000
const HINTS_PER_GAME = 3

function createState(setup: QuizSetup): QuizState {
  const mode = MODES[setup.mode]
  const day = dateKey()
  let questions: Question[]
  if (setup.mode === 'daily') {
    questions = buildDailyQuestions(day)
  } else {
    const pool = setup.pool ?? buildPool(setup.continents, setup.difficulty)
    questions = buildQuestions({
      pool,
      type: mode.questionType,
      length: mode.length,
      ramp: setup.mode === 'survival',
      rounds: setup.mode === 'time-attack' ? 4 : 1,
    })
  }
  const now = Date.now()
  return {
    day,
    questions,
    index: 0,
    phase: questions.length > 0 ? 'question' : 'done',
    answers: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    lives: mode.lives,
    startedAt: now,
    endsAt: mode.timeLimitSec === null ? null : now + mode.timeLimitSec * 1000,
    now,
    questionStartedAt: now,
    hidden: [],
    hintsLeft: setup.mode === 'daily' ? 1 : HINTS_PER_GAME,
    hintUsed: false,
    last: null,
  }
}

function reducer(state: QuizState, action: Action): QuizState {
  if (state.phase === 'done') return state
  switch (action.type) {
    case 'answer': {
      const q = state.questions[state.index]
      if (state.phase !== 'question' || !q) return state
      const timeMs = action.at - state.questionStartedAt
      const breakdown = action.correct
        ? scoreAnswer({ difficulty: q.country.difficulty, type: q.type, timeMs, streak: state.streak, hintUsed: state.hintUsed })
        : null
      const points = breakdown?.total ?? 0
      const streak = action.correct ? state.streak + 1 : 0
      const record: AnswerRecord = {
        code: q.country.code,
        type: q.type,
        correct: action.correct,
        points,
        timeMs,
        given: action.given,
        hintUsed: state.hintUsed,
      }
      return {
        ...state,
        phase: 'feedback',
        answers: [...state.answers, record],
        score: state.score + points,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        lives: state.lives !== null && !action.correct ? state.lives - 1 : state.lives,
        endsAt: state.endsAt !== null && !action.correct ? state.endsAt - TIME_PENALTY_MS : state.endsAt,
        now: action.at,
        last: { correct: action.correct, given: action.given, breakdown },
      }
    }
    case 'next': {
      if (state.phase !== 'feedback') return state
      const index = state.index + 1
      const outOfTime = state.endsAt !== null && action.at >= state.endsAt
      const done = index >= state.questions.length || state.lives === 0 || outOfTime
      return {
        ...state,
        index: done ? state.index : index,
        phase: done ? 'done' : 'question',
        questionStartedAt: action.at,
        now: action.at,
        hidden: [],
        hintUsed: false,
      }
    }
    case 'tick': {
      if (state.endsAt !== null && action.at >= state.endsAt) return { ...state, now: action.at, phase: 'done' }
      return { ...state, now: action.at }
    }
    case 'hint': {
      const q = state.questions[state.index]
      if (state.phase !== 'question' || !q || state.hintUsed || state.hintsLeft <= 0) return state
      const wrong = q.options.filter((o) => o.code !== q.country.code).map((o) => o.code)
      const hidden = wrong.sort(() => Math.random() - 0.5).slice(0, 2)
      return { ...state, hidden, hintUsed: true, hintsLeft: state.hintsLeft - 1 }
    }
    case 'quit':
      return { ...state, phase: 'done' }
  }
}

export interface QuizResult {
  readonly summary: GameSummary
  readonly record: RecordResult
}

export function useQuiz(setup: QuizSetup, onFinish: (result: QuizResult) => void) {
  const [state, dispatch] = useReducer(reducer, setup, createState)
  const finished = useRef(false)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish
  const isTimed = state.endsAt !== null

  // Advance after showing feedback.
  useEffect(() => {
    if (state.phase !== 'feedback' || !state.last) return
    const delay = isTimed ? (state.last.correct ? 350 : 900) : state.last.correct ? 800 : 1700
    const t = window.setTimeout(() => dispatch({ type: 'next', at: Date.now() }), delay)
    return () => window.clearTimeout(t)
  }, [state.phase, state.last, isTimed])

  // Countdown for timed modes.
  useEffect(() => {
    if (!isTimed || state.phase === 'done') return
    const t = window.setInterval(() => dispatch({ type: 'tick', at: Date.now() }), 200)
    return () => window.clearInterval(t)
  }, [isTimed, state.phase])

  useEffect(() => {
    if (state.phase !== 'done' || finished.current) return
    finished.current = true
    const now = Date.now()
    const summary: GameSummary = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      mode: setup.mode,
      playedAt: now,
      day: state.day,
      score: state.score,
      correct: state.answers.filter((a) => a.correct).length,
      total: state.answers.length,
      bestStreak: state.bestStreak,
      durationMs: now - state.startedAt,
      continents: setup.continents,
      difficulty: setup.difficulty,
      answers: state.answers,
    }
    // Quitting before answering anything isn't a game.
    if (summary.total === 0) {
      onFinishRef.current({ summary, record: { unlocked: [], isHighScore: false, previousBest: 0 } })
      return
    }
    const record = recordGame(summary)
    play(record.unlocked.length > 0 ? 'unlock' : 'finish')
    onFinishRef.current({ summary, record })
  }, [state, setup])

  const answer = (given: string, correct: boolean) => {
    if (state.phase !== 'question') return
    play(correct ? 'correct' : 'wrong')
    dispatch({ type: 'answer', given, correct, at: Date.now() })
  }

  return {
    state,
    question: state.questions[state.index] ?? null,
    answer,
    hint: () => dispatch({ type: 'hint' }),
    quit: () => dispatch({ type: 'quit' }),
  }
}
