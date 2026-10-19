import { CONTINENTS, COUNTRIES, type Continent } from '../data/countries'
import { addDays } from './dates'
import type { AppState, GameSummary } from './store'

export interface Achievement {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly icon: string
  readonly check: (s: AppState, game: GameSummary) => boolean
}

const knownCodes = (s: AppState) => Object.entries(s.flagStats).filter(([, v]) => v.correct > 0)

export function dailyStreak(s: AppState, today: string): number {
  // A streak still counts if today's challenge isn't done yet.
  let day = s.daily[today] ? today : addDays(today, -1)
  let n = 0
  while (s.daily[day]) {
    n++
    day = addDays(day, -1)
  }
  return n
}

const continentMaster = (continent: Continent, icon: string): Achievement => ({
  id: `master-${continent.toLowerCase().replace(/\s/g, '-')}`,
  title: `${continent} Master`,
  description: `Correctly identify every flag in ${continent}`,
  icon,
  check: (s) => COUNTRIES.filter((c) => c.continent === continent).every((c) => (s.flagStats[c.code]?.correct ?? 0) > 0),
})

export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'first-game', title: 'First Steps', description: 'Finish your first quiz', icon: '👣', check: (s) => s.gamesPlayed >= 1 },
  {
    id: 'perfect',
    title: 'Flawless',
    description: 'Get a perfect 10/10 round',
    icon: '💎',
    check: (_, g) => g.total >= 10 && g.correct === g.total,
  },
  {
    id: 'perfect-hard',
    title: 'Vexillologist',
    description: 'Perfect round on Hard difficulty',
    icon: '🧠',
    check: (_, g) => g.difficulty === 3 && g.total >= 10 && g.correct === g.total,
  },
  {
    id: 'perfect-expert',
    title: 'Typing Titan',
    description: 'Perfect round in Expert mode',
    icon: '⌨️',
    check: (_, g) => g.mode === 'expert' && g.total >= 10 && g.correct === g.total,
  },
  { id: 'streak-10', title: 'On Fire', description: '10 correct answers in a row', icon: '🔥', check: (_, g) => g.bestStreak >= 10 },
  { id: 'streak-25', title: 'Unstoppable', description: '25 correct answers in a row', icon: '☄️', check: (_, g) => g.bestStreak >= 25 },
  {
    id: 'speed-20',
    title: 'Speed Demon',
    description: '20 correct in one Time Attack',
    icon: '⚡',
    check: (_, g) => g.mode === 'time-attack' && g.correct >= 20,
  },
  {
    id: 'survivor-30',
    title: 'Survivor',
    description: 'Reach 30 correct in Survival',
    icon: '🛡️',
    check: (_, g) => g.mode === 'survival' && g.correct >= 30,
  },
  {
    id: 'no-hints',
    title: 'No Help Needed',
    description: 'Perfect round without any hints',
    icon: '🙅',
    check: (_, g) => g.total >= 10 && g.correct === g.total && g.answers.every((a) => !a.hintUsed),
  },
  { id: 'daily-1', title: 'Daily Player', description: 'Complete a Daily Challenge', icon: '📅', check: (s) => Object.keys(s.daily).length >= 1 },
  {
    id: 'daily-7',
    title: 'Week Warrior',
    description: 'Daily Challenge streak of 7 days',
    icon: '🗓️',
    check: (s, g) => dailyStreak(s, g.day) >= 7,
  },
  {
    id: 'daily-30',
    title: 'Monthly Habit',
    description: 'Daily Challenge streak of 30 days',
    icon: '🏅',
    check: (s, g) => dailyStreak(s, g.day) >= 30,
  },
  { id: 'points-10k', title: 'Point Collector', description: 'Earn 10,000 total points', icon: '🪙', check: (s) => s.totalPoints >= 10_000 },
  { id: 'points-100k', title: 'Point Hoarder', description: 'Earn 100,000 total points', icon: '💰', check: (s) => s.totalPoints >= 100_000 },
  {
    id: 'globetrotter',
    title: 'Globetrotter',
    description: 'Know at least one flag from every continent',
    icon: '🌍',
    check: (s) => CONTINENTS.every((cont) => COUNTRIES.some((c) => c.continent === cont && (s.flagStats[c.code]?.correct ?? 0) > 0)),
  },
  { id: 'known-50', title: 'Flag Fan', description: 'Correctly identify 50 different flags', icon: '🚩', check: (s) => knownCodes(s).length >= 50 },
  {
    id: 'known-all',
    title: 'Encyclopedia',
    description: `Correctly identify all ${COUNTRIES.length} flags`,
    icon: '📚',
    check: (s) => COUNTRIES.every((c) => (s.flagStats[c.code]?.correct ?? 0) > 0),
  },
  continentMaster('Europe', '🏰'),
  continentMaster('Asia', '🏯'),
  continentMaster('Africa', '🦁'),
  continentMaster('North America', '🗽'),
  continentMaster('South America', '🦜'),
  continentMaster('Oceania', '🏝️'),
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Finish a quiz between midnight and 4 a.m.',
    icon: '🦉',
    check: (_, g) => new Date(g.playedAt).getHours() < 4,
  },
]

export function newlyUnlocked(s: AppState, game: GameSummary): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !s.achievements[a.id] && a.check(s, game))
}
