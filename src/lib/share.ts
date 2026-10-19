import { dailyNumber } from './dates'
import { MODES } from './modes'
import type { GameSummary } from './store'

export function summaryShareText(game: GameSummary): string {
  const grid = game.answers.map((a) => (a.correct ? '🟩' : '🟥')).join('')
  const title = game.mode === 'daily' ? `Flag Quiz Daily #${dailyNumber(game.day)}` : `Flag Quiz · ${MODES[game.mode].title}`
  const lines = [title, `${game.correct}/${game.total} · ${game.score.toLocaleString()} pts`]
  if (game.bestStreak >= 3) lines.push(`🔥 best streak ${game.bestStreak}`)
  // Long endless runs would make a huge grid.
  lines.push(grid.length > 40 ? `${[...grid].slice(0, 20).join('')}…` : grid)
  if (typeof location !== 'undefined') lines.push(location.origin)
  return lines.join('\n')
}

export async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) {
      await navigator.share({ text })
      return 'shared'
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'failed'
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
