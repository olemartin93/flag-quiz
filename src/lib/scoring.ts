import type { Difficulty } from '../data/countries'
import type { QuestionType } from './modes'

export const BASE_POINTS: Record<Difficulty, number> = { 1: 100, 2: 200, 3: 300 }

export const TYPE_MULTIPLIER: Record<QuestionType, number> = {
  'flag-to-name': 1,
  'name-to-flag': 1,
  'flag-to-capital': 1.25,
  'type-name': 1.5,
}

/** Answer within this window to earn a speed bonus (max +50% when instant). */
export const SPEED_WINDOW_MS = 10_000
const FAST_MS = 2_000

export interface ScoreInput {
  readonly difficulty: Difficulty
  readonly type: QuestionType
  readonly timeMs: number
  /** Correct answers in a row before this one. */
  readonly streak: number
  readonly hintUsed: boolean
}

export interface ScoreBreakdown {
  readonly base: number
  readonly speedBonus: number
  readonly streakMultiplier: number
  readonly total: number
}

export function streakMultiplier(streak: number): number {
  return 1 + Math.min(streak, 10) * 0.1
}

export function speedFactor(timeMs: number): number {
  if (timeMs <= FAST_MS) return 0.5
  if (timeMs >= SPEED_WINDOW_MS) return 0
  return 0.5 * (1 - (timeMs - FAST_MS) / (SPEED_WINDOW_MS - FAST_MS))
}

export function scoreAnswer(input: ScoreInput): ScoreBreakdown {
  const hint = input.hintUsed ? 0.5 : 1
  const base = Math.round(BASE_POINTS[input.difficulty] * TYPE_MULTIPLIER[input.type] * hint)
  const speedBonus = Math.round(base * speedFactor(input.timeMs))
  const mult = streakMultiplier(input.streak)
  return { base, speedBonus, streakMultiplier: mult, total: Math.round((base + speedBonus) * mult) }
}

const TITLES = [
  'Tourist',
  'Backpacker',
  'Traveler',
  'Explorer',
  'Navigator',
  'Cartographer',
  'Ambassador',
  'Diplomat',
  'Globetrotter',
  'World Master',
] as const

/** Points needed to reach a level: 0, 1k, 3k, 6k, 10k, ... */
export function pointsForLevel(level: number): number {
  return (1000 * (level - 1) * level) / 2
}

export interface LevelInfo {
  readonly level: number
  readonly title: string
  readonly current: number
  readonly next: number
  readonly progress: number
}

export function levelInfo(points: number): LevelInfo {
  let level = 1
  while (points >= pointsForLevel(level + 1)) level++
  const current = pointsForLevel(level)
  const next = pointsForLevel(level + 1)
  const title = TITLES[Math.min(level - 1, TITLES.length - 1)] ?? 'World Master'
  return { level, title, current, next, progress: (points - current) / (next - current) }
}
