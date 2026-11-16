import type { FilterOptions, FilterProgress, FilterResult, PuzzleItem } from './types.ts'
import { sortItems } from './sortItems.ts'

export function isCompressed(name: string): boolean {
  return /\.zst$/i.test(name)
}

export function describeFilter(
  themes: string[],
  all: boolean,
  minMoves: number,
  maxMoves: number,
  minRating: number,
  maxRating: number,
  minPop: number,
  maxPop: number,
): string {
  const nomes = themes.length ? themes.join(all ? ' + ' : ' ou ') : 'qualquer tema'
  const lances = minMoves === maxMoves ? String(minMoves) : `${minMoves}–${maxMoves}`
  const base = `${nomes}, ${lances} lance${maxMoves > 1 ? 's' : ''}, rating ${minRating}–${maxRating}`
  if (minPop <= -100 && maxPop >= 100) return base
  return `${base}, popularidade ${minPop}–${maxPop}`
}

export async function filterCsv(
  file: File,
  options: FilterOptions,
  onProgress: (progress: FilterProgress) => void,
): Promise<FilterResult> {
  const all = options.mode === 'all'
  const lim = Math.min(10000, Math.max(1, options.limit || 500))
  const res: PuzzleItem[] = []
  let cnt = 0
  let rows = 0
  let read = 0
  let buf = ''

  function line(s: string) {
    if (!s || s.startsWith('PuzzleId')) return
    const p = s.split(',')
    if (p.length < 8) return
    rows++
    const r = +p[3]
    if (r < options.minRating || r > options.maxRating) return
    const pop = +p[5]
    if (pop < options.minPop || pop > options.maxPop) return
    const n = p[2].split(' ').length / 2
    if (n < options.minMoves || n > options.maxMoves) return
    if (options.themes.length) {
      const ts = ` ${p[7].trim()} `
      const ok = all
        ? options.themes.every((t) => ts.includes(` ${t} `))
        : options.themes.some((t) => ts.includes(` ${t} `))
      if (!ok) return
    }
    if (options.skipDone && options.done.has(p[0])) return
    cnt++
    const plays = +p[6]
    const o = {
      i: p[0],
      r,
      fen: p[1],
      pop,
      moves: n,
      plays: Number.isFinite(plays) ? plays : undefined,
    }
    if (res.length < lim) res.push(o)
    else if (options.random) {
      const j = Math.floor(Math.random() * cnt)
      if (j < lim) res[j] = o
    }
  }

  const reader = file.stream().getReader()
  const dec = new TextDecoder()
  let last = 0
  for (;;) {
    const { done: finished, value } = await reader.read()
    if (finished) break
    read += value.length
    buf += dec.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const s of lines) line(s.replace(/\r$/, ''))
    if (read - last > 4e6) {
      last = read
      onProgress({ read, total: file.size, rows, matches: cnt })
      await new Promise((resolve) => setTimeout(resolve))
    }
  }
  buf += dec.decode()
  if (buf) line(buf.replace(/\r$/, ''))
  return { items: sortItems(res, options.sort, options.order), rows, matches: cnt }
}
