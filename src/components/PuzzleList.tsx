import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { TRAINING_URL } from '../themes.ts'
import { ratingTone } from '../ratingTone.ts'
import type { FilterPrefs, PuzzleItem, SortKey, ViewMode } from '../types.ts'
import { DualRange } from './DualRange.tsx'
import { MiniBoard } from './MiniBoard.tsx'
import { PieceGlyph } from './pieceGlyphs.tsx'

type PuzzleListProps = {
  items: PuzzleItem[]
  info: string
  done: Set<string>
  sync: string
  listVersion: number
  filters: FilterPrefs
  onFilters: (patch: Partial<FilterPrefs>) => void
  onSort: (patch: { sort?: SortKey; order?: 1 | -1 }) => void
  onToggle: (id: string, checked: boolean) => void
  onClear: () => void
}

export function PuzzleList({
  items,
  info,
  done,
  sync,
  listVersion,
  filters,
  onFilters,
  onSort,
  onToggle,
  onClear,
}: PuzzleListProps) {
  const [view, setView] = useState<ViewMode>('all')
  const [query, setQuery] = useState('')
  const [ratingMin, setRatingMin] = useState<number | null>(null)
  const [ratingMax, setRatingMax] = useState<number | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [frozenDone, setFrozenDone] = useState(() => new Set(done))
  const [copied, setCopied] = useState(false)
  const doneRef = useRef(done)
  const seenVersion = useRef(listVersion)
  const copyTimer = useRef<number | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    doneRef.current = done
  }, [done])

  useEffect(() => {
    if (seenVersion.current === listVersion) return
    seenVersion.current = listVersion
    setView('all')
    setQuery('')
    setRatingMin(null)
    setRatingMax(null)
    setFrozenDone(new Set(doneRef.current))
  }, [listVersion])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 960px)')
    function sync() {
      if (media.matches && detailsRef.current) detailsRef.current.open = true
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  function rememberDetails(node: HTMLDetailsElement | null) {
    detailsRef.current = node
    if (node && node.dataset.ready !== '1') {
      node.open = true
      node.dataset.ready = '1'
    }
  }

  const ratingBounds = useMemo(() => ratingWindow(items), [items])
  const ratingLo = ratingMin ?? ratingBounds.floor
  const ratingHi = ratingMax ?? ratingBounds.ceil
  const doneCount = items.filter((item) => done.has(item.i)).length
  const needle = query.trim().toLowerCase()
  const visible = items
    .map((item, index) => ({ x: item, k: index }))
    .filter((entry) => view !== 'pend' || !frozenDone.has(entry.x.i))
    .filter((entry) => !needle || entry.x.i.toLowerCase().includes(needle))
    .filter((entry) => entry.x.r >= ratingLo && entry.x.r <= ratingHi)
  const complete = items.length > 0 && doneCount === items.length
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => scrollerRef.current,
    estimateSize: () => 136,
    overscan: 6,
  })

  function changeView(next: ViewMode) {
    setView(next)
    setFrozenDone(new Set(done))
  }

  async function copyPending() {
    const text = items
      .filter((item) => !done.has(item.i))
      .map((item) => TRAINING_URL + item.i)
      .join('\n')
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const area = document.createElement('textarea')
      area.value = text
      document.body.appendChild(area)
      area.select()
      try {
        document.execCommand('copy')
      } catch {
        /* clipboard indisponível */
      }
      area.remove()
    }
    setCopied(true)
    if (copyTimer.current) window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800)
  }

  function clearDone() {
    setFrozenDone(new Set())
    onClear()
  }

  return (
    <details className="card list-card" ref={rememberDetails}>
      <summary>
        <span className="summary-title">Minha lista</span>
        {items.length > 0 && (
          <strong className="score">
            {doneCount}/{items.length}
          </strong>
        )}
      </summary>
      <div className="list-head">
        <h2>Minha lista</h2>
        {items.length > 0 && (
          <strong className="score">
            {doneCount}/{items.length}
          </strong>
        )}
      </div>
      {items.length > 0 && (
        <p className="m flat">
          {info} · {doneCount} de {items.length} feitos
        </p>
      )}
      {items.length > 0 && (
        <>
          <div
            className="meter"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={items.length}
            aria-valuenow={doneCount}
            aria-label="Progresso da lista"
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          {complete && <p className="banner">Lista concluída.</p>}
        </>
      )}

      <div className="row tools">
        {items.length > 0 && (
          <div>
            <span>Mostrar</span>
            <select value={view} onChange={(event) => changeView(event.target.value === 'pend' ? 'pend' : 'all')}>
              <option value="all">Todos</option>
              <option value="pend">Só pendentes</option>
            </select>
          </div>
        )}
        <div>
          <span>Ordenar por</span>
          <select
            value={filters.sort}
            onChange={(event) => {
              const sort = event.target.value
              if (sort === 'rating' || sort === 'pop' || sort === 'id' || sort === 'moves' || sort === 'plays') {
                onSort({ sort })
              }
            }}
          >
            <option value="rating">Rating</option>
            <option value="pop">Popularidade</option>
            <option value="id">Id</option>
            <option value="moves">Lances</option>
            <option value="plays">Partidas</option>
          </select>
        </div>
        <div>
          <span>Ordem</span>
          <select
            value={String(filters.order)}
            onChange={(event) => onSort({ order: event.target.value === '-1' ? -1 : 1 })}
          >
            <option value="1">Crescente</option>
            <option value="-1">Decrescente</option>
          </select>
        </div>
        <div>
          <span>Seleção</span>
          <select
            value={filters.random ? '1' : '0'}
            onChange={(event) => onFilters({ random: event.target.value === '1' })}
          >
            <option value="1">Aleatórios</option>
            <option value="0">Primeiros do arquivo</option>
          </select>
        </div>
        <div>
          <span>Máx. de puzzles</span>
          <input
            type="number"
            min={1}
            max={10000}
            value={filters.limit}
            onChange={(event) => onFilters({ limit: event.target.value })}
          />
        </div>
      </div>
      <label className="skip">
        <input
          type="checkbox"
          checked={filters.skipDone}
          onChange={(event) => onFilters({ skipDone: event.target.checked })}
        />{' '}
        Pular puzzles que já marquei como feitos
      </label>

      {items.length > 0 && (
        <div className="row tools">
          <div className="grow">
            <span>Id</span>
            <input
              type="search"
              value={query}
              placeholder="Id do puzzle"
              aria-label="Filtrar por id"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div>
            <span>Tabuleiro</span>
            <button type="button" className="ghost" onClick={() => setFlipped((value) => !value)}>
              {flipped ? 'Pretas embaixo' : 'Brancas embaixo'}
            </button>
          </div>
        </div>
      )}
      {items.length > 0 && (
        <DualRange
          label="Rating da lista"
          minLabel="Rating mínimo da lista"
          maxLabel="Rating máximo da lista"
          min={String(ratingLo)}
          max={String(ratingHi)}
          floor={ratingBounds.floor}
          ceil={ratingBounds.ceil}
          step={ratingBounds.step}
          onChange={(min, max) => {
            setRatingMin(Number(min))
            setRatingMax(Number(max))
          }}
        />
      )}
      {items.length > 0 && (
        <p className="m">A miniatura é a posição do CSV, antes do lance inicial do adversário.</p>
      )}

      <div className={items.length ? 'row actions' : 'row actions hide'}>
        <button type="button" className="copy" onClick={() => void copyPending()}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          {copied ? 'Copiado!' : 'Copiar pendentes'}
        </button>
        <button type="button" className="danger" onClick={clearDone}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Limpar feitos
        </button>
      </div>

      {items.length === 0 && (
        <div className="empty-list" role="status">
          <div className="empty-mark" aria-hidden="true">
            <svg viewBox="0 0 45 45">
              <PieceGlyph kind="n" white />
            </svg>
          </div>
          <div>
            <strong>Sua lista ainda está vazia</strong>
            <p>Escolha os temas nos filtros e toque em Filtrar. Os puzzles entram aqui.</p>
          </div>
        </div>
      )}
      {items.length > 0 && visible.length === 0 && <p className="m">Nenhum puzzle com esse filtro.</p>}
      {visible.length > 0 && (
        <div className="scroller" ref={scrollerRef}>
          <div className="scroller-inner" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const entry = visible[virtualRow.index]
              if (!entry) return null
              const checked = done.has(entry.x.i)
              return (
                <article
                  key={entry.x.i}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className={checked ? 'puzzle d' : 'puzzle'}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <label className="tick">
                    <input
                      type="checkbox"
                      checked={checked}
                      aria-label={`Marcar puzzle ${entry.x.i} como feito`}
                      onChange={(event) => onToggle(entry.x.i, event.target.checked)}
                    />
                  </label>
                  <MiniBoard fen={entry.x.fen} flipped={flipped} />
                  <div className="puzzle-meta">
                    <span className="n">{entry.k + 1}</span>
                    <a
                      className={`rate-${ratingTone(entry.x.r)}`}
                      href={TRAINING_URL + entry.x.i}
                      target="_blank"
                      rel="noopener"
                    >
                      Rating {entry.x.r}
                    </a>
                    <span className="id">{entry.x.i}</span>
                    {typeof entry.x.pop === 'number' && <span className="pop">Pop. {entry.x.pop}</span>}
                    {filters.sort === 'moves' && (
                      <span className="pop">
                        {typeof entry.x.moves === 'number'
                          ? `${entry.x.moves} ${entry.x.moves === 1 ? 'lance' : 'lances'}`
                          : 'Lances indisponíveis'}
                      </span>
                    )}
                    {filters.sort === 'plays' && (
                      <span className="pop">
                        {typeof entry.x.plays === 'number'
                          ? `${entry.x.plays} ${entry.x.plays === 1 ? 'partida' : 'partidas'}`
                          : 'Partidas indisponíveis'}
                      </span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}
      <p className="m">{sync}</p>
    </details>
  )
}

function ratingWindow(items: PuzzleItem[]) {
  let low = items[0]?.r ?? 0
  let high = low
  for (const item of items) {
    if (item.r < low) low = item.r
    if (item.r > high) high = item.r
  }
  if (high - low < 50) return { floor: low, ceil: high, step: high === low ? 1 : 10 }
  return { floor: Math.floor(low / 50) * 50, ceil: Math.ceil(high / 50) * 50, step: 50 }
}
