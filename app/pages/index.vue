<script setup lang="ts">
import type { Tile } from '~/utils/wordle'

const {
  dateKey,
  BOARDS,
  MAX_GUESSES,
  guesses,
  feedbackMatrix,
  solved,
  solvedCount,
  canGuess,
  status,
  submitGuess,
  reset,
} = use256dle()

const input = ref('')

const boardRange = Array.from({ length: BOARDS }, (_, i) => i)

watch(input, (v) => {
  const next = v
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, 5)
  if (v !== next) { input.value = next }
})

const formError = ref('')

function tileClass (t: Tile) {
  if (t === 'correct') { return 'bg-green-500 text-white dark:bg-green-600' }
  if (t === 'present') { return 'bg-amber-400 text-neutral-900 dark:bg-amber-500 dark:text-white' }
  return 'bg-neutral-500 text-white dark:bg-neutral-600'
}

function onSubmit () {
  formError.value = ''
  if (input.value.length !== 5) {
    formError.value = 'Enter a 5-letter word.'
    return
  }
  const r = submitGuess(input.value)
  if (r && 'error' in r) {
    formError.value
      = r.error === 'Not in word list'
        ? 'Not in word list.'
        : 'You already used that word.'
    return
  }
  if (r && 'ok' in r) {
    input.value = ''
  }
}

function letterAt (rowIdx: number, col: number) {
  const w = guesses.value[rowIdx]
  if (!w) { return '' }
  return w[col] ?? ''
}
</script>

<template>
  <div class="h-dvh flex min-h-0 w-full max-w-full flex-col overflow-hidden">
    <UHeader
      :toggle="false"
      to="/"
      title="256dle"
      class="shrink-0"
    >
      <template #left>
        <NuxtLink
          to="/"
          class="text-lg sm:text-xl font-semibold text-highlighted"
        >
          256dle
        </NuxtLink>
      </template>
      <template #right>
        <UColorModeButton class="transition-colors duration-200" />
      </template>
    </UHeader>

    <UMain class="min-h-0 flex flex-1 flex-col">
      <div
        class="mx-auto box-border flex w-full min-h-0 max-w-full flex-1 flex-col overflow-hidden px-1 py-1 sm:px-2 sm:py-2"
      >
        <div
          class="shrink-0 space-y-2 pb-2 sm:space-y-3 sm:pb-3"
        >
          <div class="space-y-0.5 sm:space-y-1">
            <h1 class="text-lg font-bold text-highlighted sm:text-2xl">
              Ducenti-quinquaginta-sexordle
            </h1>
            <p class="line-clamp-2 text-dimmed text-xs leading-normal sm:line-clamp-none sm:text-sm">
              Solve 256 Wordles at once. You have {{ MAX_GUESSES }} guesses (local
              date {{ dateKey }}). One guess row applies to every board; scroll inside
              a board to see your history.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
            <UBadge
              color="primary"
              variant="subtle"
              class="transition-colors duration-200"
            >
              {{ solvedCount }} / {{ BOARDS }} found
            </UBadge>
            <UBadge
              v-if="status === 'playing'"
              color="neutral"
              variant="subtle"
              class="transition-colors duration-200"
            >
              Guesses: {{ guesses.length }} / {{ MAX_GUESSES }}
            </UBadge>
            <UBadge
              v-else-if="status === 'won'"
              color="success"
              variant="subtle"
              class="transition-colors duration-200"
            >
              Solved
            </UBadge>
            <UBadge
              v-else
              color="error"
              variant="subtle"
              class="transition-colors duration-200"
            >
              No guesses left
            </UBadge>
          </div>

          <UProgress
            :model-value="guesses.length"
            :max="MAX_GUESSES"
            class="h-1.5 w-full max-w-full sm:max-w-md"
            :color="status === 'lost' ? 'error' : 'primary'"
          />

          <UCard
            v-if="status === 'playing' || guesses.length"
            :ui="{ body: { padding: 'p-2 sm:p-3' } }"
          >
            <form
              class="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3"
              @submit.prevent="onSubmit"
            >
              <UFormField
                :label="status === 'playing' ? 'Your guess' : 'Puzzle (resets at midnight local time)'"
                :error="formError"
                class="w-full"
              >
                <UInput
                  v-model="input"
                  size="md"
                  maxlength="5"
                  placeholder="5 letters"
                  :disabled="!canGuess"
                  class="w-full"
                  :ui="{
                    base: 'font-mono uppercase tracking-widest',
                  }"
                  @keydown.enter.prevent="onSubmit"
                />
              </UFormField>
              <div class="flex shrink-0 items-center gap-2">
                <UButton
                  type="submit"
                  color="primary"
                  :disabled="!canGuess"
                  class="h-9 transition-all duration-200 px-4 py-2 rounded-lg"
                >
                  Enter
                </UButton>
                <UButton
                  type="button"
                  color="neutral"
                  variant="outline"
                  class="h-9 transition-all duration-200"
                  @click="reset"
                >
                  Clear
                </UButton>
              </div>
            </form>
          </UCard>

          <UAlert
            v-if="status === 'won' || status === 'lost'"
            :color="status === 'won' ? 'success' : 'error'"
            variant="subtle"
            :title="status === 'won' ? 'You found all 256 words' : 'Out of guesses'"
            class="w-full"
          />
        </div>

        <div
          class="min-h-0 w-full min-w-0 flex-1"
        >
          <div
            class="grid h-full w-full min-h-0 min-w-0 gap-0.5 sm:gap-1"
            :style="{
              gridTemplateColumns: 'repeat(16, minmax(0, 1fr))',
              gridTemplateRows: 'repeat(16, minmax(0, 1fr))',
            }"
          >
            <div
              v-for="i in boardRange"
              :key="i"
              class="sub-board h-full min-h-0 w-full min-w-0"
              :class="[
                'flex min-h-0 min-w-0 flex-col overflow-hidden rounded border border-default/40 bg-elevated/30 transition-colors duration-200',
                solved[i] ? 'ring-1 ring-success-500/50' : '',
              ]"
            >
              <div
                class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-0.5 [scrollbar-gutter:stable] sm:p-1"
              >
                <div
                  v-for="(row, rowIdx) in feedbackMatrix"
                  :key="rowIdx"
                  class="mb-0.5 grid w-full min-w-0 max-w-full grid-cols-5 gap-px last:mb-0"
                >
                  <div
                    v-for="(tile, tIdx) in row[i]!"
                    :key="tIdx"
                    :class="[
                      'cell-letter flex min-h-0 min-w-0 items-center justify-center rounded-sm font-mono font-bold uppercase',
                      'leading-none',
                      'transition-colors duration-200',
                      'aspect-square',
                      tileClass(tile),
                    ]"
                  >
                    <span
                      class="select-none leading-none text-inherit [font-size:var(--le)]"
                    >
                      {{ letterAt(rowIdx, tIdx) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UMain>
  </div>
</template>

<style scoped>
.sub-board {
  container-type: size;
}

/* Letters scale with the mini-board width (1/16 of the grid) and viewport, clamped. */
.cell-letter {
  --le: clamp(0.18rem, 0.1rem + 0.3vmin + 4cqi, 0.6rem);
}

@media (min-width: 640px) {
  .cell-letter {
    --le: clamp(0.2rem, 0.1rem + 0.4vmin + 4.5cqi, 0.68rem);
  }
}

@media (min-width: 1024px) {
  .cell-letter {
    --le: clamp(0.24rem, 0.1rem + 0.5vmin + 4.8cqi, 0.8rem);
  }
}
</style>
