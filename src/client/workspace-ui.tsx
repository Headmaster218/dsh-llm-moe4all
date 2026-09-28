import { useEffect, useRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ChevronDown, CircleHelp, LoaderCircle, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Moe4AllLocaleKey } from './locales.js'

export type Translate = (key: Moe4AllLocaleKey) => string
export function Button({
  icon: Icon,
  children,
  kind = 'default',
  busy,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon | undefined
  kind?: 'default' | 'primary' | 'danger' | 'ghost'
  busy?: boolean
}) {
  return (
    <button
      type="button"
      {...props}
      className={`m4a-btn m4a-btn--${kind} ${props.className ?? ''}`}
      disabled={props.disabled || busy}
    >
      {busy ? (
        <LoaderCircle size={16} className="m4a-spin" />
      ) : Icon ? (
        <Icon size={16} aria-hidden="true" />
      ) : null}
      {children}
    </button>
  )
}
export function IconButton({
  icon: Icon,
  label,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      {...props}
      className={`m4a-icon-btn ${props.className ?? ''}`}
      aria-label={label}
      title={label}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  )
}
export function Field({
  label,
  help,
  children,
  className = '',
}: {
  label: string
  help?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`m4a-field ${className}`}>
      <span className="m4a-field-label">
        {label}
        {help && (
          <span tabIndex={0} className="m4a-help" aria-label={help}>
            <CircleHelp size={13} />
            <span role="tooltip">{help}</span>
          </span>
        )}
      </span>
      {children}
    </label>
  )
}
export function Toggle({
  label,
  checked,
  onChange,
  disabled,
  detail,
}: {
  label: string
  checked: boolean
  onChange(value: boolean): void
  disabled?: boolean
  detail?: string
}) {
  return (
    <label className="m4a-toggle-row">
      <span>
        <span className="m4a-toggle-label">{label}</span>
        {detail && <small>{detail}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="m4a-switch" aria-hidden="true" />
    </label>
  )
}
export function Disclosure({
  title,
  children,
  icon: Icon,
  open = false,
}: {
  title: string
  children: ReactNode
  icon?: LucideIcon
  open?: boolean
}) {
  return (
    <details className="m4a-disclosure" open={open || undefined}>
      <summary>
        {Icon && <Icon size={16} />}
        <span>{title}</span>
        <ChevronDown size={15} />
      </summary>
      <div className="m4a-disclosure-body">{children}</div>
    </details>
  )
}
export function Dialog({
  title,
  children,
  onClose,
  actions,
  closeLabel,
}: {
  title: string
  children: ReactNode
  onClose(): void
  actions?: ReactNode
  closeLabel: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const element = ref.current
    element?.showModal()
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !element?.open) return
      event.preventDefault()
      event.stopImmediatePropagation()
      close.current()
    }
    window.addEventListener('keydown', escape, true)
    return () => {
      window.removeEventListener('keydown', escape, true)
      element?.close()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="m4a-dialog"
      aria-label={title}
      onKeyDown={(event) => {
        if (event.key === 'Escape') event.stopPropagation()
      }}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="m4a-dialog-inner">
        <header>
          <h3>{title}</h3>
          <IconButton icon={X} label={closeLabel} onClick={onClose} />
        </header>
        <div className="m4a-dialog-body">{children}</div>
        {actions && <footer>{actions}</footer>}
      </div>
    </dialog>
  )
}
export function Transfer({
  label,
  detail,
  percent,
  error,
  actions,
}: {
  label: string
  detail?: string | undefined
  percent?: number | undefined
  error?: string | undefined
  actions?: ReactNode
}) {
  return (
    <div className={`m4a-transfer${error ? ' m4a-transfer--error' : ''}`} role="status">
      <div className="m4a-transfer-heading">
        <strong>{label}</strong>
        <span>{percent === undefined ? '' : `${Math.min(100, Math.max(0, percent)).toFixed(1)}%`}</span>
        {actions}
      </div>
      <progress aria-label={label} max={100} value={percent} />
      {detail && <small>{detail}</small>}
      {error && <p>{error}</p>}
    </div>
  )
}
