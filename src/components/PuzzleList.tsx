import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { TRAINING_URL } from '../themes.ts'
import { ratingTone } from '../ratingTone.ts'
import type { FilterPrefs, PuzzleItem, ViewMode } from '../types.ts'
import { MiniBoard } from './MiniBoard.tsx'

type PuzzleListProps = {
  items: PuzzleItem[]
  info: string
  done: Set<string>
  sync: string
  listVersion: number
  filters: FilterPrefs
  onFilters: (patch: Partial<FilterPrefs>) => void
  onOrder: (value: 1 | -1) => void
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
  onOrder,
  onToggle,
  onClear,
}: PuzzleListProps) {
  const [view, setView] = useState<ViewMode>('all')
  const [query, setQuery] = useState('')
  const [flipped, setFlipped] = useState(false)
  const [frozenDone, setFrozenDone] = useState(() => new Set(done))
  const [copied, setCopied] = useState(false)
  const [armed, setArmed] = useState(false)
  const doneRef = useRef(done)
  const seenVersion = useRef(listVersion)
  const copyTimer = useRef<number | null>(null)
  const armTimer = useRef<number | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    doneRef.current = done
  }, [done])

  useEffect(() => {
    if (seenVersion.current === listVersion) return
    seenVersion.current = listVersion
    setView('all')
    setQuery('')
    setFrozenDone(new Set(doneRef.current))
  }, [listVersion])

  const doneCount = items.filter((item) => done.has(item.i)).length
  const needle = query.trim().toLowerCase()
  const visible = items
    .map((item, index) => ({ x: item, k: index }))
    .filter((entry) => view !== 'pend' || !frozenDone.has(entry.x.i))
    .filter((entry) => {
      if (!needle) return true
      return entry.x.i.toLowerCase().includes(needle) || String(entry.x.r).includes(needle)
    })
  const complete = items.length > 0 && doneCount === items.length
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => scrollerRef.current,
    estimateSize: () => 112,
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
    if (!armed) {
      setArmed(true)
      if (armTimer.current) window.clearTimeout(armTimer.current)
      armTimer.current = window.setTimeout(() => setArmed(false), 3000)
      return
    }
    if (armTimer.current) window.clearTimeout(armTimer.current)
    setArmed(false)
    setFrozenDone(new Set())
    onClear()
  }

  return (
    <section className="card list-card">
      <div className="list-head">
        <h2>Minha lista</h2>
        {items.length > 0 && (
          <strong className="score">
            {doneCount}/{items.length}
          </strong>
        )}
      </div>
      {items.length === 0 ? (
        <div className="empty">
          <strong>Nenhuma lista salva ainda.</strong>
          <p className="m flat">Abra os filtros, escolha os temas e toque em Filtrar.</p>
        </div>
      ) : (
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
          <span>Ordem por rating</span>
          <select
            value={String(filters.order)}
            onChange={(event) => onOrder(event.target.value === '-1' ? -1 : 1)}
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
            <span>Buscar na lista</span>
            <input
              type="search"
              value={query}
              placeholder="Id ou rating"
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
        <p className="m">A miniatura é a posição do CSV, antes do lance inicial do adversário.</p>
      )}

      <div className={items.length ? 'row actions' : 'row actions hide'}>
        <button type="button" className="ghost" onClick={() => void copyPending()}>
          {copied ? 'Copiado!' : 'Copiar pendentes'}
        </button>
        <button type="button" className="ghost" onClick={clearDone}>
          {armed ? 'Toque de novo para confirmar' : 'Limpar feitos'}
        </button>
      </div>

      {items.length > 0 && visible.length === 0 && <p className="m">Nenhum puzzle com essa busca.</p>}
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
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}
      <p className="m">{sync}</p>
    </section>
  )
}
