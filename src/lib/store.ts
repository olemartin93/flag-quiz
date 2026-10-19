import { useSyncExternalStore } from 'react'
import { CONTINENTS, type Continent } from '../data/countries'
import type { DifficultyFilter, ModeId, QuestionType } from './modes'

export interface FlagStat {
  readonly seen: number
  readonly correct: number
  readonly lastSeen: number
}

export interface AnswerRecord {
  readonly code: string
  readonly type: QuestionType
  readonly correct: boolean
  readonly points: number
  readonly timeMs: number
  readonly given: string
  readonly hintUsed: boolean
}

export interface GameSummary {
  readonly id: string
  readonly mode: ModeId
  readonly playedAt: number
  readonly day: string
  readonly score: number
  readonly correct: number
  readonly total: number
  readonly bestStreak: number
  readonly durationMs: number
  readonly continents: readonly Continent[]
  readonly difficulty: DifficultyFilter
  readonly answers: readonly AnswerRecord[]
}

export type Theme = 'system' | 'light' | 'dark'

export interface Settings {
  readonly sound: boolean
  readonly haptics: boolean
  readonly theme: Theme
  readonly continents: readonly Continent[]
  readonly difficulty: DifficultyFilter
}

export interface AppState {
  readonly version: 1
  readonly totalPoints: number
  readonly gamesPlayed: number
  readonly totalCorrect: number
  readonly totalAnswered: number
  readonly bestStreak: number
  readonly highScores: Partial<Record<ModeId, number>>
  readonly flagStats: Readonly<Record<string, FlagStat>>
  readonly daily: Readonly<Record<string, GameSummary>>
  readonly achievements: Readonly<Record<string, number>>
  readonly history: readonly GameSummary[]
  readonly settings: Settings
}

const KEY = 'flag-quiz:v1'

export const initialState: AppState = {
  version: 1,
  totalPoints: 0,
  gamesPlayed: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  bestStreak: 0,
  highScores: {},
  flagStats: {},
  daily: {},
  achievements: {},
  history: [],
  settings: { sound: true, haptics: true, theme: 'system', continents: [...CONTINENTS], difficulty: 'all' },
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (parsed.version !== 1) return initialState
    return { ...initialState, ...parsed, settings: { ...initialState.settings, ...parsed.settings } }
  } catch {
    return initialState
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()

export function getState(): AppState {
  return state
}

export function setState(update: (s: AppState) => AppState): void {
  state = update(state)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked: keep playing in memory.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state))
}

export function updateSettings(patch: Partial<Settings>): void {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

export function resetProgress(): void {
  setState((s) => ({ ...initialState, settings: s.settings }))
}

export function exportProgress(): string {
  return JSON.stringify(state)
}

export function importProgress(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as Partial<AppState>
    if (parsed.version !== 1) return false
    setState(() => ({ ...initialState, ...parsed, settings: { ...initialState.settings, ...parsed.settings } }))
    return true
  } catch {
    return false
  }
}
