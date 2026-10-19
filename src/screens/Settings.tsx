import { useState } from 'react'
import { useInstallPrompt } from '../components/PwaPrompts'
import { Card, Modal, SectionTitle, Toggle } from '../components/ui'
import { COUNTRIES } from '../data/countries'
import { exportProgress, importProgress, resetProgress, updateSettings, useAppState, type Theme } from '../lib/store'

const THEMES: readonly { id: Theme; label: string }[] = [
  { id: 'system', label: '⚙️ Auto' },
  { id: 'light', label: '☀️ Light' },
  { id: 'dark', label: '🌙 Dark' },
]

export function Settings() {
  const settings = useAppState((s) => s.settings)
  const { canInstall, installed, install } = useInstallPrompt()
  const [confirmReset, setConfirmReset] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const flash = (text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage(null), 2500)
  }

  const doExport = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flag-quiz-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const doImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      void file.text().then((text) => flash(importProgress(text) ? '✅ Progress restored' : '❌ That file is not a Flag Quiz backup'))
    }
    input.click()
  }

  return (
    <div className="space-y-3 pt-2">
      <h1 className="text-2xl font-black">Settings</h1>

      {(canInstall || installed) && (
        <Card className="flex items-center gap-3">
          <span className="text-3xl">📲</span>
          <div className="flex-1">
            <div className="font-bold">{installed ? 'Installed' : 'Install Flag Quiz'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {installed ? 'Running as an app. Works offline.' : 'Add to your home screen and play offline.'}
            </div>
          </div>
          {canInstall && (
            <button type="button" onClick={() => void install()} className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white">
              Install
            </button>
          )}
        </Card>
      )}

      <SectionTitle>Feedback</SectionTitle>
      <Card className="py-2">
        <Toggle label="🔊 Sound effects" checked={settings.sound} onChange={(sound) => updateSettings({ sound })} />
        <Toggle label="📳 Vibration" checked={settings.haptics} onChange={(haptics) => updateSettings({ haptics })} />
      </Card>

      <SectionTitle>Appearance</SectionTitle>
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200 p-1 dark:bg-slate-800">
        {THEMES.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => updateSettings({ theme: t.id })}
            className={`rounded-xl py-2 text-sm font-bold ${settings.theme === t.id ? 'bg-white shadow dark:bg-slate-950' : 'text-slate-600 dark:text-slate-400'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <SectionTitle>Progress</SectionTitle>
      <Card className="space-y-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">Progress is stored on this device. Back it up to move it to another device.</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={doExport} className="rounded-xl bg-slate-100 py-2.5 font-bold dark:bg-slate-800">
            ⬇️ Export
          </button>
          <button type="button" onClick={doImport} className="rounded-xl bg-slate-100 py-2.5 font-bold dark:bg-slate-800">
            ⬆️ Import
          </button>
        </div>
        <button type="button" onClick={() => setConfirmReset(true)} className="w-full rounded-xl py-2.5 font-bold text-rose-600 ring-1 ring-rose-200 dark:ring-rose-900">
          Reset all progress
        </button>
        {message && <p className="text-center text-sm font-semibold">{message}</p>}
      </Card>

      <SectionTitle>About</SectionTitle>
      <Card className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
        <p>
          <b>Flag Quiz</b> covers {COUNTRIES.length} countries. Easy flags are worth 100 points, medium 200, hard 300. Fast
          answers earn up to +50%, streaks multiply up to 2×, Capitals pays 1.25× and Expert 1.5×. Hints halve the points.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Flag images from the open-source flag-icons project (MIT).</p>
      </Card>

      {confirmReset && (
        <Modal onClose={() => setConfirmReset(false)}>
          <h3 className="text-lg font-extrabold">Reset everything?</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Points, stats, daily streak and achievements will be deleted. This can't be undone.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" className="rounded-xl bg-slate-200 py-3 font-bold dark:bg-slate-800" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded-xl bg-rose-600 py-3 font-bold text-white"
              onClick={() => {
                resetProgress()
                setConfirmReset(false)
                flash('Progress reset')
              }}
            >
              Reset
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
