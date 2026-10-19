import { COUNTRIES, type Country } from '../data/countries'

export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\bst\.?\s/g, 'saint ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/^the\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost)
    }
    prev = cur
  }
  return prev[b.length] ?? Math.max(a.length, b.length)
}

/** Accepts the name or an alias, forgiving small typos. */
export function isNameMatch(guess: string, country: Country): boolean {
  const g = normalize(guess)
  if (!g) return false
  const namesOf = (c: Country) => [c.name, ...(c.aliases ?? [])].map(normalize)
  const targets = namesOf(country)
  if (targets.includes(g)) return true
  // "Zambia" is one letter from "Gambia" but is a different country, so typo
  // tolerance must never accept another country's exact name.
  if (COUNTRIES.some((c) => c.code !== country.code && namesOf(c).includes(g))) return false
  return targets.some((t) => {
    if (t === g) return true
    const allowed = t.length >= 10 ? 2 : t.length >= 5 ? 1 : 0
    return levenshtein(g, t) <= allowed
  })
}
