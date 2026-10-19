import { COUNTRIES, COUNTRY_BY_CODE, LOOKALIKES, type Continent, type Country } from '../data/countries'
import type { DifficultyFilter, QuestionType } from './modes'
import { hashString, mulberry32, shuffle, type Rng } from './random'

export interface Question {
  readonly id: number
  readonly country: Country
  readonly type: QuestionType
  /** Four choices including the answer. Empty for typed answers. */
  readonly options: readonly Country[]
}

export function buildPool(continents: readonly Continent[], difficulty: DifficultyFilter): Country[] {
  const set = new Set(continents)
  return COUNTRIES.filter((c) => set.has(c.continent) && (difficulty === 'all' || c.difficulty === difficulty))
}

function lookalikesOf(code: string): Country[] {
  const out: Country[] = []
  for (const group of LOOKALIKES) {
    if (!group.includes(code)) continue
    for (const other of group) {
      const c = COUNTRY_BY_CODE.get(other)
      if (c && other !== code) out.push(c)
    }
  }
  return out
}

function pickDistractors(country: Country, rng: Rng): Country[] {
  const chosen = new Map<string, Country>()
  const add = (list: readonly Country[], max: number) => {
    for (const c of shuffle(list, rng)) {
      if (chosen.size >= max) return
      if (c.code !== country.code && !chosen.has(c.code)) chosen.set(c.code, c)
    }
  }
  // Harder flags get sneakier wrong answers.
  const lookalikeCount = country.difficulty === 1 ? 1 : 2
  add(lookalikesOf(country.code), lookalikeCount)
  add(
    COUNTRIES.filter((c) => c.continent === country.continent),
    country.difficulty === 1 ? 2 : 3,
  )
  add(COUNTRIES, 3)
  return [...chosen.values()]
}

export function makeQuestion(id: number, country: Country, type: QuestionType, rng: Rng): Question {
  if (type === 'type-name') return { id, country, type, options: [] }
  let distractors = pickDistractors(country, rng)
  if (type === 'flag-to-capital') {
    // Two countries can share a capital name; keep options distinct.
    const seen = new Set([country.capital])
    distractors = distractors.filter((d) => !seen.has(d.capital) && seen.add(d.capital))
  }
  return { id, country, type, options: shuffle([country, ...distractors], rng) }
}

/** Order countries so endless modes start easy and get harder. */
function rampOrder(pool: readonly Country[], rng: Rng): Country[] {
  const shuffled = shuffle(pool, rng)
  const tiers = [1, 2, 3].map((d) => shuffled.filter((c) => c.difficulty === d))
  const out: Country[] = []
  // Interleave so each chunk of ~10 is a bit harder than the last.
  const chunk = 10
  const shares = [
    [7, 3, 0],
    [4, 4, 2],
    [2, 4, 4],
    [1, 3, 6],
  ]
  let round = 0
  while (tiers.some((t) => t.length > 0)) {
    const share = shares[Math.min(round, shares.length - 1)] ?? [1, 3, 6]
    let taken = 0
    share.forEach((n, i) => {
      const tier = tiers[i]
      for (let k = 0; k < n && tier && tier.length > 0; k++, taken++) out.push(tier.shift() as Country)
    })
    // Fill from whatever is left if a tier ran dry.
    for (const tier of tiers) while (taken < chunk && tier.length > 0) out.push(tier.shift() as Country), taken++
    round++
  }
  return out
}

export function buildQuestions(options: {
  readonly pool: readonly Country[]
  readonly type: QuestionType
  readonly length: number | null
  readonly ramp: boolean
  /** Repeat the pool this many times (for Time Attack on small pools). */
  readonly rounds?: number
  readonly rng?: Rng
}): Question[] {
  const rng = options.rng ?? Math.random
  const countries: Country[] = []
  for (let r = 0; r < (options.rounds ?? 1); r++) {
    countries.push(...(options.ramp ? rampOrder(options.pool, rng) : shuffle(options.pool, rng)))
  }
  const items = options.length === null ? countries : countries.slice(0, options.length)
  return items.map((c, i) => makeQuestion(i + 1, c, options.type, rng))
}

/** The day's 10 questions: same for everyone, easy to hard, mixed formats. */
export function buildDailyQuestions(day: string): Question[] {
  const rng = mulberry32(hashString(`flag-quiz-daily:${day}`))
  const tier = (d: number, n: number) =>
    shuffle(
      COUNTRIES.filter((c) => c.difficulty === d),
      rng,
    ).slice(0, n)
  const countries = [...tier(1, 3), ...tier(2, 4), ...tier(3, 3)]
  const types: QuestionType[] = [
    'flag-to-name',
    'flag-to-name',
    'name-to-flag',
    'flag-to-name',
    'flag-to-capital',
    'flag-to-name',
    'name-to-flag',
    'flag-to-name',
    'flag-to-name',
    'type-name',
  ]
  return countries.map((c, idx) => makeQuestion(idx + 1, c, types[idx] ?? 'flag-to-name', rng))
}

/** Flags you get wrong most often, worst first. */
export function weakFlags(stats: Readonly<Record<string, { seen: number; correct: number }>>): Country[] {
  return COUNTRIES.map((c) => ({ c, s: stats[c.code] }))
    .filter((x) => x.s !== undefined && x.s.correct < x.s.seen && x.s.correct / x.s.seen < 0.75)
    .sort((a, b) => (a.s?.correct ?? 0) / (a.s?.seen ?? 1) - (b.s?.correct ?? 0) / (b.s?.seen ?? 1))
    .map((x) => x.c)
}
