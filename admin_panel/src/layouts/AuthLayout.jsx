import { ThemeToggle } from '../components/ui/ThemeToggle.jsx'

export function AuthLayout({ children, theme, onToggleTheme }) {
  return (
    <div className="flex min-h-dvh flex-col transition-colors duration-theme">
      <header className="relative z-20 flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated font-mono text-small font-semibold text-accent ring-1 ring-accent/25 dark:bg-surface-muted dark:ring-accent/20"
            aria-hidden="true"
          >
            M
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_rgb(var(--color-accent)/0.8)]" />
          </span>
          <div>
            <span className="font-display text-heading-md tracking-tight text-foreground">MIC</span>
            <span className="ml-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-accent">
              admin
            </span>
          </div>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside
          className="relative hidden overflow-hidden border-border bg-surface dark:bg-surface lg:flex lg:w-[44%] lg:max-w-xl lg:flex-col lg:justify-between lg:border-r lg:p-10 xl:p-14"
          aria-label="MIC Admin overview"
        >
          <div className="auth-dot-grid absolute inset-0" />
          <div className="relative z-10">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.28em] text-accent">
              secure channel
            </p>
            <h2 className="mt-5 font-display text-3xl font-bold leading-[1.12] tracking-tight text-foreground xl:text-4xl">
              Operations console
            </h2>
            <p className="mt-5 max-w-sm text-body leading-relaxed text-foreground-muted">
              Real-time control, audit visibility, and role-governed access — engineered for teams running
              critical infrastructure.
            </p>
          </div>
          <div className="relative z-10 mt-12 flex items-center gap-3 font-mono text-[11px] text-foreground-subtle">
            <span className="h-px w-8 bg-accent/60" aria-hidden="true" />
            <span>TLS 1.3 · MIC-ID</span>
          </div>
        </aside>

        <main className="auth-dot-grid relative flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
          <div className="relative z-10 w-full max-w-[420px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
