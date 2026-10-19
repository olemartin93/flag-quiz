import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Check for a new version every hour while the app is open.
      if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000)
    },
  })

  useEffect(() => {
    if (!offlineReady) return
    const t = window.setTimeout(() => setOfflineReady(false), 4000)
    return () => window.clearTimeout(t)
  }, [offlineReady, setOfflineReady])

  if (!needRefresh && !offlineReady) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex w-full max-w-md animate-slide-up items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-white dark:text-slate-900">
        <span className="flex-1">{needRefresh ? '✨ A new version is available.' : '✅ Ready to play offline.'}</span>
        {needRefresh && (
          <button
            type="button"
            className="rounded-lg bg-indigo-500 px-3 py-1.5 font-bold text-white"
            onClick={() => void updateServiceWorker(true)}
          >
            Update
          </button>
        )}
        <button
          type="button"
          aria-label="Dismiss"
          className="px-1 opacity-70"
          onClick={() => {
            setNeedRefresh(false)
            setOfflineReady(false)
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setEvent(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!event) return
    await event.prompt()
    await event.userChoice
    setEvent(null)
  }

  return { canInstall: event !== null && !installed, installed, install }
}
