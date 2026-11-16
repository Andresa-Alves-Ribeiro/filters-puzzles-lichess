import { useState } from 'react'
import { describeFilter, filterCsv, isCompressed } from '../filterCsv.ts'
import { DEFAULT_THEME, THEMES } from '../themes.ts'
import type { FilterResult, PuzzleItem } from '../types.ts'

type FilterPanelProps = {
  done: Set<string>
  startOpen: boolean
  onApply: (items: PuzzleItem[], info: string) => void
}

export function FilterPanel({ done, startOpen, onApply }: FilterPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [selected, setSelected] = useState<Set<string>>(() => new Set([DEFAULT_THEME]))
  const [extra, setExtra] = useState('')
  const [mode, setMode] = useState<'all' | 'any'>('all')
  const [minMoves, setMinMoves] = useState('1')
  const [maxMoves, setMaxMoves] = useState('1')
  const [minRating, setMinRating] = useState('0')
  const [maxRating, setMaxRating] = useState('4000')
  const [limit, setLimit] = useState('500')
  const [random, setRandom] = useState(true)
  const [order, setOrder] = useState<1 | -1>(1)
  const [skipDone, setSkipDone] = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMax, setProgressMax] = useState(1)
  const [status, setStatus] = useState('')

  function rememberDetails(node: HTMLDetailsElement | null) {
    if (node && node.dataset.ready !== '1') {
      node.open = startOpen
      node.dataset.ready = '1'
    }
  }

  function toggleTheme(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
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
    const themes = [...selected, ...extra.trim().split(/\s+/).filter(Boolean)]
    const mn = +minMoves || 1
    const mx = +maxMoves || 999
    const rmin = +minRating
    const rmax = +maxRating
    const lim = +limit || 500
    setFiltering(true)
    setShowProgress(true)
    setProgress(0)
    setProgressMax(file.size)
    try {
      const result: FilterResult = await filterCsv(
        file,
        {
          themes,
          mode,
          minMoves: mn,
          maxMoves: mx,
          minRating: rmin,
          maxRating: rmax,
          limit: lim,
          random,
          order,
          skipDone,
          done,
        },
        (p) => {
          setProgress(p.read)
          setStatus(
            `${p.rows.toLocaleString('pt-BR')} puzzles lidos, ${p.matches.toLocaleString('pt-BR')} encontrados`,
          )
        },
      )
      setProgress(file.size)
      const info = describeFilter(themes, mode === 'all', mn, mx, rmin, rmax)
      const kept =
        result.matches > result.items.length
          ? ` (guardados ${result.items.length.toLocaleString('pt-BR')})`
          : ''
      setStatus(
        `${result.rows.toLocaleString('pt-BR')} puzzles lidos, ${result.matches.toLocaleString('pt-BR')} correspondem${kept}. Lista salva.`,
      )
      onApply(result.items, info)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setStatus(`Erro ao ler o arquivo: ${message}`)
    } finally {
      setFiltering(false)
    }
  }

  return (
    <details className="card" ref={rememberDetails}>
      <summary>Filtrar novo CSV</summary>

      <h2>1. Arquivo CSV (já descompactado)</h2>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />

      <h2 className="sp">2. Temas</h2>
      <div id="themes">
        {THEMES.map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              value={key}
              checked={selected.has(key)}
              onChange={() => toggleTheme(key)}
            />{' '}
            {label}
          </label>
        ))}
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <div className="grow">
          <span>Outros temas (separados por espaço)</span>
          <input
            type="text"
            value={extra}
            placeholder="ex.: mateIn3 crushing"
            onChange={(e) => setExtra(e.target.value)}
          />
        </div>
        <div>
          <span>Combinar temas</span>
          <select value={mode} onChange={(e) => setMode(e.target.value === 'any' ? 'any' : 'all')}>
            <option value="all">Todos (E)</option>
            <option value="any">Qualquer (OU)</option>
          </select>
        </div>
      </div>

      <h2 className="sp">3. Lances e rating</h2>
      <div className="row">
        <div>
          <span>Lances mín.</span>
          <input type="number" min={1} value={minMoves} onChange={(e) => setMinMoves(e.target.value)} />
        </div>
        <div>
          <span>Lances máx.</span>
          <input type="number" min={1} value={maxMoves} onChange={(e) => setMaxMoves(e.target.value)} />
        </div>
        <div>
          <span>Rating mín.</span>
          <input type="number" value={minRating} onChange={(e) => setMinRating(e.target.value)} />
        </div>
        <div>
          <span>Rating máx.</span>
          <input type="number" value={maxRating} onChange={(e) => setMaxRating(e.target.value)} />
        </div>
      </div>
      <p className="m">Lances = lances do jogador (sem contar a jogada inicial do adversário).</p>

      <h2 className="sp">4. Resultado</h2>
      <div className="row">
        <div>
          <span>Máx. de puzzles (até 10000)</span>
          <input
            type="number"
            min={1}
            max={10000}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </div>
        <div>
          <span>Seleção</span>
          <select value={random ? '1' : '0'} onChange={(e) => setRandom(e.target.value === '1')}>
            <option value="1">Aleatórios</option>
            <option value="0">Primeiros do arquivo</option>
          </select>
        </div>
        <div>
          <span>Ordem por rating</span>
          <select value={String(order)} onChange={(e) => setOrder(e.target.value === '-1' ? -1 : 1)}>
            <option value="1">Crescente</option>
            <option value="-1">Decrescente</option>
          </select>
        </div>
      </div>
      <label className="skip">
        <input type="checkbox" checked={skipDone} onChange={(e) => setSkipDone(e.target.checked)} /> Pular
        puzzles que já marquei como feitos
      </label>
      <button type="button" disabled={!file || filtering} onClick={() => void onFilter()}>
        Filtrar
      </button>
      <progress className={showProgress ? undefined : 'hide'} value={progress} max={progressMax} />
      <div className="m">{status}</div>
      <p className="m">Uma nova lista substitui a anterior. Os puzzles feitos continuam marcados.</p>
    </details>
  )
}
