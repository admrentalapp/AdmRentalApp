import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  CheckSquare,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
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
import { formatCnpj } from '@/features/clients/api'
import { isPartBelowMinimum } from '@/features/inventory/api'
import { computeDashboardMetrics, isTicketSlaCompliant } from '@/lib/dashboard-stats'
import { formatDateTime } from '@/lib/format'
import { priorityLabel, statusLabel } from '@/lib/tickets'
import type {
  ChecklistRun,
  ChecklistTemplate,
  Client,
  EquipmentWithAllocation,
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

type XlsxPopulateModule = {
  fromDataAsync(data: ArrayBuffer | Blob): Promise<XlsxPopulateWorkbook>
}

type XlsxPopulateWorkbook = {
  sheet(name: string): XlsxPopulateSheet | undefined
  addSheet(name: string): XlsxPopulateSheet
  outputAsync(): Promise<Blob>
}

type XlsxPopulateSheet = {
  cell(address: string): XlsxPopulateCell
  usedRange(): XlsxPopulateRange | undefined
}

type XlsxPopulateCell = {
  value(): unknown
  value(value: unknown): XlsxPopulateCell
}

type XlsxPopulateRange = {
  endCell(): {
    rowNumber(): number
  }
}

function columnNameToNumber(columnName: string) {
  let total = 0

  for (const char of columnName.toUpperCase()) {
    total = total * 26 + (char.charCodeAt(0) - 64)
  }

  return total
}

function columnNumberToName(columnNumber: number) {
  let current = columnNumber
  let name = ''

  while (current > 0) {
    const remainder = (current - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    current = Math.floor((current - 1) / 26)
  }

  return name
}

function decodeCellAddress(address: string) {
  const match = address.match(/^([A-Za-z]+)(\d+)$/)
  if (!match) {
    throw new Error(`Endereço de célula inválido: ${address}`)
  }

  return {
    columnNumber: columnNameToNumber(match[1]),
    rowNumber: Number(match[2]),
  }
}

function setSheetCellValue(
  sheet: XlsxPopulateSheet,
  address: string,
  value: string | number,
) {
  sheet.cell(address).value(value)
}

function writeTemplateTable(
  sheet: XlsxPopulateSheet,
  startCell: string,
  rows: Array<Array<string | number>>,
  columnCount: number,
) {
  const { columnNumber: startColumnNumber, rowNumber: startRowNumber } =
    decodeCellAddress(startCell)

  const lastUsedRow = sheet.usedRange()?.endCell().rowNumber() ?? startRowNumber
  const totalRows = Math.max(rows.length, lastUsedRow - startRowNumber + 1, 1)

  for (let rowOffset = 0; rowOffset < totalRows; rowOffset += 1) {
    const targetRowNumber = startRowNumber + rowOffset
    const rowValues = rows[rowOffset] ?? []

    for (let columnOffset = 0; columnOffset < columnCount; columnOffset += 1) {
      const address = `${columnNumberToName(startColumnNumber + columnOffset)}${targetRowNumber}`
      setSheetCellValue(sheet, address, rowValues[columnOffset] ?? '')
    }
  }
}

function populatePlainSheet(
  sheet: XlsxPopulateSheet,
  title: string,
  subtitle: string,
  headers: string[],
  rows: Array<Array<string | number>>,
) {
  sheet.cell('A1').value(title)
  sheet.cell('A2').value(subtitle)

  headers.forEach((header, index) => {
    sheet.cell(`${columnNumberToName(index + 1)}5`).value(header)
  })

  rows.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      sheet
        .cell(`${columnNumberToName(columnIndex + 1)}${rowIndex + 6}`)
        .value(value)
    })
  })
}

function downloadBlob(blob: Blob, filename: string) {
  if (window.navigator && 'msSaveOrOpenBlob' in window.navigator) {
    ;(
      window.navigator as Navigator & {
        msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean
      }
    ).msSaveOrOpenBlob?.(blob, filename)
    return
  }

  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  window.setTimeout(() => {
    document.body.removeChild(anchor)
    window.URL.revokeObjectURL(url)
  }, 1000)
}

const PDF_CAPTURE_STYLE_PROPERTIES = [
  'color',
  'background-color',
  'background-image',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
  'box-shadow',
  'fill',
  'stroke',
  'caret-color',
] as const

function inlinePdfSafeStyles(sourceRoot: HTMLElement, cloneRoot: HTMLElement) {
  const sourceElements = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll<HTMLElement>('*'))]
  const cloneElements = [cloneRoot, ...Array.from(cloneRoot.querySelectorAll<HTMLElement>('*'))]

  for (let index = 0; index < sourceElements.length; index += 1) {
    const sourceElement = sourceElements[index]
    const cloneElement = cloneElements[index]

    if (!sourceElement || !cloneElement) continue

    const computedStyle = window.getComputedStyle(sourceElement)

    for (const property of PDF_CAPTURE_STYLE_PROPERTIES) {
      const value = computedStyle.getPropertyValue(property)
      if (value) {
        cloneElement.style.setProperty(property, value)
      }
    }
  }
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
  equipmentFleet,
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
  equipmentFleet: EquipmentWithAllocation[]
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
  const [pdfExporting, setPdfExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const reportContentRef = useRef<HTMLDivElement | null>(null)

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
  const filteredClients = useMemo(
    () => clients.filter((client) => !clientId || client.id === clientId),
    [clients, clientId],
  )
  const filteredEquipmentFleet = useMemo(
    () =>
      equipmentFleet.filter(
        (item) => !clientId || item.allocation?.client_id === clientId,
      ),
    [equipmentFleet, clientId],
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

  const reportFilterSummary = useMemo(
    () =>
      [
        `Período: ${PERIOD_LABELS[period]}`,
        `Cliente: ${clientId ? clientMap.get(clientId) ?? clientId : 'Todos'}`,
        `Técnico: ${technicianId ? profileMap.get(technicianId) ?? technicianId : 'Todos'}`,
        `Status: ${status ? statusLabel(status as TicketStatus) : 'Todos'}`,
        `Prioridade: ${priority ? priorityLabel(priority as TicketPriority) : 'Todas'}`,
      ].join('  •  '),
    [period, clientId, clientMap, technicianId, profileMap, status, priority],
  )

  async function exportWorkbook() {
    setExporting(true)
    setExportError('')
    try {
      const xlsxPopulateModule = await import(
        'xlsx-populate/browser/xlsx-populate-no-encryption'
      )
      const XlsxPopulate = (xlsxPopulateModule.default ??
        xlsxPopulateModule) as XlsxPopulateModule
      const response = await fetch(encodeURI('/Modelo relatorio ADM.xlsx'))
      if (!response.ok) {
        throw new Error('Não foi possível carregar o template de relatório.')
      }

      const workbook = await XlsxPopulate.fromDataAsync(await response.arrayBuffer())

      const summarySheet = workbook.sheet('Resumo')
      const ticketsSheet = workbook.sheet('Chamados')
      const stockSheet = workbook.sheet('Estoque')
      const approvalsSheet = workbook.sheet('Aprovacoes')
      const checklistSheet = workbook.sheet('Checklist')
      const movementsSheet = workbook.sheet('Movimentacoes')
      const clientsSheet = workbook.sheet('Clientes')
      const equipmentSheet = workbook.sheet('Equipamentos')

      if (
        !summarySheet ||
        !ticketsSheet ||
        !stockSheet ||
        !approvalsSheet ||
        !checklistSheet ||
        !movementsSheet
      ) {
        throw new Error('O template de relatório não contém todas as abas esperadas.')
      }

      const summaryValues: Array<[string, string | number]> = [
        ['B6', PERIOD_LABELS[period]],
        ['B7', clientId ? clientMap.get(clientId) ?? clientId : 'Todos'],
        ['B8', technicianId ? profileMap.get(technicianId) ?? technicianId : 'Todos'],
        ['B9', status ? statusLabel(status as TicketStatus) : 'Todos'],
        ['B10', priority ? priorityLabel(priority as TicketPriority) : 'Todas'],
        ['B13', filteredTickets.length],
        ['B14', openTickets],
        ['B15', criticalOpen],
        ['B16', completedInRange],
        ['B17', formatPercent(slaCompliant.rate)],
        ['B18', dashboardMetrics.slaBreaches],
        ['B19', formatDurationFromMs(avgResolutionMs)],
        ['B20', pendingApprovals],
        ['B21', lowStockParts.length],
        ['B22', filteredChecklistRuns.length],
        ['B23', formatPercent(checklistCompletion)],
        ['B24', filteredPartMovements.length],
      ]

      for (const [address, value] of summaryValues) {
        setSheetCellValue(summarySheet, address, value)
      }

      const ticketRows = filteredTickets.map((ticket) => [
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
      ])

      const stockRows = parts.map((part) => [
        part.sku,
        part.name,
        part.current_stock,
        part.min_stock,
        isPartBelowMinimum(part) ? 'Abaixo do mínimo' : 'OK',
      ])

      const approvalRows = filteredApprovals.map((approval) => {
        const ticket = tickets.find((item) => item.id === approval.ticket_id)
        return [
          ticket?.ticket_number ?? '',
          approvalDecisionLabel(approval.decision),
          formatDateTime(approval.responded_at),
          approval.notes ?? '',
        ]
      })

      const checklistRowsExport = filteredChecklistRuns.map((run) => [
        templateMap.get(run.template_id) ?? 'Checklist',
        run.status === 'concluido' ? 'Concluído' : 'Em andamento',
        profileMap.get(run.performed_by) ?? '—',
        formatDateTime(run.created_at),
        run.completed_at ? formatDateTime(run.completed_at) : '',
        run.notes ?? '',
      ])

      const movementRowsExport = filteredPartMovements.map((movement) => [
        partMap.get(movement.part_id)?.name ?? 'Peça',
        partMap.get(movement.part_id)?.sku ?? '',
        movement.movement_type,
        movement.quantity,
        formatDateTime(movement.created_at),
        movement.notes ?? '',
      ])

      const clientRowsExport = filteredClients.map((client) => [
        client.name,
        client.legal_name ?? '',
        client.cnpj ? formatCnpj(client.cnpj) : '',
        client.city && client.state_code
          ? `${client.city}/${client.state_code}`
          : client.city ?? '',
        client.contact_name ?? '',
        client.contact_email ?? '',
        client.active ? 'Ativo' : 'Inativo',
        formatDateTime(client.created_at),
        profiles.filter((profile) => profile.client_id === client.id).length,
        equipmentFleet.filter((item) => item.allocation?.client_id === client.id).length,
      ])

      const equipmentRowsExport = filteredEquipmentFleet.map((item) => [
        item.asset_tag,
        item.description,
        item.serial_number ?? '',
        item.active ? 'Ativo' : 'Inativo',
        item.allocation ? clientMap.get(item.allocation.client_id) ?? 'Cliente' : 'Disponível',
        item.allocation?.site_id ? siteLabels.get(item.allocation.site_id) ?? '—' : '—',
        item.allocation ? 'Em locação' : 'Disponível',
        formatDateTime(item.created_at),
      ])

      writeTemplateTable(ticketsSheet, 'A6', ticketRows, 10)
      writeTemplateTable(stockSheet, 'A6', stockRows, 5)
      writeTemplateTable(approvalsSheet, 'A6', approvalRows, 4)
      writeTemplateTable(checklistSheet, 'A6', checklistRowsExport, 6)
      writeTemplateTable(movementsSheet, 'A6', movementRowsExport, 6)

      const ensuredClientsSheet = clientsSheet ?? workbook.addSheet('Clientes')
      const ensuredEquipmentSheet =
        equipmentSheet ?? workbook.addSheet('Equipamentos')

      if ((ensuredClientsSheet.usedRange()?.endCell().rowNumber() ?? 0) >= 6) {
        writeTemplateTable(ensuredClientsSheet, 'A6', clientRowsExport, 5)
      } else {
        populatePlainSheet(
          ensuredClientsSheet,
          'Clientes',
          'Empresas cadastradas, status atual e vínculos operacionais',
          [
            'Nome fantasia',
            'Razão social',
            'CNPJ',
            'Cidade/UF',
            'Contato',
            'E-mail',
            'Status',
            'Cadastro',
            'Usuários vinculados',
            'Equipamentos alocados',
          ],
          clientRowsExport,
        )
      }

      if ((ensuredEquipmentSheet.usedRange()?.endCell().rowNumber() ?? 0) >= 6) {
        writeTemplateTable(ensuredEquipmentSheet, 'A6', equipmentRowsExport, 8)
      } else {
        populatePlainSheet(
          ensuredEquipmentSheet,
          'Equipamentos',
          'Frota ADM, status atual e alocação por cliente/obra',
          [
            'Patrimônio',
            'Descrição',
            'Série',
            'Status',
            'Cliente atual',
            'Obra',
            'Situação',
            'Cadastro',
          ],
          equipmentRowsExport,
        )
      }

      downloadBlob(
        await workbook.outputAsync(),
        `relatorio-gerencial-${new Date().toISOString().slice(0, 10)}.xlsx`,
      )
    } catch (error) {
      console.error('Falha ao exportar relatório Excel', error)
      setExportError(
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar o arquivo Excel.',
      )
    } finally {
      setExporting(false)
    }
  }

  async function exportPdf() {
    if (!reportContentRef.current) {
      setExportError('Não foi possível localizar a área do relatório para gerar o PDF.')
      return
    }

    setPdfExporting(true)
    setExportError('')

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ])

      const reportElement = reportContentRef.current
      const canvas = await html2canvas(reportElement, {
        backgroundColor: null,
        useCORS: true,
        logging: false,
        scale: Math.max(2, window.devicePixelRatio || 1),
        width: reportElement.scrollWidth,
        height: reportElement.scrollHeight,
        windowWidth: reportElement.scrollWidth,
        windowHeight: reportElement.scrollHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
        ignoreElements: (element) =>
          element instanceof HTMLElement && element.dataset.pdfHidden === 'true',
        onclone: (documentClone) => {
          documentClone
            .querySelectorAll<HTMLElement>('[data-pdf-hidden="true"]')
            .forEach((element) => {
              element.style.display = 'none'
            })

          const clonedReportRoot = documentClone.querySelector<HTMLElement>('[data-pdf-root="true"]')
          if (clonedReportRoot) {
            inlinePdfSafeStyles(reportElement, clonedReportRoot)
          }
        },
      })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const marginX = 10
      const headerTop = 8
      const headerHeight = 26
      const footerHeight = 10
      const contentTop = headerTop + headerHeight + 6
      const contentWidth = pageWidth - marginX * 2
      const contentHeightPerPage = pageHeight - contentTop - footerHeight - 6
      const imageHeight = (canvas.height * contentWidth) / canvas.width
      const totalPages = Math.max(1, Math.ceil(imageHeight / contentHeightPerPage))
      const generatedAt = formatDateTime(new Date().toISOString())
      const imageData = canvas.toDataURL('image/png')

      const drawPdfFrame = (pageNumber: number) => {
        pdf.setFillColor(15, 23, 42)
        pdf.roundedRect(marginX, headerTop, contentWidth, headerHeight, 5, 5, 'F')
        pdf.setFillColor(220, 38, 38)
        pdf.roundedRect(marginX, headerTop, 3, headerHeight, 3, 3, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(18)
        pdf.text('Relatório Gerencial ADM', marginX + 8, headerTop + 10)
        pdf.setFontSize(9)
        pdf.setTextColor(203, 213, 225)
        pdf.text(`Gerado em ${generatedAt}`, marginX + 8, headerTop + 17)
        pdf.text(reportFilterSummary, marginX + 8, headerTop + 22, {
          maxWidth: contentWidth - 16,
        })
        pdf.setDrawColor(226, 232, 240)
        pdf.setLineWidth(0.3)
        pdf.line(marginX, pageHeight - footerHeight, pageWidth - marginX, pageHeight - footerHeight)
        pdf.setTextColor(100, 116, 139)
        pdf.setFontSize(9)
        pdf.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - marginX, pageHeight - 4, {
          align: 'right',
        })
      }

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
        if (pageIndex > 0) {
          pdf.addPage()
        }

        drawPdfFrame(pageIndex + 1)

        pdf.addImage(
          imageData,
          'PNG',
          marginX,
          contentTop - pageIndex * contentHeightPerPage,
          contentWidth,
          imageHeight,
          undefined,
          'FAST',
        )
      }

      pdf.save(`relatorio-gerencial-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (error) {
      console.error('Falha ao gerar PDF do relatório', error)
      setExportError(
        error instanceof Error ? error.message : 'Não foi possível gerar o PDF do relatório.',
      )
    } finally {
      setPdfExporting(false)
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
    <div ref={reportContentRef} data-pdf-root="true">
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
              conformidade de checklist e exportação profissional em Excel e PDF.
            </p>
            {exportError && (
              <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {exportError}
              </p>
            )}
          </div>

          <div
            data-pdf-hidden="true"
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end"
          >
            <button
              type="button"
              disabled={pdfExporting}
              onClick={() => void exportPdf()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-slate-950 via-slate-900 to-slate-800 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-950/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 dark:from-slate-100 dark:via-white dark:to-slate-200 dark:text-slate-950"
            >
              <FileText size={16} />
              {pdfExporting ? 'Gerando PDF...' : 'Gerar PDF'}
            </button>

            <button
              type="button"
              disabled={exporting}
              onClick={() => void exportWorkbook()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Download size={16} />
              {exporting ? 'Gerando Excel...' : 'Exportar Excel'}
            </button>
          </div>
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

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
    </div>
  )
}
