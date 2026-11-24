import { useEffect, useImperativeHandle, useRef, useState, type MouseEvent, type Ref } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ratingTone } from '../ratingTone.ts'
import { themeLabel, TRAINING_URL } from '../themes.ts'
import type { FilterPrefs, PuzzleItem, SortKey, ViewMode } from '../types.ts'
import { FlipControl, ListActions, ListSettings } from './ListSettings.tsx'
import { MiniBoard } from './MiniBoard.tsx'
import { PieceGlyph } from './pieceGlyphs.tsx'

function listFacts(info: string): string[] {
  if (!info) return []
  const pop = info.match(/, popularidade (-?\d+)–(-?\d+)$/)
  const withoutPop = pop ? info.slice(0, pop.index) : info
  const rating = withoutPop.match(/, rating (\d+)–(\d+)$/)
  const withoutRating = rating ? withoutPop.slice(0, rating.index) : withoutPop
  const moves = withoutRating.match(/, (\d+)(?:–(\d+))? lances?$/)
  const themes = moves && moves.index !== undefined ? withoutRating.slice(0, moves.index) : withoutRating
  if (!moves || !rating) return [info]
  const minMoves = moves[1] ?? ''
  const maxMoves = moves[2] ?? minMoves
  const moveLabel = minMoves === maxMoves ? minMoves : `${minMoves}–${maxMoves}`
  const moveWord = maxMoves === '1' ? 'lance' : 'lances'
  const themeLabelText =
    themes === 'qualquer tema'
      ? 'Qualquer tema'
      : themes
          .split(/\s+\+\s+|\s+ou\s+/)
          .map((key) => themeLabel(key))
          .join(themes.includes(' + ') ? ' + ' : themes.includes(' ou ') ? ' ou ' : '')
  const facts = [themeLabelText, `${moveLabel} ${moveWord}`, `Rating ${rating[1]}–${rating[2]}`]
  if (pop) facts.push(`Pop. ${pop[1]}–${pop[2]}`)
  return facts
}

export type PuzzleListHandle = {
  scrollToTop: () => void
  resetPending: () => void
}

type PuzzleListProps = {
  ref?: Ref<PuzzleListHandle>
  items: PuzzleItem[]
  info: string
  done: Set<string>
  sync: string
  listVersion: number
  filters: FilterPrefs
  view: ViewMode
  onView: (view: ViewMode) => void
  mobile: boolean
  flipped: boolean
  copied: boolean
  onFlip: () => void
  onCopy: () => void
  onFilters: (patch: Partial<FilterPrefs>) => void
  onSort: (patch: { sort?: SortKey; order?: 1 | -1 }) => void
  onToggle: (id: string, checked: boolean) => void
  onClear: () => void
  hasFile: boolean
  onLoadCsv: () => void
  onListScroll?: (info: { scrollTop: number; clientHeight: number; scrollHeight: number }) => void
}

export function PuzzleList({
  ref,
  items,
  info,
  done,
  sync,
  listVersion,
  filters,
  view,
  onView,
  mobile,
  flipped,
  copied,
  onFlip,
  onCopy,
  onFilters,
  onSort,
  onToggle,
  onClear,
  hasFile,
  onLoadCsv,
  onListScroll,
}: PuzzleListProps) {
  const [frozenDone, setFrozenDone] = useState(() => new Set(done))
  const [trackedView, setTrackedView] = useState(view)
  const doneRef = useRef(done)
  const seenVersion = useRef(listVersion)
  if (view !== trackedView) {
    setTrackedView(view)
    setFrozenDone(new Set(done))
  }
  const scrollerRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    doneRef.current = done
  }, [done])

  useEffect(() => {
    if (seenVersion.current === listVersion) return
    seenVersion.current = listVersion
    onView('all')
    setFrozenDone(new Set(doneRef.current))
  }, [listVersion, onView])

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = true
  }, [mobile])

  useEffect(() => {
    if (items.length === 0) onListScroll?.({ scrollTop: 0, clientHeight: 1, scrollHeight: 0 })
  }, [items.length, onListScroll])

  function rememberDetails(node: HTMLDetailsElement | null) {
    detailsRef.current = node
    if (node && node.dataset.ready !== '1') {
      node.open = true
      node.dataset.ready = '1'
    }
  }

  const doneCount = items.filter((item) => done.has(item.i)).length
  const visible = items
    .map((item, index) => ({ x: item, k: index }))
    .filter((entry) => view !== 'pend' || !frozenDone.has(entry.x.i))
  const complete = items.length > 0 && doneCount === items.length
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => scrollerRef.current,
    estimateSize: () => (mobile ? 88 : 136),
    overscan: 6,
  })

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || !onListScroll) return
    const node = el
    function handle() {
      onListScroll?.({
        scrollTop: node.scrollTop,
        clientHeight: node.clientHeight,
        scrollHeight: node.scrollHeight,
      })
    }
    node.addEventListener('scroll', handle, { passive: true })
    return () => node.removeEventListener('scroll', handle)
  }, [onListScroll, visible.length])

  function openPuzzle(event: MouseEvent<HTMLElement>, id: string, checked: boolean) {
    const target = event.target
    if (!(target instanceof Element) || target.closest('.tick')) return
    if (!checked) onToggle(id, true)
    if (target.closest('a')) return
    window.open(TRAINING_URL + id, '_blank', 'noopener,noreferrer')
  }

  useImperativeHandle(ref, () => ({
    scrollToTop() {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      scrollerRef.current?.scrollTo({ top: 0, behavior })
    },
    resetPending() {
      setFrozenDone(new Set())
    },
  }))

  return (
    <details id="lista" className="card list-card" ref={rememberDetails}>
      <summary>
        <span className="summary-title">Minha lista</span>
        {items.length > 0 && (
          <strong className="score">
            {doneCount}/{items.length}
          </strong>
        )}
      </summary>
      {!mobile && (
        <>
          <div className="list-head">
            <h2>Minha lista</h2>
            {items.length > 0 && (
              <strong className="score">{doneCount > 0 && progress === 0 ? '<1%' : `${progress}%`}</strong>
            )}
          </div>
          {items.length > 0 && (
            <>
              <ul className="list-facts">
                {listFacts(info).map((fact) => (
                  <li key={fact} className="fact">
                    {fact}
                  </li>
                ))}
              </ul>
              <div className="list-progress">
                <span>
                  <strong>{doneCount}</strong> {doneCount === 1 ? 'feito' : 'feitos'}
                </span>
                <div
                  className="meter"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={items.length}
                  aria-valuenow={doneCount}
                  aria-label="Progresso da lista"
                >
                  <span style={{ width: doneCount > 0 ? `max(${progress}%, 6px)` : '0%' }} />
                </div>
                <span>
                  <strong>{items.length}</strong> na lista
                </span>
              </div>
              {complete && <p className="banner">Lista concluída.</p>}
            </>
          )}
          <ListSettings
            filters={filters}
            view={view}
            showView={items.length > 0}
            onFilters={onFilters}
            onSort={onSort}
            onView={onView}
          />
          {items.length > 0 && <FlipControl flipped={flipped} onFlip={onFlip} />}
          {items.length > 0 && (
            <p className="hint">A miniatura é a posição do CSV, antes do lance inicial do adversário.</p>
          )}
          {items.length > 0 && <ListActions copied={copied} onCopy={onCopy} onClear={onClear} />}
        </>
      )}

      {items.length === 0 && (
        <div className="empty-list" role="status">
          <div className="empty-mark" aria-hidden="true">
            <svg viewBox="0 0 45 45">
              <PieceGlyph kind="n" white />
            </svg>
          </div>
          <div>
            <strong>Sua lista ainda está vazia</strong>
            <p className="empty-copy desk">Escolha os temas nos filtros e toque em Filtrar. Os puzzles entram aqui.</p>
            {mobile && !hasFile ? (
              <>
                <p className="empty-copy mob">Carregue o CSV do Lichess para filtrar os puzzles neste aparelho.</p>
                <button type="button" className="primary empty-load" onClick={onLoadCsv}>
                  Carregar CSV
                </button>
              </>
            ) : (
              <p className="empty-copy mob">Toque em Filtros, ajuste e veja os resultados. Os puzzles entram aqui.</p>
            )}
          </div>
        </div>
      )}
      {items.length > 0 && visible.length === 0 && <p className="hint">Nenhum puzzle com esse filtro.</p>}
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
                  onClick={(event) => openPuzzle(event, entry.x.i, checked)}
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
                    {typeof entry.x.pop === 'number' && (
                      <span className={filters.sort === 'pop' ? 'pop sort-metric' : 'pop'}>Pop. {entry.x.pop}</span>
                    )}
                    {filters.sort === 'moves' && (
                      <span className="pop sort-metric">
                        {typeof entry.x.moves === 'number'
                          ? `${entry.x.moves} ${entry.x.moves === 1 ? 'lance' : 'lances'}`
                          : 'Lances indisponíveis'}
                      </span>
                    )}
                    {filters.sort === 'plays' && (
                      <span className="pop sort-metric">
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
      <p className="hint sync-note">{sync}</p>
    </details>
  )
}
