export type SortKey = 'rating' | 'pop' | 'id' | 'moves' | 'plays'

export type PuzzleItem = {
  i: string
  r: number
  fen?: string
  pop?: number
  moves?: number
  plays?: number
}

export type ThemeMode = 'all' | 'any'

export type ViewMode = 'all' | 'pend'

export type ThemeChoice = 'light' | 'dark'

export type FilterPrefs = {
  themes: string[]
  extra: string
  mode: ThemeMode
  minMoves: string
  maxMoves: string
  minRating: string
  maxRating: string
  minPop: string
  maxPop: string
  limit: string
  random: boolean
  sort: SortKey
  order: 1 | -1
  skipDone: boolean
}

export type DailyProgress = {
  date: string
  goal: number
  ids: string[]
  streak: number
  lastMet: string | null
}

export type FilterOptions = {
  themes: string[]
  mode: ThemeMode
  minMoves: number
  maxMoves: number
  minRating: number
  maxRating: number
  minPop: number
  maxPop: number
  limit: number
  random: boolean
  sort: SortKey
  order: 1 | -1
  skipDone: boolean
  done: Set<string>
}

export type FilterProgress = {
  read: number
  total: number
  rows: number
  matches: number
}

export type FilterResult = {
  items: PuzzleItem[]
  rows: number
  matches: number
}

export const DEFAULT_FILTERS: FilterPrefs = {
  themes: ['fork'],
  extra: '',
  mode: 'all',
  minMoves: '1',
  maxMoves: '10',
  minRating: '0',
  maxRating: '4000',
  minPop: '-100',
  maxPop: '100',
  limit: '500',
  random: true,
  sort: 'rating',
  order: 1,
  skipDone: true,
}
