import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  CheckSquare,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Filter,
  Gauge,
  Package,
  ShieldAlert,
  Timer,
  Users,
  Wrench,
} from 'lucide-react'
import { DashboardKpiCard } from '@/components/dashboard/dashboard-kpi-card'
import {
  EquipmentFailureChart,
  PriorityDonutChart,
  SlaTrendChart,
  StatusDonutChart,
} from '@/components/dashboard/dashboard-charts'
import { approvalDecisionLabel } from '@/features/tickets/approvals-api'
import { isPartBelowMinimum } from '@/features/inventory/api'
import { computeDashboardMetrics, isTicketSlaCompliant } from '@/lib/dashboard-stats'
import { formatDateTime } from '@/lib/format'
import { priorityLabel, statusLabel } from '@/lib/tickets'
import type {
  ChecklistRun,
  ChecklistTemplate,
  Client,
  ManagedProfile,
  Part,
  PartMovement,
  Ticket,
  TicketApproval,
  TicketEvent,
  TicketPriority,
  TicketStatus,
} from '@/types'
import { isMaintenanceRole } from '@/types'

type ReportPeriod = '7d' | '30d' | '90d' | 'month' | 'all'

type DateRange = {
  from: Date | null
  to: Date
}

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  month: 'Mês atual',
  all: 'Todo o histórico',
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`
}

function formatDurationFromMs(ms: number | null) {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return '—'

  const totalMinutes = Math.round(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes} min`
  if (minutes === 0) return `${hours} h`
  return `${hours} h ${minutes} min`
}

function isClosedStatus(status: TicketStatus) {
  return status === 'concluido' || status === 'cancelado'
}

function getDateRange(period: ReportPeriod): DateRange {
  const to = new Date()

  if (period === 'all') {
    return { from: null, to }
  }

  if (period === 'month') {
    return {
      from: new Date(to.getFullYear(), to.getMonth(), 1, 0, 0, 0, 0),
      to,
    }
  }

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const from = new Date(to)
  from.setHours(0, 0, 0, 0)
  from.setDate(from.getDate() - (days - 1))
  return { from, to }
}

function inRange(value: string | null | undefined, range: DateRange) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  if (!range.from) return date <= range.to
  return date >= range.from && date <= range.to
}

function withinTicketFilters(
  ticket: Ticket,
  filters: {
    clientId: string
    technicianId: string
    status: string
    priority: string
  },
) {
  if (filters.clientId && ticket.client_id !== filters.clientId) return false
  if (filters.technicianId && (ticket.technician_id ?? '') !== filters.technicianId) {
    return false
  }
  if (filters.status && ticket.status !== filters.status) return false
  if (filters.priority && ticket.priority !== filters.priority) return false
  return true
}

type XlsxModule = typeof import('xlsx')

function buildWorksheet(
  xlsx: XlsxModule,
  rows: Array<Array<string | number>>,
) {
  const sheet = xlsx.utils.aoa_to_sheet(rows)

  const widths = rows[0]?.map((_, columnIndex) => {
    const max = rows.reduce((longest, row) => {
      const value = row[columnIndex] ?? ''
      return Math.max(longest, String(value).length)
    }, 10)

    return { wch: Math.min(max + 2, 40) }
  })

  if (widths) {
    sheet['!cols'] = widths
  }

  return sheet
}

function SectionCard({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string
  subtitle?: string
  icon: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card/70 p-6 shadow-lg shadow-black/10 backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{title}</h4>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function TableEmpty({ message }: { message: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function ProgressList({
  rows,
  valueLabel,
}: {
  rows: Array<{ key: string; label: string; value: number; helper?: string }>
  valueLabel?: string
}) {
  if (rows.length === 0) {
    return <TableEmpty message="Sem dados no recorte selecionado." />
  }

  const max = Math.max(...rows.map((row) => row.value), 1)

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{row.label}</p>
              {row.helper && <p className="text-xs text-muted-foreground">{row.helper}</p>}
            </div>
            <p className="shrink-0 text-sm font-semibold text-foreground">
              {row.value}
              {valueLabel ? ` ${valueLabel}` : ''}
            </p>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-linear-to-r from-red-500 to-amber-400"
              style={{ width: `${Math.max(8, Math.round((row.value / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ReportsPage({
  tickets,
  parts,
  events,
  profiles,
  clients,
  siteLabels,
  equipmentLabels,
  approvals,
  checklistRuns,
  checklistTemplates,
  partMovements,
  loading,
  error,
}: {
  tickets: Ticket[]
  parts: Part[]
  events: TicketEvent[]
  profiles: ManagedProfile[]
  clients: Client[]
  siteLabels: Map<string, string>
  equipmentLabels: Map<string, string>
  approvals: TicketApproval[]
  checklistRuns: ChecklistRun[]
  checklistTemplates: ChecklistTemplate[]
  partMovements: PartMovement[]
  loading: boolean
  error: string
}) {
  const [period, setPeriod] = useState<ReportPeriod>('30d')
  const [clientId, setClientId] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [exporting, setExporting] = useState(false)

  const clientMap = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients],
  )
  const profileMap = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile.full_name || 'Sem nome'])),
    [profiles],
  )
  const templateMap = useMemo(
    () => new Map(checklistTemplates.map((template) => [template.id, template.name])),
    [checklistTemplates],
  )
  const partMap = useMemo(
    () => new Map(parts.map((part) => [part.id, part])),
    [parts],
  )
  const maintenanceProfiles = useMemo(
    () => profiles.filter((profile) => isMaintenanceRole(profile.role)),
    [profiles],
  )

  const range = useMemo(() => getDateRange(period), [period])

  const filteredTickets = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          inRange(ticket.created_at, range) &&
          withinTicketFilters(ticket, { clientId, technicianId, status, priority }),
      ),
    [tickets, range, clientId, technicianId, status, priority],
  )

  const filteredTicketIds = useMemo(
    () => new Set(filteredTickets.map((ticket) => ticket.id)),
    [filteredTickets],
  )

  const filteredEvents = useMemo(
    () => events.filter((event) => filteredTicketIds.has(event.ticket_id)),
    [events, filteredTicketIds],
  )

  const filteredApprovals = useMemo(
    () => approvals.filter((approval) => filteredTicketIds.has(approval.ticket_id)),
    [approvals, filteredTicketIds],
  )

  const filteredChecklistRuns = useMemo(
    () =>
      checklistRuns.filter((run) => {
        if (!inRange(run.created_at, range)) return false
        if (technicianId && run.performed_by !== technicianId) return false
        return true
      }),
    [checklistRuns, range, technicianId],
  )

  const filteredPartMovements = useMemo(
    () => partMovements.filter((movement) => inRange(movement.created_at, range)),
    [partMovements, range],
  )

  const dashboardMetrics = useMemo(
    () =>
      computeDashboardMetrics(
        filteredTickets,
        filteredEvents,
        equipmentLabels,
        siteLabels,
        profileMap,
      ),
    [filteredTickets, filteredEvents, equipmentLabels, siteLabels, profileMap],
  )

  const openTickets = useMemo(
    () => filteredTickets.filter((ticket) => !isClosedStatus(ticket.status)).length,
    [filteredTickets],
  )
  const criticalOpen = useMemo(
    () =>
      filteredTickets.filter(
        (ticket) => !isClosedStatus(ticket.status) && ticket.priority === 'critica',
      ).length,
    [filteredTickets],
  )
  const completedInRange = useMemo(
    () =>
      filteredTickets.filter(
        (ticket) => ticket.status === 'concluido' && inRange(ticket.closed_at, range),
      ).length,
    [filteredTickets, range],
  )
  const slaCompliant = useMemo(() => {
    const eligible = filteredTickets.filter((ticket) => ticket.status !== 'cancelado')
    if (eligible.length === 0) return { rate: 100, total: 0, compliant: 0 }

    const compliant = eligible.filter((ticket) =>
      isTicketSlaCompliant(ticket, filteredEvents),
    ).length

    return {
      rate: (compliant / eligible.length) * 100,
      total: eligible.length,
      compliant,
    }
  }, [filteredTickets, filteredEvents])

  const avgResolutionMs = useMemo(() => {
    const completed = filteredTickets.filter(
      (ticket) => ticket.status === 'concluido' && inRange(ticket.closed_at, range),
    )

    if (completed.length === 0) return null

    const total = completed.reduce((sum, ticket) => {
      return (
        sum +
        (new Date(ticket.closed_at!).getTime() - new Date(ticket.created_at).getTime())
      )
    }, 0)

    return total / completed.length
  }, [filteredTickets, range])

  const pendingApprovals = useMemo(
    () =>
      filteredTickets.filter((ticket) => ticket.status === 'aguardando_aprovacao').length,
    [filteredTickets],
  )

  const lowStockParts = useMemo(
    () => parts.filter(isPartBelowMinimum).sort((a, b) => a.current_stock - b.current_stock),
    [parts],
  )

  const checklistCompletion = useMemo(() => {
    if (filteredChecklistRuns.length === 0) return 0
    const completed = filteredChecklistRuns.filter((run) => run.status === 'concluido').length
    return (completed / filteredChecklistRuns.length) * 100
  }, [filteredChecklistRuns])

  const technicianRows = useMemo(() => {
    const counts = new Map<
      string,
      { label: string; active: number; completed: number; total: number }
    >()

    for (const ticket of filteredTickets) {
      const key = ticket.technician_id ?? 'sem-tecnico'
      const current = counts.get(key) ?? {
        label: ticket.technician_id
          ? profileMap.get(ticket.technician_id) ?? 'Sem nome'
          : 'Sem técnico atribuído',
        active: 0,
        completed: 0,
        total: 0,
      }

      current.total += 1
      if (ticket.status === 'concluido') current.completed += 1
      if (!isClosedStatus(ticket.status)) current.active += 1
      counts.set(key, current)
    }

    return [...counts.entries()]
      .map(([key, value]) => ({
        key,
        label: value.label,
        value: value.total,
        helper: `${value.active} ativos · ${value.completed} concluídos`,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6)
  }, [filteredTickets, profileMap])

  const clientRows = useMemo(() => {
    const counts = new Map<string, number>()

    for (const ticket of filteredTickets) {
      counts.set(ticket.client_id, (counts.get(ticket.client_id) ?? 0) + 1)
    }

    return [...counts.entries()]
      .map(([id, value]) => ({
        key: id,
        label: clientMap.get(id) ?? 'Cliente',
        value,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6)
  }, [filteredTickets, clientMap])

  const siteRows = useMemo(() => {
    const counts = new Map<string, number>()

    for (const ticket of filteredTickets) {
      const key = ticket.site_id ?? 'sem-obra'
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    return [...counts.entries()]
      .map(([id, value]) => ({
        key: id,
        label: id === 'sem-obra' ? 'Sem obra informada' : siteLabels.get(id) ?? 'Obra',
        value,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6)
  }, [filteredTickets, siteLabels])

  const checklistRows = useMemo(() => {
    const counts = new Map<
      string,
      { total: number; completed: number; inProgress: number }
    >()

    for (const run of filteredChecklistRuns) {
      const current = counts.get(run.template_id) ?? {
        total: 0,
        completed: 0,
        inProgress: 0,
      }
      current.total += 1
      if (run.status === 'concluido') current.completed += 1
      else current.inProgress += 1
      counts.set(run.template_id, current)
    }

    return [...counts.entries()]
      .map(([templateId, value]) => ({
        key: templateId,
        label: templateMap.get(templateId) ?? 'Checklist',
        value: value.total,
        helper: `${value.completed} concluídos · ${value.inProgress} em andamento`,
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6)
  }, [filteredChecklistRuns, templateMap])

  const movementRows = useMemo(() => {
    const counts = new Map<string, number>()

    for (const movement of filteredPartMovements) {
      counts.set(movement.part_id, (counts.get(movement.part_id) ?? 0) + movement.quantity)
    }

    return [...counts.entries()]
      .map(([partId, value]) => ({
        key: partId,
        label: partMap.get(partId)?.name ?? 'Peça',
        value,
        helper: partMap.get(partId)?.sku ?? '',
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 6)
  }, [filteredPartMovements, partMap])

  const recentApprovals = useMemo(
    () => filteredApprovals.slice(0, 6),
    [filteredApprovals],
  )

  const recentTickets = useMemo(
    () =>
      filteredTickets.slice(0, 8).map((ticket) => ({
        ...ticket,
        clientLabel: clientMap.get(ticket.client_id) ?? 'Cliente',
        siteLabel: ticket.site_id ? siteLabels.get(ticket.site_id) ?? '—' : '—',
        equipmentLabel: ticket.equipment_id
          ? equipmentLabels.get(ticket.equipment_id) ?? '—'
          : '—',
        technicianLabel: ticket.technician_id
          ? profileMap.get(ticket.technician_id) ?? '—'
          : '—',
      })),
    [filteredTickets, clientMap, siteLabels, equipmentLabels, profileMap],
  )

  async function exportWorkbook() {
    setExporting(true)
    try {
      const xlsx = await import('xlsx')
      const workbook = xlsx.utils.book_new()

    const summaryRows: Array<Array<string | number>> = [
      ['Filtro', 'Valor'],
      ['Período', PERIOD_LABELS[period]],
      ['Cliente', clientId ? clientMap.get(clientId) ?? clientId : 'Todos'],
      [
        'Técnico',
        technicianId ? profileMap.get(technicianId) ?? technicianId : 'Todos',
      ],
      ['Status', status ? statusLabel(status as TicketStatus) : 'Todos'],
      ['Prioridade', priority ? priorityLabel(priority as TicketPriority) : 'Todas'],
      [],
      ['Indicador', 'Valor'],
      ['Chamados no recorte', filteredTickets.length],
      ['Chamados abertos', openTickets],
      ['Chamados críticos abertos', criticalOpen],
      ['Concluídos no recorte', completedInRange],
      ['SLA de triagem', formatPercent(slaCompliant.rate)],
      ['Chamados fora do SLA', dashboardMetrics.slaBreaches],
      ['Tempo médio de resolução', formatDurationFromMs(avgResolutionMs)],
      ['Aguardando aprovação', pendingApprovals],
      ['Peças críticas', lowStockParts.length],
      ['Execuções de checklist', filteredChecklistRuns.length],
      ['Conformidade de checklist', formatPercent(checklistCompletion)],
      ['Movimentações de estoque', filteredPartMovements.length],
    ]

    const ticketRows: Array<Array<string | number>> = [
      [
        'OS',
        'Cliente',
        'Obra',
        'Equipamento',
        'Título',
        'Status',
        'Prioridade',
        'Técnico',
        'Abertura',
        'Encerramento',
      ],
      ...filteredTickets.map((ticket) => [
        ticket.ticket_number,
        clientMap.get(ticket.client_id) ?? 'Cliente',
        ticket.site_id ? siteLabels.get(ticket.site_id) ?? '—' : '—',
        ticket.equipment_id ? equipmentLabels.get(ticket.equipment_id) ?? '—' : '—',
        ticket.title,
        statusLabel(ticket.status),
        priorityLabel(ticket.priority),
        ticket.technician_id ? profileMap.get(ticket.technician_id) ?? '—' : '—',
        formatDateTime(ticket.created_at),
        ticket.closed_at ? formatDateTime(ticket.closed_at) : '',
      ]),
    ]

    const stockRows: Array<Array<string | number>> = [
      ['SKU', 'Peça', 'Estoque', 'Mínimo', 'Status'],
      ...parts.map((part) => [
        part.sku,
        part.name,
        part.current_stock,
        part.min_stock,
        isPartBelowMinimum(part) ? 'Abaixo do mínimo' : 'OK',
      ]),
    ]

    const approvalRows: Array<Array<string | number>> = [
      ['OS', 'Decisão', 'Respondido em', 'Observações'],
      ...filteredApprovals.map((approval) => {
        const ticket = tickets.find((item) => item.id === approval.ticket_id)
        return [
          ticket?.ticket_number ?? '',
          approvalDecisionLabel(approval.decision),
          formatDateTime(approval.responded_at),
          approval.notes ?? '',
        ]
      }),
    ]

    const checklistRowsExport: Array<Array<string | number>> = [
      ['Modelo', 'Status', 'Executado por', 'Abertura', 'Conclusão', 'Observações'],
      ...filteredChecklistRuns.map((run) => [
        templateMap.get(run.template_id) ?? 'Checklist',
        run.status === 'concluido' ? 'Concluído' : 'Em andamento',
        profileMap.get(run.performed_by) ?? '—',
        formatDateTime(run.created_at),
        run.completed_at ? formatDateTime(run.completed_at) : '',
        run.notes ?? '',
      ]),
    ]

    const movementRowsExport: Array<Array<string | number>> = [
      ['Peça', 'SKU', 'Tipo', 'Quantidade', 'Data', 'Observações'],
      ...filteredPartMovements.map((movement) => [
        partMap.get(movement.part_id)?.name ?? 'Peça',
        partMap.get(movement.part_id)?.sku ?? '',
        movement.movement_type,
        movement.quantity,
        formatDateTime(movement.created_at),
        movement.notes ?? '',
      ]),
    ]

      xlsx.utils.book_append_sheet(workbook, buildWorksheet(xlsx, summaryRows), 'Resumo')
      xlsx.utils.book_append_sheet(workbook, buildWorksheet(xlsx, ticketRows), 'Chamados')
      xlsx.utils.book_append_sheet(workbook, buildWorksheet(xlsx, stockRows), 'Estoque')
      xlsx.utils.book_append_sheet(
        workbook,
        buildWorksheet(xlsx, approvalRows),
        'Aprovacoes',
      )
      xlsx.utils.book_append_sheet(
        workbook,
        buildWorksheet(xlsx, checklistRowsExport),
        'Checklist',
      )
      xlsx.utils.book_append_sheet(
        workbook,
        buildWorksheet(xlsx, movementRowsExport),
        'Movimentacoes',
      )

      xlsx.writeFile(
        workbook,
        `relatorio-gerencial-${new Date().toISOString().slice(0, 10)}.xlsx`,
      )
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-border bg-card text-sm text-muted-foreground">
        Carregando relatórios...
      </div>
    )
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-br from-card via-card/85 to-background p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-red-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-8 h-72 w-72 rounded-full bg-sky-600/5 blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <FileSpreadsheet size={13} className="text-red-600 dark:text-red-400" />
              Inteligência Gerencial
            </span>
            <h3 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Relatórios
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Indicadores executivos, gargalos operacionais, saúde do estoque,
              conformidade de checklist e exportação profissional em Excel.
            </p>
          </div>

          <button
            type="button"
            disabled={exporting}
            onClick={() => void exportWorkbook()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            <Download size={16} />
            {exporting ? 'Gerando Excel...' : 'Exportar Excel'}
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border/80 bg-card/70 p-5 shadow-lg shadow-black/10">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground" />
          <h4 className="font-semibold text-foreground">Filtros gerenciais</h4>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <label htmlFor="reportPeriod" className="text-sm font-medium text-muted-foreground">
              Período
            </label>
            <select
              id="reportPeriod"
              value={period}
              onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="month">Mês atual</option>
              <option value="all">Todo o histórico</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="reportClient" className="text-sm font-medium text-muted-foreground">
              Cliente
            </label>
            <select
              id="reportClient"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            >
              <option value="">Todos</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reportTechnician"
              className="text-sm font-medium text-muted-foreground"
            >
              Técnico
            </label>
            <select
              id="reportTechnician"
              value={technicianId}
              onChange={(event) => setTechnicianId(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            >
              <option value="">Todos</option>
              {maintenanceProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="reportStatus" className="text-sm font-medium text-muted-foreground">
              Status
            </label>
            <select
              id="reportStatus"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            >
              <option value="">Todos</option>
              <option value="aberto">Aberto</option>
              <option value="triagem">Triagem</option>
              <option value="em_inspecao">Em inspeção</option>
              <option value="aguardando_aprovacao">Aguardando aprovação</option>
              <option value="em_execucao">Em execução</option>
              <option value="aguardando_pecas">Aguardando peças</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reportPriority"
              className="text-sm font-medium text-muted-foreground"
            >
              Prioridade
            </label>
            <select
              id="reportPriority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            >
              <option value="">Todas</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
        </div>
      </section>

      {error && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-linear-to-r from-amber-500/10 to-transparent p-4 text-sm text-amber-800 dark:text-amber-100">
          Alguns dados complementares do relatório não puderam ser carregados: {error}
        </div>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <DashboardKpiCard
          label="Chamados no recorte"
          value={String(filteredTickets.length)}
          trend={{ value: 0, direction: 'neutral', label: 'recorte atual' }}
          icon={ClipboardList}
          accent="red"
          hint="volume selecionado"
        />
        <DashboardKpiCard
          label="Abertos"
          value={String(openTickets)}
          trend={{ value: 0, direction: 'neutral', label: 'foto atual' }}
          icon={Gauge}
          accent="sky"
          hint="backlog ativo"
        />
        <DashboardKpiCard
          label="Críticos abertos"
          value={String(criticalOpen)}
          trend={{ value: 0, direction: 'neutral', label: 'prioridade crítica' }}
          icon={AlertTriangle}
          accent="amber"
          hint="risco operacional"
        />
        <DashboardKpiCard
          label="Concluídos"
          value={String(completedInRange)}
          trend={{ value: 0, direction: 'neutral', label: 'encerrados' }}
          icon={Wrench}
          accent="emerald"
          hint="no período"
        />
        <DashboardKpiCard
          label="SLA de triagem"
          value={formatPercent(slaCompliant.rate)}
          trend={{ value: 0, direction: 'neutral', label: 'prazo de triagem' }}
          icon={Timer}
          accent="violet"
          hint={`${slaCompliant.compliant}/${slaCompliant.total} dentro do SLA`}
        />
        <DashboardKpiCard
          label="Tempo médio"
          value={formatDurationFromMs(avgResolutionMs)}
          trend={{ value: 0, direction: 'neutral', label: 'resolução média' }}
          icon={Users}
          accent="cyan"
          hint="chamados concluídos"
        />
        <DashboardKpiCard
          label="Aguardando aprovação"
          value={String(pendingApprovals)}
          trend={{ value: 0, direction: 'neutral', label: 'pendências' }}
          icon={ShieldAlert}
          accent="violet"
          hint="cliente ainda não respondeu"
        />
        <DashboardKpiCard
          label="Peças críticas"
          value={String(lowStockParts.length)}
          trend={{ value: 0, direction: 'neutral', label: 'abaixo do mínimo' }}
          icon={Package}
          accent="amber"
          hint="estoque"
        />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="SLA de triagem"
          subtitle="Últimos 7 dias com base no recorte filtrado"
          icon={<Timer size={18} />}
        >
          <SlaTrendChart data={dashboardMetrics.slaLast7Days} />
        </SectionCard>

        <SectionCard
          title="Distribuição por status"
          subtitle={`Total filtrado: ${filteredTickets.length}`}
          icon={<Gauge size={18} />}
        >
          <StatusDonutChart data={dashboardMetrics.byStatus} />
        </SectionCard>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Distribuição por prioridade"
          subtitle="Entenda o peso do backlog"
          icon={<AlertTriangle size={18} />}
        >
          <PriorityDonutChart data={dashboardMetrics.byPriority} />
        </SectionCard>

        <SectionCard
          title="Equipamentos com mais chamados"
          subtitle="Recorrência de falhas por equipamento"
          icon={<Wrench size={18} />}
        >
          <EquipmentFailureChart data={dashboardMetrics.topEquipmentFailures} />
        </SectionCard>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Carga por técnico"
          subtitle="Volume, chamados ativos e concluídos"
          icon={<Users size={18} />}
        >
          <ProgressList rows={technicianRows} valueLabel="OS" />
        </SectionCard>

        <SectionCard
          title="Clientes com maior demanda"
          subtitle="Onde a operação está mais concentrada"
          icon={<ClipboardList size={18} />}
        >
          <ProgressList rows={clientRows} valueLabel="OS" />
        </SectionCard>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Obras com mais chamados"
          subtitle="Foco geográfico da demanda"
          icon={<ClipboardList size={18} />}
        >
          <ProgressList rows={siteRows} valueLabel="OS" />
        </SectionCard>

        <SectionCard
          title="Checklists por modelo"
          subtitle={`Conformidade geral: ${formatPercent(checklistCompletion)}`}
          icon={<CheckSquare size={18} />}
        >
          <ProgressList rows={checklistRows} valueLabel="exec." />
        </SectionCard>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Peças mais movimentadas"
          subtitle="Sinal de consumo e pressão no estoque"
          icon={<Package size={18} />}
        >
          <ProgressList rows={movementRows} valueLabel="un" />
        </SectionCard>

        <SectionCard
          title="Estoque crítico"
          subtitle="Peças abaixo do mínimo"
          icon={<AlertTriangle size={18} />}
        >
          {lowStockParts.length === 0 ? (
            <TableEmpty message="Nenhuma peça abaixo do estoque mínimo." />
          ) : (
            <div className="space-y-3">
              {lowStockParts.slice(0, 8).map((part) => (
                <div
                  key={part.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {part.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{part.sku}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {part.current_stock} / {part.min_stock}
                    </p>
                    <p className="text-xs text-muted-foreground">estoque / mínimo</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <SectionCard
          title="Aprovações recentes"
          subtitle="Decisões do cliente dentro do recorte"
          icon={<ShieldAlert size={18} />}
        >
          {recentApprovals.length === 0 ? (
            <TableEmpty message="Sem aprovações registradas no recorte." />
          ) : (
            <div className="space-y-3">
              {recentApprovals.map((approval) => {
                const ticket = tickets.find((item) => item.id === approval.ticket_id)
                return (
                  <div
                    key={approval.id}
                    className="rounded-xl border border-border bg-background/60 px-4 py-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          #{ticket?.ticket_number ?? '—'} · {ticket?.title ?? 'Chamado'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(approval.responded_at)}
                        </p>
                      </div>
                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                          approval.decision === 'aprovado'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        }`}
                      >
                        {approvalDecisionLabel(approval.decision)}
                      </span>
                    </div>
                    {approval.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">{approval.notes}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Chamados recentes"
          subtitle="Últimos registros do recorte filtrado"
          icon={<ClipboardList size={18} />}
        >
          {recentTickets.length === 0 ? (
            <TableEmpty message="Ainda não há chamados para exibir neste recorte." />
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-border bg-background/60 px-4 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        #{ticket.ticket_number} · {ticket.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {ticket.clientLabel} · {ticket.siteLabel} · {formatDateTime(ticket.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                        {priorityLabel(ticket.priority)}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                        {statusLabel(ticket.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </section>
    </>
  )
}
