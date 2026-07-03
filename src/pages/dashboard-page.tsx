import {
  Activity,
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  Clock,
  Download,
  Gauge,
  PieChart,
  Timer,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import {
  EquipmentFailureChart,
  PriorityDonutChart,
  SlaTrendChart,
  StatusDonutChart,
} from '@/components/dashboard/dashboard-charts'
import { DashboardKpiCard } from '@/components/dashboard/dashboard-kpi-card'
import { PriorityBadge, StatusBadge } from '@/components/tickets/badges'
import {
  computeDashboardMetrics,
  SLA_TRIAGE_HOURS,
  type DashboardMetrics,
  type DashboardRecentTicket,
} from '@/lib/dashboard-stats'
import { formatDateTime } from '@/lib/format'
import type { LucideIcon } from 'lucide-react'
import type { ManagedProfile, Ticket, TicketEvent } from '@/types'

function exportRecentTicketsCsv(rows: DashboardRecentTicket[]) {
  const header = [
    'OS',
    'Equipamento',
    'Obra',
    'Abertura',
    'Prioridade',
    'Status',
    'Responsavel',
    'Titulo',
  ]

  const lines = rows.map((row) =>
    [
      row.ticketNumber,
      row.equipmentLabel,
      row.siteLabel,
      formatDateTime(row.openedAt),
      row.priority,
      row.status,
      row.responsibleName,
      row.title,
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(','),
  )

  const blob = new Blob([[header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `chamados-recentes-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  icon: LucideIcon
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-border/80 bg-card/60 p-6 shadow-lg shadow-black/20 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/80 text-foreground">
            <Icon size={17} />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{title}</h4>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  )
}

function AlertBanner({ metrics }: { metrics: DashboardMetrics }) {
  if (metrics.criticalOpen === 0 && metrics.slaBreaches === 0) {
    return null
  }

  const messages: string[] = []

  if (metrics.criticalOpen > 0) {
    messages.push(
      `${metrics.criticalOpen} chamado${metrics.criticalOpen > 1 ? 's' : ''} crítico${metrics.criticalOpen > 1 ? 's' : ''} em aberto`,
    )
  }

  if (metrics.slaBreaches > 0) {
    messages.push(
      `${metrics.slaBreaches} chamado${metrics.slaBreaches > 1 ? 's' : ''} fora do SLA de triagem (${SLA_TRIAGE_HOURS}h)`,
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-linear-to-r from-amber-500/10 to-transparent p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <AlertTriangle size={18} />
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">
          Atenção operacional
        </p>
        <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-100/80">{messages.join(' · ')}</p>
      </div>
    </div>
  )
}

export function DashboardPage({
  tickets,
  events,
  profiles,
  equipmentLabels,
  siteLabels,
  loading,
  onGoToTickets,
}: {
  tickets: Ticket[]
  events: TicketEvent[]
  profiles: ManagedProfile[]
  equipmentLabels: Map<string, string>
  siteLabels: Map<string, string>
  loading: boolean
  onGoToTickets: () => void
}) {
  const profileNames = new Map(
    profiles.map((profile) => [profile.id, profile.full_name || 'Sem nome']),
  )

  const metrics = computeDashboardMetrics(
    tickets,
    events,
    equipmentLabels,
    siteLabels,
    profileNames,
  )

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
        Carregando painel...
      </div>
    )
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-br from-card via-card/80 to-background p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-red-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-sky-600/5 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Activity size={13} className="text-red-600 dark:text-red-400" />
              Visão Geral Operacional
            </span>
            <h3 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Painel de Controle
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Dados em tempo real, decisões inteligentes e acompanhamento de SLA
              de triagem ({SLA_TRIAGE_HOURS}h).
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => exportRecentTicketsCsv(metrics.recentTickets)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              <Download size={16} />
              Exportar
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <DashboardKpiCard
          label="Chamados abertos"
          value={metrics.openTickets.formatted}
          trend={metrics.openTickets.trend}
          icon={ClipboardList}
          accent="red"
        />
        <DashboardKpiCard
          label="Em atendimento"
          value={metrics.inService.formatted}
          trend={metrics.inService.trend}
          icon={Wrench}
          accent="sky"
        />
        <DashboardKpiCard
          label="Concluídos (mês)"
          value={metrics.completedThisMonth.formatted}
          trend={metrics.completedThisMonth.trend}
          icon={TrendingUp}
          accent="emerald"
        />
        <DashboardKpiCard
          label="SLA de triagem"
          value={metrics.slaCompliance.formatted}
          trend={metrics.slaCompliance.trend}
          icon={Gauge}
          accent="violet"
          hint={`meta ${SLA_TRIAGE_HOURS}h · 30 dias`}
        />
        <DashboardKpiCard
          label="Equipamentos parados"
          value={metrics.stoppedEquipment.formatted}
          trend={metrics.stoppedEquipment.trend}
          icon={AlertTriangle}
          accent="amber"
          invertTrendColor
          hint="com chamado ativo"
        />
        <DashboardKpiCard
          label="Tempo médio"
          value={metrics.avgMaintenanceTime.formatted}
          trend={metrics.avgMaintenanceTime.trend}
          icon={Clock}
          accent="cyan"
          invertTrendColor
          hint="manutenção no mês"
        />
      </section>

      <section className="mt-6">
        <AlertBanner metrics={metrics} />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="SLA de triagem"
          subtitle="Últimos 7 dias"
          icon={Timer}
        >
          <SlaTrendChart data={metrics.slaLast7Days} />
        </SectionCard>

        <SectionCard
          title="Chamados por status"
          subtitle={`Total: ${tickets.length}`}
          icon={PieChart}
        >
          <StatusDonutChart data={metrics.byStatus} />
        </SectionCard>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Chamados por prioridade"
          subtitle="Distribuição geral"
          icon={Gauge}
        >
          <PriorityDonutChart data={metrics.byPriority} />
        </SectionCard>

        <SectionCard
          title="Equipamentos com maior falha"
          subtitle="Volume de chamados"
          icon={Wrench}
        >
          <EquipmentFailureChart data={metrics.topEquipmentFailures} />
        </SectionCard>
      </section>

      <section className="mt-5">
        <SectionCard
          title="Chamados recentes"
          subtitle="Atualizações em tempo real"
          icon={ClipboardList}
          action={
            <button
              type="button"
              onClick={onGoToTickets}
              className="inline-flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400 transition hover:text-red-700 dark:hover:text-red-300"
            >
              Ver todos
              <ChevronRight size={16} />
            </button>
          }
        >
          {metrics.recentTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há chamados para exibir.
            </p>
          ) : (
            <div className="-mx-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-y border-border bg-background/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">OS</th>
                    <th className="px-4 py-3 font-medium">Equipamento</th>
                    <th className="px-4 py-3 font-medium">Obra</th>
                    <th className="px-4 py-3 font-medium">Abertura</th>
                    <th className="px-4 py-3 font-medium">Prioridade</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {metrics.recentTickets.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-accent"
                    >
                      <td className="px-6 py-3.5 font-semibold text-foreground">
                        #{row.ticketNumber}
                      </td>
                      <td className="px-4 py-3.5 text-foreground">
                        {row.equipmentLabel}
                      </td>
                      <td className="px-4 py-3.5 text-foreground">
                        {row.siteLabel}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {formatDateTime(row.openedAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <PriorityBadge priority={row.priority} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-6 py-3.5 text-foreground">
                        {row.responsibleName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </section>
    </>
  )
}
