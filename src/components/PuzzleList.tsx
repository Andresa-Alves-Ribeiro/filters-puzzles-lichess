import { useEffect, useRef, useState } from 'react'
import { TRAINING_URL } from '../themes.ts'
import type { PuzzleItem, ViewMode } from '../types.ts'

type PuzzleListProps = {
  items: PuzzleItem[]
  info: string
  done: Set<string>
  sync: string
  listVersion: number
  onToggle: (id: string, checked: boolean) => void
  onClear: () => void
}

export function PuzzleList({ items, info, done, sync, listVersion, onToggle, onClear }: PuzzleListProps) {
  const [view, setView] = useState<ViewMode>('all')
  const [frozenDone, setFrozenDone] = useState(() => new Set(done))
  const [copied, setCopied] = useState(false)
  const [armed, setArmed] = useState(false)
  const doneRef = useRef(done)
  const seenVersion = useRef(listVersion)
  const copyTimer = useRef<number | null>(null)
  const armTimer = useRef<number | null>(null)

  useEffect(() => {
    doneRef.current = done
  }, [done])

  useEffect(() => {
    if (seenVersion.current === listVersion) return
    seenVersion.current = listVersion
    setView('all')
    setFrozenDone(new Set(doneRef.current))
  }, [listVersion])

  const doneCount = items.filter((x) => done.has(x.i)).length
  const visible = items
    .map((x, k) => ({ x, k }))
    .filter((o) => view !== 'pend' || !frozenDone.has(o.x.i))

  function changeView(next: ViewMode) {
    setView(next)
    setFrozenDone(new Set(done))
  }

  async function copyPending() {
    const text = items
      .filter((x) => !done.has(x.i))
      .map((x) => TRAINING_URL + x.i)
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
    <div className="card">
      <h2>Minha lista</h2>
      <div className="m flat">
        {items.length
          ? `${info} · ${doneCount} de ${items.length} feitos`
          : 'Nenhuma lista salva ainda. Use “Filtrar novo CSV” abaixo.'}
      </div>
      <div className={items.length ? 'row tools' : 'row tools hide'}>
        <div>
          <span>Mostrar</span>
          <select value={view} onChange={(e) => changeView(e.target.value === 'pend' ? 'pend' : 'all')}>
            <option value="all">Todos</option>
            <option value="pend">Só pendentes</option>
          </select>
        </div>
        <div>
          <button type="button" className="g" onClick={() => void copyPending()}>
            {copied ? 'Copiado!' : 'Copiar pendentes'}
          </button>
        </div>
        <div>
          <button type="button" className="g" onClick={clearDone}>
            {armed ? 'Toque de novo para confirmar' : 'Limpar feitos'}
          </button>
        </div>
      </div>
      <ul id="ls">
        {visible.map((o) => {
          const checked = done.has(o.x.i)
          return (
            <li key={o.x.i} className={checked ? 'd' : undefined}>
              <input
                type="checkbox"
                checked={checked}
                aria-label="feito"
                onChange={(e) => onToggle(o.x.i, e.target.checked)}
              />
              <span className="n">{o.k + 1}</span>
              <a href={TRAINING_URL + o.x.i} target="_blank" rel="noopener">
                Rating {o.x.r}
              </a>
            </li>
          )
        })}
      </ul>
      <div className="m">{sync}</div>
    </div>
  )
}
