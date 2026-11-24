import { useState } from 'react'

function clamp(value: number, floor: number, ceil: number) {
  if (!Number.isFinite(value)) return floor
  return Math.min(ceil, Math.max(floor, Math.round(value)))
}

function snap(value: number, floor: number, ceil: number, step: number) {
  const steps = Math.round((clamp(value, floor, ceil) - floor) / step)
  return Math.min(ceil, floor + steps * step)
}

export function DualRange({
  label,
  minLabel,
  maxLabel,
  min,
  max,
  floor,
  ceil,
  step,
  onChange,
}: {
  label: string
  minLabel: string
  maxLabel: string
  min: string
  max: string
  floor: number
  ceil: number
  step: number
  onChange: (min: string, max: string) => void
}) {
  const [front, setFront] = useState<'min' | 'max'>('max')
  const lo = clamp(Number(min), floor, ceil)
  const hi = clamp(Number(max), floor, ceil)
  const span = ceil - floor || 1
  const start = Math.min(lo, hi)
  const end = Math.max(lo, hi)

  function writeMin(value: number) {
    const next = snap(value, floor, ceil, step)
    setFront('min')
    onChange(String(next), next > hi ? String(next) : String(hi))
  }

  function writeMax(value: number) {
    const next = snap(value, floor, ceil, step)
    setFront('max')
    onChange(next < lo ? String(next) : String(lo), String(next))
  }

  function valueAt(clientX: number, rect: DOMRect) {
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return snap(floor + ratio * (ceil - floor), floor, ceil, step)
  }

  return (
    <div className="range" role="group" aria-label={label}>
      <div className="range-label">
        <span>{label}</span>
      </div>
      <div
        className="range-track"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).tagName === 'INPUT') return
          const value = valueAt(event.clientX, event.currentTarget.getBoundingClientRect())
          if (lo === hi) {
            if (value >= lo) writeMax(value)
            else writeMin(value)
            return
          }
          if (Math.abs(value - lo) <= Math.abs(value - hi)) writeMin(value)
          else writeMax(value)
        }}
      >
        <div className="range-rail" />
        <div
          className="range-fill"
          style={{ left: `${((start - floor) / span) * 100}%`, right: `${((ceil - end) / span) * 100}%` }}
        />
        <input
          type="range"
          min={floor}
          max={ceil}
          step={step}
          value={lo}
          aria-label={minLabel}
          style={{ zIndex: front === 'min' ? 5 : 3 }}
          onChange={(event) => writeMin(Number(event.target.value))}
        />
        <input
          type="range"
          min={floor}
          max={ceil}
          step={step}
          value={hi}
          aria-label={maxLabel}
          style={{ zIndex: front === 'max' ? 5 : 4 }}
          onChange={(event) => writeMax(Number(event.target.value))}
        />
      </div>
      <p className="range-readout">
        {lo} – {hi}
      </p>
    </div>
  )
}
