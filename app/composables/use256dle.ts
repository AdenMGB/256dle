import allWords from '~/data/five-letter-words.json'
import { getLocalDateKey, mulberry32, scoreGuess, shuffle, type Tile } from '~/utils/wordle'

const BOARDS = 256
/** Match 64ordle-style ratio: 70 guesses for 64 words → 280 for 256. */
export const MAX_GUESSES = 280

const wordList = (allWords as string[]).filter(
  w => w.length === 5 && /^[a-z]+$/i.test(w),
).map(w => w.toLowerCase())
const validSet = new Set(wordList)

function pickTargets (seed: number): string[] {
  const random = mulberry32(seed)
  const shuffled = shuffle(wordList, () => random())
  return shuffled.slice(0, BOARDS)
}

function storageKey (dateKey: string) {
  return `256dle-guesses-${dateKey}`
}

export function use256dle () {
  const { key: dateKey, seed } = getLocalDateKey()
  const targets = ref(pickTargets(seed))
  const guesses = ref<string[]>([])

  const feedbackMatrix = computed(() => {
    const t = targets.value
    const g = guesses.value
    const rows: Tile[][][] = g.map(gg =>
      t.map(tw => scoreGuess(gg, tw)),
    )
    return rows
  })

  const solved = computed(() =>
    targets.value.map((target) =>
      guesses.value.some(gu => gu === target),
    ),
  )

  const solvedCount = computed(() => solved.value.filter(Boolean).length)

  function isAllSolved () {
    return solvedCount.value === BOARDS
  }

  const canGuess = computed(
    () => guesses.value.length < MAX_GUESSES && !isAllSolved(),
  )

  const status = computed<'playing' | 'won' | 'lost'>(() => {
    if (solvedCount.value === BOARDS) { return 'won' }
    if (guesses.value.length >= MAX_GUESSES) { return 'lost' }
    return 'playing'
  })

  if (import.meta.client) {
    onMounted(() => {
      const raw = localStorage.getItem(storageKey(dateKey))
      if (raw) {
        try {
          const list = JSON.parse(raw) as string[]
          if (Array.isArray(list) && list.every(x => typeof x === 'string')) {
            guesses.value = list
          }
        } catch { /* empty */ }
      }
    })
    watch(
      guesses,
      (g) => {
        if (g.length) {
          localStorage.setItem(storageKey(dateKey), JSON.stringify(g))
        } else {
          localStorage.removeItem(storageKey(dateKey))
        }
      },
      { deep: true },
    )
  }

  function submitGuess (raw: string) {
    if (!canGuess.value) {
      return
    }
    const word = raw.toLowerCase().trim()
    if (word.length !== 5) {
      return
    }
    if (!/^[a-z]{5}$/.test(word) || !validSet.has(word)) {
      return { error: 'Not in word list' as const }
    }
    if (guesses.value.includes(word)) {
      return { error: 'Already guessed' as const }
    }
    guesses.value = [...guesses.value, word]
    return { ok: true as const }
  }

  function reset () {
    guesses.value = []
    if (import.meta.client) {
      localStorage.removeItem(storageKey(dateKey))
    }
  }

  return {
    dateKey,
    BOARDS,
    MAX_GUESSES,
    targets,
    guesses,
    feedbackMatrix,
    solved,
    solvedCount,
    canGuess,
    status,
    submitGuess,
    reset,
  }
}
