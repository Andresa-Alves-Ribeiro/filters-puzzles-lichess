import { useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type Ref, type RefObject } from 'react'
import { sameQuery, sameSort } from '../activeFilters.ts'
import { describeFilter, filterCsv, isCompressed } from '../filterCsv.ts'
import { keepCsv, loadKeptCsv } from '../csvStore.ts'
import { DEFAULT_FILTERS, type FilterPrefs, type FilterResult, type PuzzleItem, type SortKey, type ViewMode } from '../types.ts'
import { BottomSheet } from './BottomSheet.tsx'
import { ScanProgress } from './ScanProgress.tsx'
import { DualRange } from './DualRange.tsx'
import { FlipControl, ListActions, ListSettings } from './ListSettings.tsx'
import { ThemePicker } from './ThemePicker.tsx'

export type FilterPanelHandle = {
  run: (prefs: FilterPrefs) => Promise<boolean>
}

type FilterPanelProps = {
  ref?: Ref<FilterPanelHandle>
  done: Set<string>
  startOpen: boolean
  filters: FilterPrefs
  onChange: (patch: Partial<FilterPrefs>) => void
  onApply: (items: PuzzleItem[], info: string) => void
  onSort: (patch: { sort?: SortKey; order?: 1 | -1 }) => void
  onFiltering: (filtering: boolean) => void
  onScan: (read: number, total: number, label: string) => void
  onHasFile: (hasFile: boolean) => void
  mobile: boolean
  sheetOpen: boolean
  focusFile: boolean
  keepDraft: boolean
  onSheetClose: () => void
  onSheetApply: () => void
  resultCount: number
  view: ViewMode
  onView: (view: ViewMode) => void
  hasItems: boolean
  flipped: boolean
  copied: boolean
  onFlip: () => void
  onCopy: () => void
  onClearDone: () => void
}

export function FilterPanel({
  ref,
  done,
  startOpen,
  filters,
  onChange,
  onApply,
  onSort,
  onFiltering,
  onScan,
  onHasFile,
  mobile,
  sheetOpen,
  focusFile,
  keepDraft,
  onSheetClose,
  onSheetApply,
  resultCount,
  view,
  onView,
  hasItems,
  flipped,
  copied,
  onFlip,
  onCopy,
  onClearDone,
}: FilterPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [filtering, setFiltering] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMax, setProgressMax] = useState(1)
  const [status, setStatus] = useState('')
  const [draft, setDraft] = useState(filters)
  const [draftView, setDraftView] = useState(view)
  const [draftReady, setDraftReady] = useState(false)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const picked = useRef(false)
  const keepGen = useRef(0)
  const filteringRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const runGen = useRef(0)
  const titleId = useId()

  if (sheetOpen && !draftReady) {
    setDraftReady(true)
    setDraft(filters)
    setDraftView(view)
  } else if (!sheetOpen && draftReady) {
    setDraftReady(false)
    if (!keepDraft) setDraft(filters)
  }

  useEffect(() => {
    const media = window.matchMedia('(min-width: 960px)')
    function sync() {
      if (media.matches && detailsRef.current) detailsRef.current.open = true
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    let cancel = false
    void loadKeptCsv().then((kept) => {
      if (cancel || picked.current || !kept) return
      setFile(kept)
      showOnInput(fileRef.current, kept)
      setStatus(`${fileLabel(kept)}, salvo neste navegador.`)
    })
    return () => {
      cancel = true
    }
  }, [])

  useEffect(() => {
    if (!file) return
    showOnInput(fileRef.current, file)
  }, [file, mobile, sheetOpen])

  useEffect(() => {
    onFiltering(filtering)
  }, [filtering, onFiltering])

  useEffect(() => {
    onHasFile(file !== null)
  }, [file, onHasFile])

  useEffect(() => {
    if (!sheetOpen || !focusFile) return
    fileRef.current?.focus()
  }, [sheetOpen, focusFile])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  function rememberDetails(node: HTMLDetailsElement | null) {
    detailsRef.current = node
    if (node && node.dataset.ready !== '1') {
      const desktop = window.matchMedia('(min-width: 960px)').matches
      node.open = desktop || startOpen
      node.dataset.ready = '1'
    }
  }

  function toggleTheme(key: string, prefs: FilterPrefs, patch: (next: Partial<FilterPrefs>) => void) {
    const themes = prefs.themes.includes(key) ? prefs.themes.filter((theme) => theme !== key) : [...prefs.themes, key]
    patch({ themes })
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

  function clearDraft() {
    setDraft((current) => ({
      ...current,
      themes: [...DEFAULT_FILTERS.themes],
      extra: DEFAULT_FILTERS.extra,
      mode: DEFAULT_FILTERS.mode,
      minMoves: DEFAULT_FILTERS.minMoves,
      maxMoves: DEFAULT_FILTERS.maxMoves,
      minRating: DEFAULT_FILTERS.minRating,
      maxRating: DEFAULT_FILTERS.maxRating,
      minPop: DEFAULT_FILTERS.minPop,
      maxPop: DEFAULT_FILTERS.maxPop,
    }))
  }

  function onFile(next: File | null) {
    picked.current = true
    if (next && isCompressed(next.name)) {
      setStatus('Este arquivo ainda está compactado (.zst). Descompacte antes para obter o .csv.')
      setFile(null)
      return
    }
    setFile(next)
    if (!next) return
    const label = fileLabel(next)
    setStatus(label)
    const gen = ++keepGen.current
    void keepCsv(next).then(
      () => {
        if (keepGen.current !== gen || filteringRef.current) return
        setStatus(`${label}, salvo neste navegador.`)
      },
      () => {
        if (keepGen.current !== gen || filteringRef.current) return
        setStatus(`${label}. Não consegui guardar para a próxima visita.`)
      },
    )
  }

  const runFilter = useCallback(async (prefs: FilterPrefs): Promise<boolean> => {
    if (!file) return false
    const gen = ++runGen.current
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const themes = [...prefs.themes, ...prefs.extra.trim().split(/\s+/).filter(Boolean)]
    const mn = +prefs.minMoves || 1
    const mx = Math.min(10, +prefs.maxMoves || 10)
    const rmin = +prefs.minRating
    const rmax = +prefs.maxRating
    const pmin = +prefs.minPop
    const pmax = +prefs.maxPop
    const lim = +prefs.limit || 500
    setFiltering(true)
    filteringRef.current = true
    setShowProgress(true)
    setProgress(0)
    setProgressMax(file.size)
    onScan(0, file.size, 'Filtrando…')
    try {
      const result: FilterResult = await filterCsv(
        file,
        {
          themes,
          mode: prefs.mode,
          minMoves: mn,
          maxMoves: mx,
          minRating: rmin,
          maxRating: rmax,
          minPop: Number.isNaN(pmin) ? -100 : pmin,
          maxPop: Number.isNaN(pmax) ? 100 : pmax,
          limit: lim,
          random: prefs.random,
          order: prefs.order,
          sort: prefs.sort,
          skipDone: prefs.skipDone,
          done,
        },
        (step) => {
          if (gen !== runGen.current) return
          setProgress(step.read)
          const label = `${step.rows.toLocaleString('pt-BR')} puzzles lidos, ${step.matches.toLocaleString('pt-BR')} encontrados`
          onScan(step.read, step.total, label)
          setStatus(label)
        },
        controller.signal,
      )
      if (gen !== runGen.current) return false
      setProgress(file.size)
      const info = describeFilter(themes, prefs.mode === 'all', mn, mx, rmin, rmax, pmin, pmax)
      const kept =
        result.matches > result.items.length
          ? ` (guardados ${result.items.length.toLocaleString('pt-BR')})`
          : ''
      const doneLabel = `${result.rows.toLocaleString('pt-BR')} puzzles lidos, ${result.matches.toLocaleString('pt-BR')} correspondem${kept}. Lista salva.`
      onScan(file.size, file.size, doneLabel)
      setStatus(doneLabel)
      onApply(result.items, info)
      return true
    } catch (error) {
      if (gen !== runGen.current || controller.signal.aborted) return false
      const message = error instanceof Error ? error.message : String(error)
      setStatus(`Erro ao ler o arquivo: ${message}`)
      return false
    } finally {
      if (gen === runGen.current) {
        filteringRef.current = false
        setFiltering(false)
        abortRef.current = null
      }
    }
  }, [file, done, onApply, onScan])

  useImperativeHandle(ref, () => ({ run: runFilter }), [runFilter])

  function patchDraft(patch: Partial<FilterPrefs>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function patchDraftSort(patch: { sort?: SortKey; order?: 1 | -1 }) {
    setDraft((current) => ({
      ...current,
      sort: patch.sort ?? current.sort,
      order: patch.order ?? current.order,
    }))
  }

  const queryChanged = !sameQuery(draft, filters)
  const sortChanged = !sameSort(draft, filters)
  const viewChanged = draftView !== view
  const dirty = queryChanged || sortChanged || viewChanged
  const applyLabel = !file
    ? 'Salvar filtros'
    : filtering && !dirty
      ? 'Filtrando…'
      : !dirty && resultCount > 0
        ? resultCount === 1
          ? 'Ver 1 resultado'
          : `Ver ${resultCount.toLocaleString('pt-BR')} resultados`
        : 'Ver resultados'

  function applyDraft() {
    if (queryChanged) {
      onChange({ ...draft })
      if (file) void runFilter(draft)
    } else {
      if (sortChanged) onSort({ sort: draft.sort, order: draft.order })
      if (viewChanged) onView(draftView)
    }
    onSheetApply()
  }

  const statusBlock = showProgress ? (
    <ScanProgress value={progress} max={progressMax} label={status || 'Filtrando…'} />
  ) : status ? (
    <div className="hint" role="status">
      {status}
    </div>
  ) : null

  if (mobile) {
    return (
      <BottomSheet
        open={sheetOpen}
        title="Filtros"
        titleId={titleId}
        focusFile={focusFile}
        onClose={onSheetClose}
        footer={
          <>
            <button type="button" className="ghost" onClick={clearDraft}>
              Limpar
            </button>
            <button type="button" className="primary" aria-busy={filtering} onClick={applyDraft}>
              {applyLabel}
            </button>
          </>
        }
      >
        <FilterFields
          prefs={draft}
          fileRef={fileRef}
          onFile={onFile}
          onPatch={patchDraft}
          onToggleTheme={(key) => toggleTheme(key, draft, patchDraft)}
        />
        {statusBlock}
        <p className="hint">Uma nova lista substitui a anterior. Os puzzles feitos continuam marcados.</p>
        <h2 className="sp">4. Lista</h2>
        <ListSettings
          filters={draft}
          view={draftView}
          showView={hasItems}
          onFilters={patchDraft}
          onSort={patchDraftSort}
          onView={setDraftView}
        />
        {hasItems && <FlipControl flipped={flipped} onFlip={onFlip} />}
        {hasItems && <ListActions copied={copied} onCopy={onCopy} onClear={onClearDone} />}
      </BottomSheet>
    )
  }

  return (
    <details className="card filters" ref={rememberDetails}>
      <summary>
        <span className="summary-title">Filtros</span>
      </summary>
      <h2 className="only-desk">Filtros</h2>
      <FilterFields
        prefs={filters}
        fileRef={fileRef}
        onFile={onFile}
        onPatch={onChange}
        onToggleTheme={(key) => toggleTheme(key, filters, onChange)}
      />
      <div className="filter-actions">
        <button type="button" className="ghost" onClick={clearFilters}>
          Limpar filtros
        </button>
        <button type="button" className="primary" disabled={!file || filtering} onClick={() => void runFilter(filters)}>
          {filtering ? 'Filtrando…' : 'Filtrar'}
        </button>
      </div>
      {statusBlock}
      <p className="hint">Uma nova lista substitui a anterior. Os puzzles feitos continuam marcados.</p>
    </details>
  )
}

type FilterFieldsProps = {
  prefs: FilterPrefs
  fileRef: RefObject<HTMLInputElement | null>
  onFile: (file: File | null) => void
  onPatch: (patch: Partial<FilterPrefs>) => void
  onToggleTheme: (key: string) => void
}

function FilterFields({ prefs, fileRef, onFile, onPatch, onToggleTheme }: FilterFieldsProps) {
  const selected = useMemo(() => new Set(prefs.themes), [prefs.themes])
  return (
    <>
      <h2>1. Arquivo CSV</h2>
      <input
        ref={fileRef}
        className="file"
        type="file"
        accept=".csv,text/csv"
        aria-label="Arquivo CSV do Lichess"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />

      <h2 className="sp">2. Temas</h2>
      <ThemePicker selected={selected} onToggle={onToggleTheme} />
      <div className="row">
        <label className="grow">
          <span>Outros temas (separados por espaço)</span>
          <input
            type="text"
            value={prefs.extra}
            placeholder="ex.: mateIn3 crushing"
            onChange={(event) => onPatch({ extra: event.target.value })}
          />
        </label>
        <label>
          <span>Combinar temas</span>
          <select value={prefs.mode} onChange={(event) => onPatch({ mode: event.target.value === 'any' ? 'any' : 'all' })}>
            <option value="all">Todos (E)</option>
            <option value="any">Qualquer (OU)</option>
          </select>
        </label>
      </div>

      <h2 className="sp">3. Lances, rating e popularidade</h2>
      <DualRange
        label="Lances"
        minLabel="Lances mínimos"
        maxLabel="Lances máximos"
        min={prefs.minMoves}
        max={prefs.maxMoves}
        floor={1}
        ceil={10}
        step={1}
        onChange={(minMoves, maxMoves) => onPatch({ minMoves, maxMoves })}
      />
      <DualRange
        label="Rating"
        minLabel="Rating mínimo"
        maxLabel="Rating máximo"
        min={prefs.minRating}
        max={prefs.maxRating}
        floor={0}
        ceil={4000}
        step={50}
        onChange={(minRating, maxRating) => onPatch({ minRating, maxRating })}
      />
      <DualRange
        label="Popularidade"
        minLabel="Popularidade mínima"
        maxLabel="Popularidade máxima"
        min={prefs.minPop}
        max={prefs.maxPop}
        floor={-100}
        ceil={100}
        step={5}
        onChange={(minPop, maxPop) => onPatch({ minPop, maxPop })}
      />
      <p className="hint">
        Lances = lances do jogador, sem a jogada inicial do adversário. Popularidade vai de -100 a 100.
      </p>
    </>
  )
}

function fileLabel(file: File) {
  return `${file.name} (${(file.size / 1048576).toFixed(0)} MB)`
}

function showOnInput(input: HTMLInputElement | null, file: File) {
  if (!input) return
  try {
    const transfer = new DataTransfer()
    transfer.items.add(file)
    input.files = transfer.files
  } catch {
    /* o arquivo continua disponível para filtrar */
  }
}
