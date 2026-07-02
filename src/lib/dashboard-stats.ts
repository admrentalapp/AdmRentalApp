import type { Ticket, TicketEvent, TicketPriority, TicketStatus } from '@/types'

export const SLA_TRIAGE_HOURS = 2
export const SLA_TRIAGE_MS = SLA_TRIAGE_HOURS * 60 * 60 * 1000

const CLOSED_STATUSES: TicketStatus[] = ['concluido', 'cancelado']
const IN_SERVICE_STATUSES: TicketStatus[] = [
  'em_execucao',
  'em_inspecao',
  'aguardando_pecas',
  'aguardando_aprovacao',
]

export type TrendDirection = 'up' | 'down' | 'neutral'

export type MetricTrend = {
  value: number
  direction: TrendDirection
  label: string
}

export type DashboardKpi = {
  value: number
  formatted: string
  trend: MetricTrend
}

export type ChartSlice = {
  name: string
  value: number
  key: string
}

export type SlaDailyPoint = {
  day: string
  label: string
  rate: number
  total: number
  compliant: number
}

export type EquipmentFailureRow = {
  equipmentId: string
  label: string
  count: number
  rate: number
}

export type DashboardRecentTicket = {
  id: string
  ticketNumber: number
  equipmentLabel: string
  siteLabel: string
  openedAt: string
  priority: TicketPriority
  status: TicketStatus
  responsibleName: string
  title: string
}

export type DashboardMetrics = {
  openTickets: DashboardKpi
  inService: DashboardKpi
  completedThisMonth: DashboardKpi
  slaCompliance: DashboardKpi
  stoppedEquipment: DashboardKpi
  avgMaintenanceTime: DashboardKpi
  byStatus: ChartSlice[]
  byPriority: ChartSlice[]
  slaLast7Days: SlaDailyPoint[]
  topEquipmentFailures: EquipmentFailureRow[]
  recentTickets: DashboardRecentTicket[]
  slaBreaches: number
  criticalOpen: number
}

function isClosedStatus(status: TicketStatus) {
  return CLOSED_STATUSES.includes(status)
}

function isClosedAt(ticket: Ticket, at: Date) {
  if (ticket.status === 'cancelado') {
    return new Date(ticket.updated_at) <= at
  }

  if (ticket.closed_at) {
    return new Date(ticket.closed_at) <= at
  }

  return false
}

function wasOpenAt(ticket: Ticket, at: Date) {
  if (new Date(ticket.created_at) > at) return false
  return !isClosedAt(ticket, at)
}

function countOpenAt(tickets: Ticket[], at: Date) {
  return tickets.filter((ticket) => wasOpenAt(ticket, at)).length
}

function countInServiceAt(tickets: Ticket[], at: Date) {
  return tickets.filter((ticket) => {
    if (new Date(ticket.created_at) > at) return false
    if (isClosedAt(ticket, at)) return false
    return IN_SERVICE_STATUSES.includes(ticket.status)
  }).length
}

function monthBounds(offsetMonths: number) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

function countCompletedInMonth(tickets: Ticket[], offsetMonths: number) {
  const { start, end } = monthBounds(offsetMonths)

  return tickets.filter((ticket) => {
    if (ticket.status !== 'concluido' || !ticket.closed_at) return false
    const closed = new Date(ticket.closed_at)
    return closed >= start && closed <= end
  }).length
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }

  return ((current - previous) / previous) * 100
}

function buildTrend(current: number, previous: number, invert = false): MetricTrend {
  const rawChange = percentChange(current, previous)
  const rounded = Math.abs(Math.round(rawChange * 10) / 10)

  if (rounded === 0) {
    return { value: 0, direction: 'neutral', label: '0% vs mês anterior' }
  }

  const improved = invert ? rawChange < 0 : rawChange > 0

  return {
    value: rounded,
    direction: improved ? 'up' : 'down',
    label: `${rounded}% vs mês anterior`,
  }
}

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return '—'

  const totalMinutes = Math.round(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes}min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}min`
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`
}

function triageDeadline(ticket: Ticket) {
  return new Date(new Date(ticket.created_at).getTime() + SLA_TRIAGE_MS)
}

function firstTriageEventAt(ticket: Ticket, events: TicketEvent[]) {
  const ticketEvents = events
    .filter((event) => event.ticket_id === ticket.id)
    .sort(
      (left, right) =>
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
    )

  const statusEvent = ticketEvents.find(
    (event) =>
      event.event_type === 'atualizacao' &&
      event.message.toLowerCase().includes('status alterado'),
  )

  if (statusEvent) {
    return new Date(statusEvent.created_at)
  }

  if (ticket.manager_id && ticket.status !== 'aberto') {
    return new Date(ticket.updated_at)
  }

  if (ticket.status !== 'aberto' && ticket.status !== 'triagem') {
    return new Date(ticket.updated_at)
  }

  return null
}

export function isTicketSlaCompliant(
  ticket: Ticket,
  events: TicketEvent[],
  now = new Date(),
) {
  if (ticket.status === 'cancelado') return true

  const deadline = triageDeadline(ticket)
  const triageAt = firstTriageEventAt(ticket, events)

  if (triageAt) {
    return triageAt.getTime() <= deadline.getTime()
  }

  if (ticket.status === 'aberto' || ticket.status === 'triagem') {
    return now.getTime() <= deadline.getTime()
  }

  return new Date(ticket.updated_at).getTime() <= deadline.getTime()
}

function slaComplianceRate(
  tickets: Ticket[],
  events: TicketEvent[],
  from: Date,
  to: Date,
) {
  const eligible = tickets.filter((ticket) => {
    if (ticket.status === 'cancelado') return false
    const created = new Date(ticket.created_at)
    return created >= from && created <= to
  })

  if (eligible.length === 0) {
    return { rate: 100, total: 0, compliant: 0 }
  }

  const compliant = eligible.filter((ticket) =>
    isTicketSlaCompliant(ticket, events, to),
  ).length

  return {
    rate: (compliant / eligible.length) * 100,
    total: eligible.length,
    compliant,
  }
}

function averageMaintenanceMs(tickets: Ticket[], from: Date, to: Date) {
  const completed = tickets.filter((ticket) => {
    if (ticket.status !== 'concluido' || !ticket.closed_at) return false
    const closed = new Date(ticket.closed_at)
    return closed >= from && closed <= to
  })

  if (completed.length === 0) return null

  const total = completed.reduce((sum, ticket) => {
    return (
      sum +
      (new Date(ticket.closed_at!).getTime() -
        new Date(ticket.created_at).getTime())
    )
  }, 0)

  return total / completed.length
}

function uniqueStoppedEquipment(tickets: Ticket[]) {
  const ids = new Set<string>()

  for (const ticket of tickets) {
    if (!ticket.equipment_id) continue
    if (isClosedStatus(ticket.status)) continue
    ids.add(ticket.equipment_id)
  }

  return ids.size
}

function countStoppedEquipmentAt(tickets: Ticket[], at: Date) {
  const ids = new Set<string>()

  for (const ticket of tickets) {
    if (!ticket.equipment_id) continue
    if (new Date(ticket.created_at) > at) continue
    if (isClosedAt(ticket, at)) continue
    ids.add(ticket.equipment_id)
  }

  return ids.size
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
  }).format(date)
}

function buildSlaSeries(tickets: Ticket[], events: TicketEvent[]) {
  const points: SlaDailyPoint[] = []
  const now = new Date()

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(now)
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - offset)

    const end = new Date(day)
    end.setHours(23, 59, 59, 999)

    const { rate, total, compliant } = slaComplianceRate(tickets, events, day, end)

    points.push({
      day: dayKey(day),
      label: dayLabel(day),
      rate: Math.round(rate * 10) / 10,
      total,
      compliant,
    })
  }

  return points
}

function buildStatusSlices(tickets: Ticket[]) {
  const counts: Partial<Record<TicketStatus, number>> = {}

  for (const ticket of tickets) {
    counts[ticket.status] = (counts[ticket.status] ?? 0) + 1
  }

  return Object.entries(counts)
    .map(([key, value]) => ({
      key,
      name: key,
      value: value ?? 0,
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
}

function buildPrioritySlices(tickets: Ticket[]) {
  const counts: Partial<Record<TicketPriority, number>> = {}

  for (const ticket of tickets) {
    counts[ticket.priority] = (counts[ticket.priority] ?? 0) + 1
  }

  const order: TicketPriority[] = ['critica', 'alta', 'media', 'baixa']

  return order
    .map((priority) => ({
      key: priority,
      name: priority,
      value: counts[priority] ?? 0,
    }))
    .filter((item) => item.value > 0)
}

function buildEquipmentFailures(
  tickets: Ticket[],
  equipmentLabels: Map<string, string>,
) {
  const counts = new Map<string, number>()

  for (const ticket of tickets) {
    if (!ticket.equipment_id) continue
    counts.set(
      ticket.equipment_id,
      (counts.get(ticket.equipment_id) ?? 0) + 1,
    )
  }

  const max = Math.max(...counts.values(), 1)

  return [...counts.entries()]
    .map(([equipmentId, count]) => ({
      equipmentId,
      label: equipmentLabels.get(equipmentId) ?? 'Equipamento',
      count,
      rate: Math.round((count / max) * 100),
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 5)
}

export function computeDashboardMetrics(
  tickets: Ticket[],
  events: TicketEvent[],
  equipmentLabels: Map<string, string>,
  siteLabels: Map<string, string>,
  profileNames: Map<string, string>,
): DashboardMetrics {
  const now = new Date()
  const lastMonthEnd = monthBounds(-1).end
  const currentMonthStart = monthBounds(0).start
  const previousMonthStart = monthBounds(-1).start

  const openNow = tickets.filter((ticket) => !isClosedStatus(ticket.status)).length
  const openLastMonth = countOpenAt(tickets, lastMonthEnd)

  const inServiceNow = tickets.filter(
    (ticket) => !isClosedStatus(ticket.status) && IN_SERVICE_STATUSES.includes(ticket.status),
  ).length
  const inServiceLastMonth = countInServiceAt(tickets, lastMonthEnd)

  const completedThisMonth = countCompletedInMonth(tickets, 0)
  const completedLastMonth = countCompletedInMonth(tickets, -1)

  const slaWindowStart = new Date(now)
  slaWindowStart.setDate(slaWindowStart.getDate() - 30)
  const slaCurrent = slaComplianceRate(tickets, events, slaWindowStart, now)

  const slaPreviousEnd = new Date(slaWindowStart)
  slaPreviousEnd.setMilliseconds(-1)
  const slaPreviousStart = new Date(slaPreviousEnd)
  slaPreviousStart.setDate(slaPreviousStart.getDate() - 30)
  const slaPrevious = slaComplianceRate(
    tickets,
    events,
    slaPreviousStart,
    slaPreviousEnd,
  )

  const stoppedNow = uniqueStoppedEquipment(tickets)
  const stoppedLastMonth = countStoppedEquipmentAt(tickets, lastMonthEnd)

  const avgCurrent = averageMaintenanceMs(tickets, currentMonthStart, now)
  const avgPrevious = averageMaintenanceMs(
    tickets,
    previousMonthStart,
    lastMonthEnd,
  )

  const slaBreaches = tickets.filter((ticket) => {
    if (ticket.status === 'cancelado') return false
    return !isTicketSlaCompliant(ticket, events, now)
  }).length

  const criticalOpen = tickets.filter(
    (ticket) =>
      !isClosedStatus(ticket.status) && ticket.priority === 'critica',
  ).length

  const recentTickets = tickets.slice(0, 8).map((ticket) => ({
    id: ticket.id,
    ticketNumber: ticket.ticket_number,
    equipmentLabel: ticket.equipment_id
      ? equipmentLabels.get(ticket.equipment_id) ?? '—'
      : '—',
    siteLabel: ticket.site_id ? siteLabels.get(ticket.site_id) ?? '—' : '—',
    openedAt: ticket.created_at,
    priority: ticket.priority,
    status: ticket.status,
    responsibleName: ticket.technician_id
      ? profileNames.get(ticket.technician_id) ?? '—'
      : '—',
    title: ticket.title,
  }))

  return {
    openTickets: {
      value: openNow,
      formatted: String(openNow),
      trend: buildTrend(openNow, openLastMonth),
    },
    inService: {
      value: inServiceNow,
      formatted: String(inServiceNow),
      trend: buildTrend(inServiceNow, inServiceLastMonth),
    },
    completedThisMonth: {
      value: completedThisMonth,
      formatted: String(completedThisMonth),
      trend: buildTrend(completedThisMonth, completedLastMonth),
    },
    slaCompliance: {
      value: slaCurrent.rate,
      formatted: formatPercent(slaCurrent.rate),
      trend: buildTrend(slaCurrent.rate, slaPrevious.rate),
    },
    stoppedEquipment: {
      value: stoppedNow,
      formatted: String(stoppedNow),
      trend: buildTrend(stoppedNow, stoppedLastMonth, true),
    },
    avgMaintenanceTime: {
      value: avgCurrent ?? 0,
      formatted: avgCurrent ? formatDuration(avgCurrent) : '—',
      trend: buildTrend(avgCurrent ?? 0, avgPrevious ?? 0, true),
    },
    byStatus: buildStatusSlices(tickets),
    byPriority: buildPrioritySlices(tickets),
    slaLast7Days: buildSlaSeries(tickets, events),
    topEquipmentFailures: buildEquipmentFailures(tickets, equipmentLabels),
    recentTickets,
    slaBreaches,
    criticalOpen,
  }
}
