import type { PuzzleItem } from './types.ts'

const FEITOS_KEY = 'pl_feitos'
const LISTA_KEY = 'pl_lista'

type StoredList = {
  items?: string
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

export function pack(items: PuzzleItem[]): string {
  return items.map((x) => `${x.i}:${x.r}`).join(' ')
}

export function unpack(s: string | null | undefined): PuzzleItem[] {
  if (!s) return []
  return s.split(' ').map((t) => {
    const p = t.split(':')
    return { i: p[0], r: +p[1] }
  })
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
  return {
    items: unpack(typeof stored.items === 'string' ? stored.items : ''),
    info: stored.info || '',
  }
}

export function saveList(items: PuzzleItem[], info: string): boolean {
  return writeJson(LISTA_KEY, { items: pack(items), info })
}
