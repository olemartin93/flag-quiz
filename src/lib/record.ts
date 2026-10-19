import { newlyUnlocked, type Achievement } from './achievements'
import { getState, setState, type AppState, type FlagStat, type GameSummary } from './store'

export interface RecordResult {
  readonly unlocked: readonly Achievement[]
  readonly isHighScore: boolean
  readonly previousBest: number
}

export function recordGame(game: GameSummary): RecordResult {
  const before = getState()
  const previousBest = before.highScores[game.mode] ?? 0
  const isHighScore = game.score > previousBest && game.score > 0

  const flagStats: Record<string, FlagStat> = { ...before.flagStats }
  for (const a of game.answers) {
    const prev = flagStats[a.code] ?? { seen: 0, correct: 0, lastSeen: 0 }
    flagStats[a.code] = { seen: prev.seen + 1, correct: prev.correct + (a.correct ? 1 : 0), lastSeen: game.playedAt }
  }

  const next: AppState = {
    ...before,
    totalPoints: before.totalPoints + game.score,
    gamesPlayed: before.gamesPlayed + 1,
    totalCorrect: before.totalCorrect + game.correct,
    totalAnswered: before.totalAnswered + game.answers.length,
    bestStreak: Math.max(before.bestStreak, game.bestStreak),
    highScores: isHighScore ? { ...before.highScores, [game.mode]: game.score } : before.highScores,
    flagStats,
    daily: game.mode === 'daily' && !before.daily[game.day] ? { ...before.daily, [game.day]: game } : before.daily,
    history: [game, ...before.history].slice(0, 50),
  }

  const unlocked = newlyUnlocked(next, game)
  const achievements = { ...next.achievements }
  for (const a of unlocked) achievements[a.id] = game.playedAt

  setState(() => ({ ...next, achievements }))
  return { unlocked, isHighScore, previousBest }
}
