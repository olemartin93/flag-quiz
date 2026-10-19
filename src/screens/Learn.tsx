import { useMemo, useState } from 'react'
import { Flag } from '../components/Flag'
import { Modal, Stat } from '../components/ui'
import { CONTINENTS, COUNTRIES, type Continent, type Country } from '../data/countries'
import { normalize } from '../lib/match'
import { DIFFICULTY_LABEL } from '../lib/modes'
import { BASE_POINTS } from '../lib/scoring'
import { useAppState, type FlagStat } from '../lib/store'

type Mastery = 'new' | 'learning' | 'known' | 'mastered'

function mastery(stat: FlagStat | undefined): Mastery {
  if (!stat || stat.seen === 0) return 'new'
  const ratio = stat.correct / stat.seen
  if (stat.correct >= 3 && ratio >= 0.8) return 'mastered'
  if (stat.correct >= 1 && ratio >= 0.5) return 'known'
  return 'learning'
}

const MASTERY_DOT: Record<Mastery, string> = {
  new: 'bg-slate-300 dark:bg-slate-600',
  learning: 'bg-rose-500',
  known: 'bg-amber-400',
  mastered: 'bg-emerald-500',
}

const MASTERY_LABEL: Record<Mastery, string> = { new: 'Not seen', learning: 'Learning', known: 'Known', mastered: 'Mastered' }

export function Learn() {
  const flagStats = useAppState((s) => s.flagStats)
  const [query, setQuery] = useState('')
  const [continent, setContinent] = useState<Continent | 'all'>('all')
  const [selected, setSelected] = useState<Country | null>(null)

  const list = useMemo(() => {
    const q = normalize(query)
    return COUNTRIES.filter(
      (c) =>
        (continent === 'all' || c.continent === continent) &&
        (!q || normalize(c.name).includes(q) || normalize(c.capital).includes(q) || (c.aliases ?? []).some((a) => normalize(a).includes(q))),
    )
  }, [query, continent])

  const masteredCount = COUNTRIES.filter((c) => mastery(flagStats[c.code]) === 'mastered').length

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-black">Flag Atlas</h1>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {masteredCount}/{COUNTRIES.length} mastered
        </span>
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search country or capital…"
        className="w-full rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:ring-slate-800"
      />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {(['all', ...CONTINENTS] as const).map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setContinent(c)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${
              continent === c
                ? 'bg-indigo-600 text-white ring-indigo-600'
                : 'bg-white text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'
            }`}
          >
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>
      <div className="flex gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        {(Object.keys(MASTERY_DOT) as Mastery[]).map((m) => (
          <span key={m} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${MASTERY_DOT[m]}`} /> {MASTERY_LABEL[m]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {list.map((c) => (
          <button type="button" key={c.code} onClick={() => setSelected(c)} className="text-left transition active:scale-95">
            <div className="relative">
              <Flag code={c.code} alt={c.name} lazy />
              <span className={`absolute top-1 right-1 h-2.5 w-2.5 rounded-full ring-2 ring-white ${MASTERY_DOT[mastery(flagStats[c.code])]}`} />
            </div>
            <div className="mt-1 truncate text-xs font-semibold">{c.name}</div>
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="py-8 text-center text-slate-500">No countries match “{query}”.</p>}

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <Flag code={selected.code} alt={selected.name} className="rounded-xl" />
          <h2 className="mt-4 text-2xl font-black">{selected.name}</h2>
          {selected.aliases && <p className="text-xs text-slate-500 dark:text-slate-400">Also: {selected.aliases.join(', ')}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Capital" icon="🏛️" value={<span className="text-base">{selected.capital}</span>} />
            <Stat label="Continent" icon="🌐" value={<span className="text-base">{selected.continent}</span>} />
            <Stat
              label="Difficulty"
              icon="🎚️"
              value={
                <span className="text-base">
                  {DIFFICULTY_LABEL[selected.difficulty]} · {BASE_POINTS[selected.difficulty]} pts
                </span>
              }
            />
            <Stat
              label="Your record"
              icon="📊"
              value={
                <span className="text-base">
                  {flagStats[selected.code]
                    ? `${flagStats[selected.code]?.correct ?? 0}/${flagStats[selected.code]?.seen ?? 0} · ${MASTERY_LABEL[mastery(flagStats[selected.code])]}`
                    : 'Not seen yet'}
                </span>
              }
            />
          </div>
          <button type="button" onClick={() => setSelected(null)} className="mt-4 w-full rounded-xl bg-indigo-600 py-3 font-bold text-white">
            Close
          </button>
        </Modal>
      )}
    </div>
  )
}
