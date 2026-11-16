import type { PuzzleItem, SortKey } from './types.ts'

function field(item: PuzzleItem, sort: SortKey): string | number | null {
  if (sort === 'id') return item.i
  if (sort === 'pop') return typeof item.pop === 'number' ? item.pop : null
  if (sort === 'moves') return typeof item.moves === 'number' ? item.moves : null
  if (sort === 'plays') return typeof item.plays === 'number' ? item.plays : null
  return item.r
}

function compare(a: PuzzleItem, b: PuzzleItem, sort: SortKey, order: 1 | -1): number {
  const left = field(a, sort)
  const right = field(b, sort)
  if (left == null && right == null) return a.i.localeCompare(b.i)
  if (left == null) return 1
  if (right == null) return -1
  const delta =
    typeof left === 'string' && typeof right === 'string'
      ? left.localeCompare(right, 'pt-BR', { numeric: true })
      : Number(left) - Number(right)
  return delta * order || a.i.localeCompare(b.i)
}

export function sortItems(items: PuzzleItem[], sort: SortKey, order: 1 | -1): PuzzleItem[] {
  return [...items].sort((a, b) => compare(a, b, sort, order))
}
