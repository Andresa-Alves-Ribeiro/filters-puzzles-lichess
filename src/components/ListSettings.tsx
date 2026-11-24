import type { FilterPrefs, SortKey, ViewMode } from '../types.ts'

type ListSettingsProps = {
  filters: FilterPrefs
  view: ViewMode
  showView: boolean
  onFilters: (patch: Partial<FilterPrefs>) => void
  onSort: (patch: { sort?: SortKey; order?: 1 | -1 }) => void
  onView: (view: ViewMode) => void
}

export function ListSettings({ filters, view, showView, onFilters, onSort, onView }: ListSettingsProps) {
  return (
    <>
      <div className="row tools settings">
        {showView && (
          <div>
            <span>Mostrar</span>
            <select value={view} onChange={(event) => onView(event.target.value === 'pend' ? 'pend' : 'all')}>
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
    </>
  )
}

type FlipControlProps = {
  flipped: boolean
  onFlip: () => void
}

export function FlipControl({ flipped, onFlip }: FlipControlProps) {
  return (
    <div className="row tools">
      <div>
        <span>Tabuleiro</span>
        <button type="button" className="ghost" onClick={onFlip}>
          {flipped ? 'Pretas embaixo' : 'Brancas embaixo'}
        </button>
      </div>
    </div>
  )
}

type ListActionsProps = {
  copied: boolean
  onCopy: () => void
  onClear: () => void
}

export function ListActions({ copied, onCopy, onClear }: ListActionsProps) {
  return (
    <div className="row actions">
      <button type="button" className="copy" onClick={onCopy}>
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
      <button type="button" className="danger" onClick={onClear}>
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
  )
}
