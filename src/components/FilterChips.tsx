import { activeChips } from '../activeFilters.ts'
import { DEFAULT_FILTERS, type FilterPrefs } from '../types.ts'

type FilterChipsProps = {
  filters: FilterPrefs
  busy?: boolean
  onPatch: (patch: Partial<FilterPrefs>) => void
}

export function FilterChips({ filters, busy = false, onPatch }: FilterChipsProps) {
  const chips = activeChips(filters)
  if (chips.length === 0) return null

  return (
    <div className="filter-chips" role="region" aria-label="Filtros ativos" aria-busy={busy}>
      {chips.map((chip) => (
        <span key={chip.id} className="filter-chip">
          <span className="filter-chip-label">{chip.label}</span>
          <button
            type="button"
            aria-label={`Remover filtro ${chip.label}`}
            disabled={busy}
            onClick={() => onPatch(chip.patch)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </span>
      ))}
      {chips.length >= 2 && (
        <button
          type="button"
          className="filter-chip clear-all"
          disabled={busy}
          onClick={() => onPatch({ ...DEFAULT_FILTERS, themes: [...DEFAULT_FILTERS.themes] })}
        >
          Limpar tudo
        </button>
      )}
    </div>
  )
}
