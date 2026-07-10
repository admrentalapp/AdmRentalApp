import type { ReactNode } from 'react'
import { AppLogo } from '@/components/shared/app-logo'
import { cn } from '@/lib/utils'

/** Moldura que imita a interface real do ADM Manutenção. */
export function HelpAppFrame({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/80 bg-background shadow-xl shadow-black/10',
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <AppLogo className="h-6 w-auto max-w-[72px] object-contain" />
          <span className="truncate text-xs font-medium text-muted-foreground">
            ADM Manutenção · {title}
          </span>
        </div>
      </div>
      <div className="bg-card/40 p-3 sm:p-5">{children}</div>
    </div>
  )
}

export function HelpCallout({
  tone = 'tip',
  title,
  children,
}: {
  tone?: 'tip' | 'warn' | 'info'
  title: string
  children: ReactNode
}) {
  const styles = {
    tip: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-800 dark:text-emerald-200',
    warn: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200',
    info: 'border-sky-500/25 bg-sky-500/8 text-sky-800 dark:text-sky-200',
  } as const

  return (
    <div className={cn('rounded-2xl border p-4 text-sm', styles[tone])}>
      <p className="font-semibold">{title}</p>
      <div className="mt-1.5 opacity-90">{children}</div>
    </div>
  )
}

export function HelpStep({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow-lg shadow-red-600/25">
        {number}
      </div>
      <div className="min-w-0 flex-1 pb-6">
        <h4 className="font-semibold text-foreground">{title}</h4>
        <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  )
}
