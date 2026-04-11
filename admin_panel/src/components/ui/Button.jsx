import { Loader } from './Loader.jsx'

const base =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-4 py-3 text-small font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none touch-manipulation sm:min-h-[46px]'

const variants = {
  primary:
    'bg-accent text-accent-foreground shadow-glow hover:brightness-110 active:brightness-95 dark:shadow-glow',
  secondary:
    'border border-border-strong bg-surface text-foreground hover:border-accent/40 hover:bg-surface-muted dark:bg-surface-elevated',
  ghost:
    'bg-transparent text-foreground-muted hover:bg-surface-muted hover:text-foreground active:bg-surface-muted/80',
}

/**
 * @param {object} props
 * @param {'primary' | 'secondary' | 'ghost'} [props.variant]
 * @param {boolean} [props.loading]
 * @param {boolean} [props.disabled]
 */
export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {loading ? (
          <Loader
            size="sm"
            decorative
            className="!border-accent-foreground/30 !border-t-accent-foreground"
          />
        ) : null}
        {children}
      </span>
    </button>
  )
}
