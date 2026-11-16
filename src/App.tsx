import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader.tsx'
import { PuzzleList } from './components/PuzzleList.tsx'
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
import type { DailyProgress, FilterPrefs, PuzzleItem, SortKey, ThemeChoice } from './types.ts'

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
  const mineRef = useRef<HTMLDivElement>(null)
  const savedDone = useRef(done)

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

  function patchFilters(patch: Partial<FilterPrefs>) {
    setFilters((current) => ({ ...current, ...patch }))
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

  function applyList(nextItems: PuzzleItem[], nextInfo: string) {
    setItems(nextItems)
    setInfo(nextInfo)
    setListVersion((version) => version + 1)
    if (!saveList(nextItems, nextInfo)) setSync('Não consegui salvar a lista.')
    mineRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const goalToday = daily.date === todayKey() ? daily.ids.length : 0
  const goalPct = Math.min(100, Math.round((goalToday / daily.goal) * 100))

  return (
    <main>
      <AppHeader
        goalToday={goalToday}
        goalPct={goalPct}
        daily={daily}
        theme={theme}
        onGoal={changeGoal}
        onTheme={setTheme}
      />

      <div className="shell">
        <Suspense fallback={<div className="card filters-fallback">Carregando filtros</div>}>
          <FilterPanel
            done={done}
            startOpen={startOpen}
            filters={filters}
            onChange={patchFilters}
            onApply={applyList}
          />
        </Suspense>
        <div ref={mineRef}>
          <PuzzleList
            items={items}
            info={info}
            done={done}
            sync={sync}
            listVersion={listVersion}
            filters={filters}
            onFilters={patchFilters}
            onSort={changeSort}
            onToggle={toggleDone}
            onClear={clearDone}
          />
        </div>
      </div>
    </main>
  )
}
