import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type BottomSheetProps = {
  open: boolean
  title: string
  titleId: string
  focusFile?: boolean
  onClose: () => void
  children: ReactNode
  footer: ReactNode
}

function tabbables(root: HTMLElement): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  return [...nodes].filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.getClientRects().length > 0)
}

export function BottomSheet({ open, title, titleId, focusFile = false, onClose, children, footer }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const drag = useRef<{ y: number; t: number } | null>(null)

  useEffect(() => {
    if (!open || focusFile) return
    titleRef.current?.focus()
  }, [open, focusFile])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const root = dialogRef.current
    if (!root) return
    const items = tabbables(root)
    if (items.length === 0) {
      event.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (event.shiftKey) {
      if (active === first || !items.includes(active as HTMLElement)) {
        event.preventDefault()
        last?.focus()
      }
      return
    }
    if (active === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    drag.current = { y: event.clientY, t: performance.now() }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !dialogRef.current) return
    const dy = Math.max(0, event.clientY - drag.current.y)
    dialogRef.current.style.transition = 'none'
    dialogRef.current.style.transform = `translateY(${dy}px)`
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !dialogRef.current) return
    const dy = Math.max(0, event.clientY - drag.current.y)
    const dt = Math.max(1, performance.now() - drag.current.t)
    drag.current = null
    if (dy > 96 || (dy > 24 && dy / dt > 0.7)) {
      onClose()
      return
    }
    dialogRef.current.style.transition = ''
    dialogRef.current.style.transform = ''
  }

  if (!open) return null

  return createPortal(
    <div className="sheet-root">
      <button type="button" className="sheet-overlay" tabIndex={-1} aria-label="Fechar filtros" onClick={onClose} />
      <div
        ref={dialogRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        <div
          className="sheet-handle"
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
        <h2 id={titleId} ref={titleRef} tabIndex={-1} className="sheet-title">
          {title}
        </h2>
        <div className="sheet-body">{children}</div>
        <div className="sheet-foot">{footer}</div>
      </div>
    </div>,
    document.body,
  )
}
