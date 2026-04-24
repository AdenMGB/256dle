export type Tile = 'absent' | 'present' | 'correct'

/** Wordle-style feedback for a 5-letter guess against the target. */
export function scoreGuess (guess: string, target: string): Tile[] {
  const g = guess.toLowerCase()
  const t = target.toLowerCase()
  const res: Tile[] = Array(5)
  const counts: Record<string, number> = {}

  for (let i = 0; i < 5; i++) {
    const c = t[i]!
    counts[c] = (counts[c] ?? 0) + 1
  }

  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      res[i] = 'correct'
      counts[g[i]!]! -= 1
    }
  }

  for (let i = 0; i < 5; i++) {
    if (res[i] === 'correct') {
      continue
    }
    const c = g[i]!
    if (counts[c]! > 0) {
      res[i] = 'present'
      counts[c]! -= 1
    } else {
      res[i] = 'absent'
    }
  }

  return res
}

export function mulberry32 (seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function shuffle<T> (arr: T[], random: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** YYYYMMDD in local time as a numeric seed. */
export function getLocalDateKey (): { key: string, seed: number } {
  const d = new Date()
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const key = `${y}${String(m).padStart(2, '0')}${String(day).padStart(2, '0')}`
  return { key, seed: parseInt(key, 10) }
}
