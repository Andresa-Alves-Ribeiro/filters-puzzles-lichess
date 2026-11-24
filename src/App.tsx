import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { activeChips } from './activeFilters.ts'
import { AppHeader } from './components/AppHeader.tsx'
import { FilterChips } from './components/FilterChips.tsx'
import { ScanProgress } from './components/ScanProgress.tsx'
import { type FilterPanelHandle } from './components/FilterPanel.tsx'
import { PuzzleList, type PuzzleListHandle } from './components/PuzzleList.tsx'
import {
  advanceDaily,
  loadDaily,
  loadDone,
  loadFilters,
  loadList,
  loadTheme,
  saveDaily,
  saveDone,
  saveFilters,
  saveList,
  saveTheme,
  todayKey,
} from './storage.ts'
import { sortItems } from './sortItems.ts'
import { TRAINING_URL } from './themes.ts'
import type { DailyProgress, FilterPrefs, PuzzleItem, SortKey, ThemeChoice, ViewMode } from './types.ts'
import { useMediaQuery } from './useMediaQuery.ts'

const FilterPanel = lazy(() =>
  import('./components/FilterPanel.tsx').then((module) => ({ default: module.FilterPanel })),
)

const SYNC_LOCAL = 'O progresso fica salvo só neste navegador.'

export default function App() {
  const [boot] = useState(() => loadList())
  const [items, setItems] = useState<PuzzleItem[]>(() => boot?.items ?? [])
  const [info, setInfo] = useState(() => boot?.info ?? '')
  const [done, setDone] = useState<Set<string>>(() => loadDone())
  const [sync, setSync] = useState(SYNC_LOCAL)
  const [listVersion, setListVersion] = useState(0)
  const [startOpen] = useState(() => (boot?.items.length ?? 0) === 0)
  const [filters, setFilters] = useState<FilterPrefs>(() => loadFilters())
  const [daily, setDaily] = useState<DailyProgress>(() => loadDaily())
  const [theme, setTheme] = useState<ThemeChoice>(() => loadTheme())
  const [view, setView] = useState<ViewMode>('all')
  const [flipped, setFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [headerHidden, setHeaderHidden] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const [filtering, setFiltering] = useState(false)
  const [hasFile, setHasFile] = useState(false)
  const [focusFile, setFocusFile] = useState(false)
  const [keepDraft, setKeepDraft] = useState(false)
  const [scan, setScan] = useState({ read: 0, total: 1, label: 'Filtrando…' })
  const isDesktop = useMediaQuery('(min-width: 960px)')
  const mobile = !isDesktop
  const mineRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<PuzzleListHandle>(null)
  const filterRef = useRef<FilterPanelHandle>(null)
  const filterBtnRef = useRef<HTMLButtonElement>(null)
  const filtersRef = useRef(filters)
  const sheetPushed = useRef(false)
  const appliedClose = useRef(false)
  const sheetWasOpen = useRef(false)
  const savedDone = useRef(done)
  const copyTimer = useRef<number | null>(null)
  const lastScroll = useRef(0)
  const scrollAcc = useRef(0)
  const headerLock = useRef(false)
  const headerHiddenRef = useRef(false)
  const headerHold = useRef<number | null>(null)
  if (isDesktop && sheetOpen) {
    setKeepDraft(false)
    setSheetOpen(false)
  }

  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    saveFilters(filters)
  }, [filters])

  useEffect(() => {
    saveDaily(daily)
  }, [daily])

  useEffect(() => {
    if (savedDone.current === done) return
    savedDone.current = done
    const timer = window.setTimeout(() => {
      if (!saveDone(done)) setSync('Não consegui salvar agora. Tente de novo.')
    }, 500)
    return () => window.clearTimeout(timer)
  }, [done])

  useEffect(() => {
    function onPop() {
      const applied = appliedClose.current
      appliedClose.current = false
      setFocusFile(false)
      if (!sheetPushed.current) return
      sheetPushed.current = false
      setKeepDraft(applied)
      setSheetOpen(false)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (!isDesktop || !sheetPushed.current) return
    appliedClose.current = false
    history.back()
  }, [isDesktop])

  useEffect(() => {
    if (sheetWasOpen.current && !sheetOpen) filterBtnRef.current?.focus()
    sheetWasOpen.current = sheetOpen
  }, [sheetOpen])

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
      if (headerHold.current) window.clearTimeout(headerHold.current)
    }
  }, [])

  function patchFilters(patch: Partial<FilterPrefs>) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  function commitFilters(patch: Partial<FilterPrefs>) {
    const next = { ...filtersRef.current, ...patch }
    filtersRef.current = next
    setFilters(next)
    void filterRef.current?.run(next)
  }

  function openFilters(target?: 'file') {
    setFocusFile(target === 'file')
    if (!sheetPushed.current) {
      history.pushState({ plSheet: 1 }, '')
      sheetPushed.current = true
    }
    setSheetOpen(true)
  }

  function closeDiscarded() {
    appliedClose.current = false
    if (sheetPushed.current) history.back()
    else {
      setKeepDraft(false)
      setSheetOpen(false)
      setFocusFile(false)
    }
  }

  function closeApplied() {
    appliedClose.current = true
    if (sheetPushed.current) history.back()
    else {
      appliedClose.current = false
      setKeepDraft(true)
      setSheetOpen(false)
      setFocusFile(false)
    }
  }

  function toggleDone(id: string, checked: boolean) {
    setDone((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
    setDaily((prev) => {
      const source = prev.date === todayKey() ? prev.ids : []
      const ids = new Set(source)
      if (checked) ids.add(id)
      else ids.delete(id)
      return advanceDaily(prev, [...ids])
    })
  }

  function clearDone() {
    setDone(new Set())
  }

  function clearMarked() {
    listRef.current?.resetPending()
    clearDone()
  }

  function changeGoal(goal: number) {
    const next = Math.min(100, Math.max(1, goal || 1))
    setDaily((prev) => advanceDaily(prev, prev.date === todayKey() ? prev.ids : [], next))
  }

  function changeSort(patch: { sort?: SortKey; order?: 1 | -1 }) {
    const sort = patch.sort ?? filters.sort
    const order = patch.order ?? filters.order
    patchFilters({ sort, order })
    const sorted = sortItems(items, sort, order)
    setItems(sorted)
    if (sorted.length && !saveList(sorted, info)) setSync('Não consegui salvar a lista.')
  }

  const applyList = useCallback((nextItems: PuzzleItem[], nextInfo: string) => {
    setItems(nextItems)
    setInfo(nextInfo)
    setListVersion((version) => version + 1)
    if (!saveList(nextItems, nextInfo)) setSync('Não consegui salvar a lista.')
    if (window.matchMedia('(min-width: 960px)').matches) {
      mineRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.requestAnimationFrame(() => listRef.current?.scrollToTop())
    }
  }, [])

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

  function holdHeaderToggle() {
    headerLock.current = true
    if (headerHold.current) window.clearTimeout(headerHold.current)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          headerLock.current = false
        })
      })
      return
    }
    headerHold.current = window.setTimeout(() => {
      headerLock.current = false
      headerHold.current = null
    }, 240)
  }

  const onScan = useCallback((read: number, total: number, label: string) => {
    setScan({ read, total, label })
  }, [])

  const onListScroll = useCallback((frame: { scrollTop: number; clientHeight: number; scrollHeight: number }) => {
    const y = frame.scrollTop
    const last = lastScroll.current
    lastScroll.current = y
    const nextTop = y > 2 * window.innerHeight
    setShowTop((prev) => (prev === nextTop ? prev : nextTop))
    if (headerLock.current) return
    if (y < 8) {
      scrollAcc.current = 0
      if (headerHiddenRef.current) {
        headerHiddenRef.current = false
        setHeaderHidden(false)
        holdHeaderToggle()
      }
      return
    }
    if (frame.scrollHeight - frame.clientHeight - y <= 8) {
      scrollAcc.current = 0
      return
    }
    const delta = y - last
    if (delta === 0) return
    if ((delta > 0 && scrollAcc.current < 0) || (delta < 0 && scrollAcc.current > 0)) scrollAcc.current = 0
    scrollAcc.current += delta
    if (scrollAcc.current >= 24 && !headerHiddenRef.current) {
      headerHiddenRef.current = true
      setHeaderHidden(true)
      scrollAcc.current = 0
      holdHeaderToggle()
    } else if (scrollAcc.current <= -24 && headerHiddenRef.current) {
      headerHiddenRef.current = false
      setHeaderHidden(false)
      scrollAcc.current = 0
      holdHeaderToggle()
    }
  }, [])

  const goalToday = daily.date === todayKey() ? daily.ids.length : 0
  const goalPct = Math.min(100, Math.round((goalToday / daily.goal) * 100))
  const listDone = items.filter((item) => done.has(item.i)).length
  const filterCount = activeChips(filters).length
  const filterLabel = filtering ? 'Filtrando…' : filterCount > 0 ? `Filtros · ${filterCount}` : 'Filtros'

  return (
    <main className={mobile && sheetOpen ? 'is-sheet-open' : undefined} inert={mobile && sheetOpen ? true : undefined}>
      <AppHeader
        goalToday={goalToday}
        goalPct={goalPct}
        daily={daily}
        theme={theme}
        onGoal={changeGoal}
        onTheme={setTheme}
        compact={mobile}
        hidden={mobile && headerHidden}
        listDone={listDone}
        listTotal={items.length}
      />
      {mobile && <FilterChips filters={filters} busy={filtering} onPatch={commitFilters} />}
      {mobile && filtering && !sheetOpen && (
        <ScanProgress compact value={scan.read} max={scan.total} label={scan.label} />
      )}

      <div className="shell">
        <Suspense fallback={mobile ? null : <div className="card filters-fallback">Carregando filtros</div>}>
          <FilterPanel
            ref={filterRef}
            done={done}
            startOpen={startOpen}
            filters={filters}
            onChange={patchFilters}
            onApply={applyList}
            onSort={changeSort}
            onFiltering={setFiltering}
            onScan={onScan}
            onHasFile={setHasFile}
            mobile={mobile}
            sheetOpen={sheetOpen}
            focusFile={focusFile}
            keepDraft={keepDraft}
            onSheetClose={closeDiscarded}
            onSheetApply={closeApplied}
            resultCount={items.length}
            view={view}
            onView={setView}
            hasItems={items.length > 0}
            flipped={flipped}
            copied={copied}
            onFlip={() => setFlipped((value) => !value)}
            onCopy={() => void copyPending()}
            onClearDone={clearMarked}
          />
        </Suspense>
        <div ref={mineRef} className="list-slot">
          <PuzzleList
            ref={listRef}
            items={items}
            info={info}
            done={done}
            sync={sync}
            listVersion={listVersion}
            filters={filters}
            view={view}
            onView={setView}
            mobile={mobile}
            flipped={flipped}
            copied={copied}
            onFlip={() => setFlipped((value) => !value)}
            onCopy={() => void copyPending()}
            onFilters={patchFilters}
            onSort={changeSort}
            onToggle={toggleDone}
            onClear={clearMarked}
            hasFile={hasFile}
            onLoadCsv={() => openFilters('file')}
            onListScroll={onListScroll}
          />
        </div>
      </div>
      {mobile && (
        <div className="filter-bar">
          {showTop && (
            <button type="button" className="ghost to-top" aria-label="Voltar ao topo" onClick={() => listRef.current?.scrollToTop()}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <button ref={filterBtnRef} type="button" className="primary" aria-busy={filtering} onClick={() => openFilters()}>
            {filterLabel}
          </button>
        </div>
      )}
    </main>
  )
}
