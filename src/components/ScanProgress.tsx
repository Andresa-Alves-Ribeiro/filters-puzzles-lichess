import { useId } from 'react'

type ScanProgressProps = {
  value: number
  max: number
  label: string
  compact?: boolean
}

export function ScanProgress({ value, max, label, compact = false }: ScanProgressProps) {
  const labelId = useId()
  const total = Math.max(max, 1)
  const pct = Math.min(100, Math.max(0, Math.round((value / total) * 100)))
  return (
    <div className={compact ? 'scan scan-compact' : 'scan'} role="status">
      <div className="scan-head">
        <p id={labelId} className="scan-label">
          {label}
        </p>
        <strong className="scan-pct">{pct}%</strong>
      </div>
      <div
        className="scan-track"
        role="progressbar"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
