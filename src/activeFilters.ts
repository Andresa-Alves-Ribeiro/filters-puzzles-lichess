import { themeLabel } from './themes.ts'
import { DEFAULT_FILTERS, type FilterPrefs } from './types.ts'

export type ActiveChip = {
  id: string
  label: string
  patch: Partial<FilterPrefs>
}

export const QUICK_FILTERS = [
  { key: 'fork', label: 'Garfo' },
  { key: 'pin', label: 'Cravada' },
  { key: 'mateIn2', label: 'Mate em 2' },
] as const

function tokens(extra: string): string[] {
  return extra.trim().split(/\s+/).filter(Boolean)
}

export function activeChips(filters: FilterPrefs): ActiveChip[] {
  const chips: ActiveChip[] = []
  for (const key of filters.themes) {
    chips.push({
      id: `theme:${key}`,
      label: themeLabel(key),
      patch: { themes: filters.themes.filter((theme) => theme !== key) },
    })
  }
  const extra = tokens(filters.extra)
  extra.forEach((token, index) => {
    chips.push({
      id: `extra:${index}:${token}`,
      label: token,
      patch: { extra: extra.filter((_, item) => item !== index).join(' ') },
    })
  })
  if (filters.minMoves !== DEFAULT_FILTERS.minMoves || filters.maxMoves !== DEFAULT_FILTERS.maxMoves) {
    chips.push({
      id: 'moves',
      label: `Lances ${filters.minMoves}–${filters.maxMoves}`,
      patch: { minMoves: DEFAULT_FILTERS.minMoves, maxMoves: DEFAULT_FILTERS.maxMoves },
    })
  }
  if (filters.minRating !== DEFAULT_FILTERS.minRating || filters.maxRating !== DEFAULT_FILTERS.maxRating) {
    chips.push({
      id: 'rating',
      label: `Rating ${filters.minRating}–${filters.maxRating}`,
      patch: { minRating: DEFAULT_FILTERS.minRating, maxRating: DEFAULT_FILTERS.maxRating },
    })
  }
  if (filters.minPop !== DEFAULT_FILTERS.minPop || filters.maxPop !== DEFAULT_FILTERS.maxPop) {
    chips.push({
      id: 'pop',
      label: `Pop. ${filters.minPop}–${filters.maxPop}`,
      patch: { minPop: DEFAULT_FILTERS.minPop, maxPop: DEFAULT_FILTERS.maxPop },
    })
  }
  if (filters.mode === 'any') {
    chips.push({ id: 'mode', label: 'Qualquer tema', patch: { mode: 'all' } })
  }
  if (!filters.skipDone) {
    chips.push({ id: 'skip', label: 'Inclui feitos', patch: { skipDone: true } })
  }
  return chips
}

export function sameQuery(a: FilterPrefs, b: FilterPrefs): boolean {
  return (
    a.themes.join('\0') === b.themes.join('\0') &&
    a.extra === b.extra &&
    a.mode === b.mode &&
    a.minMoves === b.minMoves &&
    a.maxMoves === b.maxMoves &&
    a.minRating === b.minRating &&
    a.maxRating === b.maxRating &&
    a.minPop === b.minPop &&
    a.maxPop === b.maxPop &&
    a.limit === b.limit &&
    a.random === b.random &&
    a.skipDone === b.skipDone
  )
}

export function sameSort(a: FilterPrefs, b: FilterPrefs): boolean {
  return a.sort === b.sort && a.order === b.order
}
