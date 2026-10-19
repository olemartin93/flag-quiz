import { useEffect, useState } from 'react'
import { UpdatePrompt } from './components/PwaPrompts'
import { useAppState } from './lib/store'
import type { QuizResult, QuizSetup } from './lib/useQuiz'
import { Awards } from './screens/Awards'
import { Home } from './screens/Home'
import { Learn } from './screens/Learn'
import { Quiz } from './screens/Quiz'
import { Results } from './screens/Results'
import { Settings } from './screens/Settings'
import { Stats } from './screens/Stats'

type Tab = 'play' | 'learn' | 'stats' | 'awards' | 'settings'

type Screen =
  | { readonly name: 'tab'; readonly tab: Tab }
  | { readonly name: 'quiz'; readonly setup: QuizSetup; readonly run: number }
  | { readonly name: 'results'; readonly setup: QuizSetup; readonly result: QuizResult }

const TABS: readonly { id: Tab; label: string; icon: string }[] = [
  { id: 'play', label: 'Play', icon: '🎮' },
  { id: 'learn', label: 'Atlas', icon: '🗺️' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'awards', label: 'Awards', icon: '🏅' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

function useTheme() {
  const theme = useAppState((s) => s.settings.theme)
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#020617' : '#4f46e5')
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}

export default function App() {
  useTheme()
  const [screen, setScreen] = useState<Screen>({ name: 'tab', tab: 'play' })

  useEffect(() => window.scrollTo({ top: 0 }), [screen.name, screen.name === 'tab' ? screen.tab : null])

  const start = (setup: QuizSetup) => setScreen({ name: 'quiz', setup, run: Date.now() })
  const home = () => setScreen({ name: 'tab', tab: 'play' })

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4">
      <UpdatePrompt />
      {screen.name === 'quiz' ? (
        <Quiz
          key={screen.run}
          setup={screen.setup}
          onFinish={(result) => (result.summary.total === 0 ? home() : setScreen({ name: 'results', setup: screen.setup, result }))}
        />
      ) : screen.name === 'results' ? (
        <Results
          result={screen.result}
          onHome={home}
          onPlayAgain={screen.setup.mode === 'daily' || screen.setup.mode === 'review' ? null : () => start(screen.setup)}
        />
      ) : (
        <>
          <main className="pt-[max(0.75rem,env(safe-area-inset-top))] pb-28">
            {screen.tab === 'play' && <Home onStart={start} />}
            {screen.tab === 'learn' && <Learn />}
            {screen.tab === 'stats' && <Stats />}
            {screen.tab === 'awards' && <Awards />}
            {screen.tab === 'settings' && <Settings />}
          </main>
          <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
            <div className="mx-auto grid max-w-md grid-cols-5">
              {TABS.map((t) => {
                const active = screen.tab === t.id
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setScreen({ name: 'tab', tab: t.id })}
                    aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                      active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span className={`text-xl transition-transform ${active ? 'scale-110' : 'grayscale-[60%]'}`}>{t.icon}</span>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </nav>
        </>
      )}
    </div>
  )
}

