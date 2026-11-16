import { useEffect, useMemo, useRef, useState } from 'react'
import { describeFilter, filterCsv, isCompressed } from '../filterCsv.ts'
import { DEFAULT_FILTERS, type FilterPrefs, type FilterResult, type PuzzleItem } from '../types.ts'
import { DualRange } from './DualRange.tsx'
import { ThemePicker } from './ThemePicker.tsx'

type FilterPanelProps = {
  done: Set<string>
  startOpen: boolean
  filters: FilterPrefs
  onChange: (patch: Partial<FilterPrefs>) => void
  onApply: (items: PuzzleItem[], info: string) => void
}

export function FilterPanel({ done, startOpen, filters, onChange, onApply }: FilterPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [filtering, setFiltering] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMax, setProgressMax] = useState(1)
  const [status, setStatus] = useState('')
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const selected = useMemo(() => new Set(filters.themes), [filters.themes])

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
      const desktop = window.matchMedia('(min-width: 960px)').matches
      node.open = desktop || startOpen
      node.dataset.ready = '1'
    }
  }

  function toggleTheme(key: string) {
    const themes = filters.themes.includes(key)
      ? filters.themes.filter((theme) => theme !== key)
      : [...filters.themes, key]
    onChange({ themes })
  }

  function clearFilters() {
    onChange({
      themes: [...DEFAULT_FILTERS.themes],
      extra: DEFAULT_FILTERS.extra,
      mode: DEFAULT_FILTERS.mode,
      minMoves: DEFAULT_FILTERS.minMoves,
      maxMoves: DEFAULT_FILTERS.maxMoves,
      minRating: DEFAULT_FILTERS.minRating,
      maxRating: DEFAULT_FILTERS.maxRating,
      minPop: DEFAULT_FILTERS.minPop,
      maxPop: DEFAULT_FILTERS.maxPop,
    })
    setStatus('')
  }

  function onFile(next: File | null) {
    if (next && isCompressed(next.name)) {
      setStatus('Este arquivo ainda está compactado (.zst). Descompacte antes para obter o .csv.')
      setFile(null)
      return
    }
    setFile(next)
    setStatus(next ? `${next.name} (${(next.size / 1048576).toFixed(0)} MB)` : '')
  }

  async function onFilter() {
    if (!file || filtering) return
    const themes = [...filters.themes, ...filters.extra.trim().split(/\s+/).filter(Boolean)]
    const mn = +filters.minMoves || 1
    const mx = +filters.maxMoves || 999
    const rmin = +filters.minRating
    const rmax = +filters.maxRating
    const pmin = +filters.minPop
    const pmax = +filters.maxPop
    const lim = +filters.limit || 500
    setFiltering(true)
    setShowProgress(true)
    setProgress(0)
    setProgressMax(file.size)
    try {
      const result: FilterResult = await filterCsv(
        file,
        {
          themes,
          mode: filters.mode,
          minMoves: mn,
          maxMoves: mx,
          minRating: rmin,
          maxRating: rmax,
          minPop: Number.isNaN(pmin) ? -100 : pmin,
          maxPop: Number.isNaN(pmax) ? 100 : pmax,
          limit: lim,
          random: filters.random,
          order: filters.order,
          sort: filters.sort,
          skipDone: filters.skipDone,
          done,
        },
        (step) => {
          setProgress(step.read)
          setStatus(
            `${step.rows.toLocaleString('pt-BR')} puzzles lidos, ${step.matches.toLocaleString('pt-BR')} encontrados`,
          )
        },
      )
      setProgress(file.size)
      const info = describeFilter(themes, filters.mode === 'all', mn, mx, rmin, rmax, pmin, pmax)
      const kept =
        result.matches > result.items.length
          ? ` (guardados ${result.items.length.toLocaleString('pt-BR')})`
          : ''
      setStatus(
        `${result.rows.toLocaleString('pt-BR')} puzzles lidos, ${result.matches.toLocaleString('pt-BR')} correspondem${kept}. Lista salva.`,
      )
      onApply(result.items, info)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setStatus(`Erro ao ler o arquivo: ${message}`)
    } finally {
      setFiltering(false)
    }
  }

  return (
    <details className="card filters" ref={rememberDetails}>
      <summary>
        <span className="summary-title">Filtros</span>
      </summary>
      <h2 className="only-desk">Filtros</h2>

      <h2>1. Arquivo CSV</h2>
      <input
        className="file"
        type="file"
        accept=".csv,text/csv"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />

      <h2 className="sp">2. Temas</h2>
      <ThemePicker selected={selected} onToggle={toggleTheme} />
      <div className="row">
        <div className="grow">
          <span>Outros temas (separados por espaço)</span>
          <input
            type="text"
            value={filters.extra}
            placeholder="ex.: mateIn3 crushing"
            onChange={(event) => onChange({ extra: event.target.value })}
          />
        </div>
        <div>
          <span>Combinar temas</span>
          <select
            value={filters.mode}
            onChange={(event) => onChange({ mode: event.target.value === 'any' ? 'any' : 'all' })}
          >
            <option value="all">Todos (E)</option>
            <option value="any">Qualquer (OU)</option>
          </select>
        </div>
      </div>

      <h2 className="sp">3. Lances, rating e popularidade</h2>
      <DualRange
        label="Lances"
        minLabel="Lances mínimos"
        maxLabel="Lances máximos"
        min={filters.minMoves}
        max={filters.maxMoves}
        floor={1}
        ceil={20}
        step={1}
        onChange={(minMoves, maxMoves) => onChange({ minMoves, maxMoves })}
      />
      <DualRange
        label="Rating"
        minLabel="Rating mínimo"
        maxLabel="Rating máximo"
        min={filters.minRating}
        max={filters.maxRating}
        floor={0}
        ceil={4000}
        step={50}
        onChange={(minRating, maxRating) => onChange({ minRating, maxRating })}
      />
      <DualRange
        label="Popularidade"
        minLabel="Popularidade mínima"
        maxLabel="Popularidade máxima"
        min={filters.minPop}
        max={filters.maxPop}
        floor={-100}
        ceil={100}
        step={5}
        onChange={(minPop, maxPop) => onChange({ minPop, maxPop })}
      />
      <p className="m">
        Lances = lances do jogador, sem a jogada inicial do adversário. Popularidade vai de -100 a 100.
      </p>

      <div className="filter-actions">
        <button type="button" className="ghost" onClick={clearFilters}>
          Limpar filtros
        </button>
        <button type="button" className="primary" disabled={!file || filtering} onClick={() => void onFilter()}>
          {filtering ? 'Filtrando…' : 'Filtrar'}
        </button>
      </div>
      <progress className={showProgress ? undefined : 'hide'} value={progress} max={progressMax} />
      <div className="m" role="status">
        {status}
      </div>
      <p className="m">Uma nova lista substitui a anterior. Os puzzles feitos continuam marcados.</p>
    </details>
  )
}
