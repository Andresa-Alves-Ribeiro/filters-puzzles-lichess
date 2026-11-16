export type PuzzleItem = {
  i: string
  r: number
}

export type ThemeMode = 'all' | 'any'

export type ViewMode = 'all' | 'pend'

export type FilterOptions = {
  themes: string[]
  mode: ThemeMode
  minMoves: number
  maxMoves: number
  minRating: number
  maxRating: number
  limit: number
  random: boolean
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
