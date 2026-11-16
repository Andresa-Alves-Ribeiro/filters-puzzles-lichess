import {
  DEFAULT_FILTERS,
  type DailyProgress,
  type FilterPrefs,
  type PuzzleItem,
  type SortKey,
  type ThemeChoice,
} from './types.ts'

const FEITOS_KEY = 'pl_feitos'
const LISTA_KEY = 'pl_lista'
const FILTERS_KEY = 'pl_filtros'
const DAILY_KEY = 'pl_dia'
const THEME_KEY = 'pl_tema'

type StoredList = {
  v?: number
  items?: string | PuzzleItem[]
  info?: string
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function todayKey(): string {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function shiftDay(key: string, delta: number): string {
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(year, (month ?? 1) - 1, day ?? 1)
  date.setDate(date.getDate() + delta)
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0')
  const nextDay = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${nextMonth}-${nextDay}`
}

function dayKey(value: unknown): string | null {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function rollDaily(stored: Partial<DailyProgress> | null, today: string): DailyProgress {
  const goal = typeof stored?.goal === 'number' ? Math.min(100, Math.max(1, stored.goal)) : 5
  const storedIds = Array.isArray(stored?.ids) ? stored.ids.filter((id) => typeof id === 'string') : []
  let lastMet = dayKey(stored?.lastMet)
  let streak = typeof stored?.streak === 'number' && stored.streak > 0 ? Math.floor(stored.streak) : 0
  const storedDate = dayKey(stored?.date)
  if (!lastMet && storedDate && storedIds.length >= goal) {
    lastMet = storedDate
    if (streak === 0) streak = 1
  }
  if (storedDate === today) return { date: today, goal, ids: storedIds, streak, lastMet }
  if (lastMet !== shiftDay(today, -1)) streak = 0
  return { date: today, goal, ids: [], streak, lastMet }
}

export function advanceDaily(prev: DailyProgress, ids: string[], goal = prev.goal): DailyProgress {
  const today = todayKey()
  const base = prev.date === today ? prev : rollDaily(prev, today)
  const nextGoal = Math.min(100, Math.max(1, goal || 1))
  const next: DailyProgress = { ...base, goal: nextGoal, ids }
  if (ids.length < nextGoal || next.lastMet === today) return next
  const continued = next.lastMet === shiftDay(today, -1)
  return { ...next, streak: continued ? next.streak + 1 : 1, lastMet: today }
}

function unpack(s: string | null | undefined): PuzzleItem[] {
  if (!s) return []
  return s.split(' ').map((token) => {
    const parts = token.split(':')
    return { i: parts[0], r: +parts[1] }
  })
}

function asItem(value: unknown): PuzzleItem | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Partial<PuzzleItem>
  if (typeof item.i !== 'string' || typeof item.r !== 'number') return null
  return {
    i: item.i,
    r: item.r,
    fen: typeof item.fen === 'string' ? item.fen : undefined,
    pop: typeof item.pop === 'number' ? item.pop : undefined,
    moves: typeof item.moves === 'number' ? item.moves : undefined,
    plays: typeof item.plays === 'number' ? item.plays : undefined,
  }
}

export function loadDone(): Set<string> {
  const ids = readJson<string[]>(FEITOS_KEY)
  return new Set(Array.isArray(ids) ? ids : [])
}

export function saveDone(done: Set<string>): boolean {
  return writeJson(FEITOS_KEY, [...done])
}

export function loadList(): { items: PuzzleItem[]; info: string } | null {
  const stored = readJson<StoredList>(LISTA_KEY)
  if (!stored) return null
  const info = stored.info || ''
  if (Array.isArray(stored.items)) {
    return { info, items: stored.items.map(asItem).filter((item) => item !== null) }
  }
  if (typeof stored.items === 'string') return { info, items: unpack(stored.items) }
  return { info, items: [] }
}

export function saveList(items: PuzzleItem[], info: string): boolean {
  return writeJson(LISTA_KEY, { v: 2, items, info })
}

const MOVES_RANGE_KEY = 'pl_lances_faixa'
const MOVES_MAX = 10

function clampMove(value: unknown, fallback: number): number {
  const parsed = typeof value === 'string' ? Number(value) : Number.NaN
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(MOVES_MAX, Math.max(1, Math.round(parsed)))
}

function movesRange(stored: Partial<FilterPrefs> | null): { minMoves: string; maxMoves: string } {
  let min = clampMove(stored?.minMoves, 1)
  let max = clampMove(stored?.maxMoves, MOVES_MAX)
  if (min > max) [min, max] = [max, min]
  const seen = localStorage.getItem(MOVES_RANGE_KEY) === '1'
  if (!seen && min === 1 && max === 1) max = MOVES_MAX
  if (!seen) localStorage.setItem(MOVES_RANGE_KEY, '1')
  return { minMoves: String(min), maxMoves: String(max) }
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function sortKey(value: unknown): SortKey {
  if (value === 'pop' || value === 'id' || value === 'moves' || value === 'plays' || value === 'rating') return value
  return DEFAULT_FILTERS.sort
}

export function loadFilters(): FilterPrefs {
  const stored = readJson<Partial<FilterPrefs>>(FILTERS_KEY)
  if (!stored) {
    localStorage.setItem(MOVES_RANGE_KEY, '1')
    return { ...DEFAULT_FILTERS, themes: [...DEFAULT_FILTERS.themes] }
  }
  const moves = movesRange(stored)
  return {
    themes: Array.isArray(stored.themes) ? stored.themes.filter((theme) => typeof theme === 'string') : [...DEFAULT_FILTERS.themes],
    extra: text(stored.extra, DEFAULT_FILTERS.extra),
    mode: stored.mode === 'any' ? 'any' : 'all',
    minMoves: moves.minMoves,
    maxMoves: moves.maxMoves,
    minRating: text(stored.minRating, DEFAULT_FILTERS.minRating),
    maxRating: text(stored.maxRating, DEFAULT_FILTERS.maxRating),
    minPop: text(stored.minPop, DEFAULT_FILTERS.minPop),
    maxPop: text(stored.maxPop, DEFAULT_FILTERS.maxPop),
    limit: text(stored.limit, DEFAULT_FILTERS.limit),
    random: typeof stored.random === 'boolean' ? stored.random : DEFAULT_FILTERS.random,
    sort: sortKey(stored.sort),
    order: stored.order === -1 ? -1 : 1,
    skipDone: typeof stored.skipDone === 'boolean' ? stored.skipDone : DEFAULT_FILTERS.skipDone,
  }
}

export function saveFilters(filters: FilterPrefs): boolean {
  return writeJson(FILTERS_KEY, filters)
}

export function loadDaily(): DailyProgress {
  return rollDaily(readJson<Partial<DailyProgress>>(DAILY_KEY), todayKey())
}

export function saveDaily(daily: DailyProgress): boolean {
  return writeJson(DAILY_KEY, daily)
}

export function loadTheme(): ThemeChoice {
  const stored = readJson<string>(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  const dark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  return dark ? 'dark' : 'light'
}

export function saveTheme(theme: ThemeChoice): boolean {
  return writeJson(THEME_KEY, theme)
}
