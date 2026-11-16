import { useEffect, useRef, useState } from 'react'
import { FilterPanel } from './components/FilterPanel.tsx'
import { PuzzleList } from './components/PuzzleList.tsx'
import { loadDone, loadList, saveDone, saveList } from './storage.ts'
import type { PuzzleItem } from './types.ts'

const SYNC_LOCAL = 'Sem conta conectada: o progresso fica salvo só neste navegador.'

export default function App() {
  const [boot] = useState(() => loadList())
  const [items, setItems] = useState<PuzzleItem[]>(() => boot?.items ?? [])
  const [info, setInfo] = useState(() => boot?.info ?? '')
  const [done, setDone] = useState<Set<string>>(() => loadDone())
  const [sync, setSync] = useState(SYNC_LOCAL)
  const [listVersion, setListVersion] = useState(0)
  const [startOpen] = useState(() => (boot?.items.length ?? 0) === 0)
  const mineRef = useRef<HTMLDivElement>(null)
  const savedDone = useRef(done)

  useEffect(() => {
    if (savedDone.current === done) return
    savedDone.current = done
    const timer = window.setTimeout(() => {
      if (!saveDone(done)) setSync('Não consegui salvar agora. Tente de novo.')
    }, 500)
    return () => window.clearTimeout(timer)
  }, [done])

  function toggleDone(id: string, checked: boolean) {
    setDone((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function clearDone() {
    setDone(new Set())
  }

  function applyList(nextItems: PuzzleItem[], nextInfo: string) {
    setItems(nextItems)
    setInfo(nextInfo)
    setListVersion((v) => v + 1)
    if (!saveList(nextItems, nextInfo)) setSync('Não consegui salvar a lista.')
    mineRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main>
      <h1>♟️ Filtro de puzzles do Lichess</h1>
      <p className="s">
        Filtre o CSV no notebook. A lista fica salva na sua conta e os puzzles que você marcar como feitos ficam
        lembrados.
      </p>
      <div ref={mineRef}>
        <PuzzleList
          items={items}
          info={info}
          done={done}
          sync={sync}
          listVersion={listVersion}
          onToggle={toggleDone}
          onClear={clearDone}
        />
      </div>
      <FilterPanel done={done} startOpen={startOpen} onApply={applyList} />
    </main>
  )
}
