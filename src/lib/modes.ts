import type { Difficulty } from '../data/countries'

export type QuestionType = 'flag-to-name' | 'name-to-flag' | 'flag-to-capital' | 'type-name'

export type ModeId = 'classic' | 'reverse' | 'capitals' | 'expert' | 'time-attack' | 'survival' | 'daily' | 'review'

export type DifficultyFilter = 'all' | Difficulty

export interface ModeConfig {
  readonly id: ModeId
  readonly title: string
  readonly tagline: string
  readonly icon: string
  readonly questionType: QuestionType
  /** Number of questions, or null for endless. */
  readonly length: number | null
  readonly timeLimitSec: number | null
  readonly lives: number | null
  /** Whether continent and difficulty filters apply. */
  readonly usesFilters: boolean
  readonly gradient: string
}

export const MODES: Record<ModeId, ModeConfig> = {
  classic: {
    id: 'classic',
    title: 'Classic',
    tagline: '10 flags, pick the country',
    icon: '🏳️',
    questionType: 'flag-to-name',
    length: 10,
    timeLimitSec: null,
    lives: null,
    usesFilters: true,
    gradient: 'from-indigo-500 to-violet-600',
  },
  reverse: {
    id: 'reverse',
    title: 'Reverse',
    tagline: 'See a country, find its flag',
    icon: '🔄',
    questionType: 'name-to-flag',
    length: 10,
    timeLimitSec: null,
    lives: null,
    usesFilters: true,
    gradient: 'from-sky-500 to-cyan-600',
  },
  capitals: {
    id: 'capitals',
    title: 'Capitals',
    tagline: 'Match the flag to its capital',
    icon: '🏛️',
    questionType: 'flag-to-capital',
    length: 10,
    timeLimitSec: null,
    lives: null,
    usesFilters: true,
    gradient: 'from-amber-500 to-orange-600',
  },
  expert: {
    id: 'expert',
    title: 'Expert',
    tagline: 'No choices. Type the name. 1.5× points',
    icon: '⌨️',
    questionType: 'type-name',
    length: 10,
    timeLimitSec: null,
    lives: null,
    usesFilters: true,
    gradient: 'from-rose-500 to-pink-600',
  },
  'time-attack': {
    id: 'time-attack',
    title: 'Time Attack',
    tagline: '60 seconds. Wrong answers cost 3s',
    icon: '⏱️',
    questionType: 'flag-to-name',
    length: null,
    timeLimitSec: 60,
    lives: null,
    usesFilters: true,
    gradient: 'from-emerald-500 to-teal-600',
  },
  survival: {
    id: 'survival',
    title: 'Survival',
    tagline: '3 lives. Gets harder as you go',
    icon: '❤️',
    questionType: 'flag-to-name',
    length: null,
    timeLimitSec: null,
    lives: 3,
    usesFilters: true,
    gradient: 'from-red-500 to-rose-700',
  },
  daily: {
    id: 'daily',
    title: 'Daily Challenge',
    tagline: '10 flags, same for everyone, once a day',
    icon: '📅',
    questionType: 'flag-to-name',
    length: 10,
    timeLimitSec: null,
    lives: null,
    usesFilters: false,
    gradient: 'from-fuchsia-500 to-purple-700',
  },
  review: {
    id: 'review',
    title: 'Practice Weak Flags',
    tagline: 'Drill the flags you miss most',
    icon: '🎯',
    questionType: 'flag-to-name',
    length: 10,
    timeLimitSec: null,
    lives: null,
    usesFilters: false,
    gradient: 'from-slate-500 to-slate-700',
  },
}

export const PLAYABLE_MODES: readonly ModeId[] = ['classic', 'reverse', 'capitals', 'expert', 'time-attack', 'survival']

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard' }
