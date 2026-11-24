import { useEffect, useId, useRef, useState } from 'react'
import { THEME_GROUPS, themeLabel } from '../themes.ts'

type ThemePickerProps = {
  selected: Set<string>
  onToggle: (key: string) => void
}

export function ThemePicker({ selected, onToggle }: ThemePickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const q = query.trim().toLocaleLowerCase('pt-BR')

  const groups = THEME_GROUPS.map((group) => ({
    ...group,
    themes: group.themes.filter(
      (theme) =>
        !q ||
        theme.label.toLocaleLowerCase('pt-BR').includes(q) ||
        theme.key.toLowerCase().includes(q),
    ),
  })).filter((group) => group.themes.length > 0)

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <div className="picker" ref={boxRef}>
      <div className="picker-box" onClick={() => inputRef.current?.focus()}>
        {[...selected].map((key) => (
          <button
            key={key}
            type="button"
            className="chip"
            aria-label={`Remover ${themeLabel(key)}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onToggle(key)}
          >
            {themeLabel(key)}
            <span aria-hidden="true">×</span>
          </button>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          role="combobox"
          aria-label="Buscar tema"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={selected.size ? 'Buscar tema' : 'Buscar e escolher temas'}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              if (!open) return
              event.stopPropagation()
              setOpen(false)
            }
            if (event.key === 'Backspace' && !query) {
              const last = [...selected].at(-1)
              if (last) onToggle(last)
            }
          }}
        />
      </div>
      {open && (
        <div className="picker-menu" id={listId} role="listbox" aria-multiselectable="true">
          {groups.length === 0 ? (
            <p className="m flat">Nenhum tema encontrado.</p>
          ) : (
            groups.map((group) => (
              <div key={group.id}>
                <div className="picker-group">{group.label}</div>
                {group.themes.map((theme) => {
                  const on = selected.has(theme.key)
                  return (
                    <button
                      key={theme.key}
                      type="button"
                      role="option"
                      aria-selected={on}
                      className={on ? 'picker-opt on' : 'picker-opt'}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onToggle(theme.key)}
                    >
                      <span>{theme.label}</span>
                      <span className="picker-key">{theme.key}</span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
