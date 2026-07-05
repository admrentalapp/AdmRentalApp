import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react'
import type { MetricTrend } from '@/lib/dashboard-stats'

export type KpiAccent = 'red' | 'sky' | 'emerald' | 'violet' | 'amber' | 'cyan'

const ACCENT_STYLES: Record<
  KpiAccent,
  { icon: string; glow: string; ring: string; topLine: string }
> = {
  red: {
    icon: 'bg-red-500/10 text-red-600 dark:text-red-400',
    glow: 'from-red-500/10',
    ring: 'group-hover:border-red-500/40',
    topLine: 'from-red-500/90 via-red-400/70 to-transparent',
  },
  sky: {
    icon: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    glow: 'from-sky-500/10',
    ring: 'group-hover:border-sky-500/40',
    topLine: 'from-sky-500/90 via-cyan-400/70 to-transparent',
  },
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    glow: 'from-emerald-500/10',
    ring: 'group-hover:border-emerald-500/40',
    topLine: 'from-emerald-500/90 via-emerald-400/70 to-transparent',
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    glow: 'from-violet-500/10',
    ring: 'group-hover:border-violet-500/40',
    topLine: 'from-violet-500/90 via-fuchsia-400/70 to-transparent',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    glow: 'from-amber-500/10',
    ring: 'group-hover:border-amber-500/40',
    topLine: 'from-amber-500/90 via-orange-400/70 to-transparent',
  },
  cyan: {
    icon: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    glow: 'from-cyan-500/10',
    ring: 'group-hover:border-cyan-500/40',
    topLine: 'from-cyan-500/90 via-sky-400/70 to-transparent',
  },
}

export function DashboardKpiCard({
  label,
  value,
  trend,
  hint,
  icon: Icon,
  accent = 'red',
  invertTrendColor = false,
}: {
  label: string
  value: string
  trend: MetricTrend
  hint?: string
  icon: LucideIcon
  accent?: KpiAccent
  invertTrendColor?: boolean
}) {
  const isPositive = trend.direction === 'up'
  const isNeutral = trend.direction === 'neutral'
  const styles = ACCENT_STYLES[accent]

  const trendGood =
    (isPositive && !invertTrendColor) || (!isPositive && invertTrendColor)

  const trendClass = isNeutral
    ? 'bg-muted/80 text-muted-foreground'
    : trendGood
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : 'bg-red-500/10 text-red-600 dark:text-red-400'

  const TrendIcon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-5 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 ${styles.ring}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r ${styles.topLine}`}
      />
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-linear-to-br to-transparent blur-2xl ${styles.glow}`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <Icon size={18} />
        </div>
      </div>

      <p className="relative mt-4 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>

      <div className="relative mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${trendClass}`}
        >
          <TrendIcon size={12} />
          {trend.value}%
        </span>
        <span className="text-xs text-muted-foreground">
          {hint ?? 'vs mês anterior'}
        </span>
      </div>
    </div>
  )
}
