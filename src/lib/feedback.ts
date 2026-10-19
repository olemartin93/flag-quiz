import { getState } from './store'

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', gain = 0.15): void {
  const ac = audio()
  if (!ac) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t = ac.currentTime + start
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(g).connect(ac.destination)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

export type Sound = 'correct' | 'wrong' | 'finish' | 'unlock' | 'tick'

export function play(sound: Sound): void {
  const { settings } = getState()
  if (settings.sound) {
    switch (sound) {
      case 'correct':
        tone(660, 0, 0.12)
        tone(990, 0.08, 0.18)
        break
      case 'wrong':
        tone(180, 0, 0.25, 'sawtooth', 0.08)
        break
      case 'finish':
        ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25))
        break
      case 'unlock':
        ;[784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.2, 'triangle'))
        break
      case 'tick':
        tone(1200, 0, 0.04, 'square', 0.04)
        break
    }
  }
  if (settings.haptics && 'vibrate' in navigator) {
    const pattern: Record<Sound, number | number[]> = {
      correct: 15,
      wrong: [40, 40, 40],
      finish: [20, 30, 20],
      unlock: [10, 20, 10, 20, 30],
      tick: 0,
    }
    const p = pattern[sound]
    if (p) navigator.vibrate(p)
  }
}
