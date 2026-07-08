import { formatDateTime } from '@/lib/format'
import { statusLabel } from '@/lib/tickets'
import type { Ticket, TicketEvent, TicketStatus } from '@/types'

export type TimelineStepState = 'done' | 'current' | 'upcoming'

export type TicketTimelineStep = {
  id: string
  title: string
  description?: string
  timeLabel?: string
  state: TimelineStepState
}

const PROGRESS: TicketStatus[] = [
  'aberto',
  'triagem',
  'em_inspecao',
  'aguardando_aprovacao',
  'em_execucao',
  'aguardando_pecas',
  'concluido',
]

function progressOf(status: TicketStatus) {
  const index = PROGRESS.indexOf(status)
  return index >= 0 ? index : 0
}

function sortEvents(events: TicketEvent[]) {
  return [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}

function firstMatching(
  events: TicketEvent[],
  predicate: (event: TicketEvent) => boolean,
) {
  return events.find(predicate)
}

function statusChangeAt(events: TicketEvent[], status: TicketStatus) {
  const needle = `para ${statusLabel(status)}`.toLocaleLowerCase('pt-BR')
  return firstMatching(
    events,
    (event) =>
      event.event_type === 'atualizacao' &&
      event.message.toLocaleLowerCase('pt-BR').includes(needle),
  )?.created_at
}

function currentHint(status: TicketStatus) {
  const map: Record<TicketStatus, string> = {
    aberto: 'Aguardando triagem da equipe ADM.',
    triagem: 'Chamado em análise pelo gestor.',
    em_inspecao: 'Aguardando inspeção técnica.',
    aguardando_aprovacao: 'Aguardando sua aprovação para continuar.',
    em_execucao: 'Manutenção em andamento.',
    aguardando_pecas: 'Aguardando chegada de peças.',
    concluido: 'Serviço finalizado com sucesso.',
    cancelado: 'Este atendimento foi encerrado.',
  }
  return map[status]
}

export function formatTicketOsNumber(ticketNumber: number, createdAt: string) {
  const year = new Date(createdAt).getFullYear()
  return `OS: ${year}-${String(ticketNumber).padStart(5, '0')}`
}

export function buildClientTicketTimeline(
  ticket: Ticket,
  events: TicketEvent[],
): TicketTimelineStep[] {
  const sorted = sortEvents(events)
  const p = progressOf(ticket.status)

  if (ticket.status === 'cancelado') {
    const created = firstMatching(sorted, (event) => event.event_type === 'criado')
    return [
      {
        id: 'received',
        title: 'Solicitação recebida',
        description: 'Chamado aberto e registrado no sistema.',
        timeLabel: formatDateTime(created?.created_at ?? ticket.created_at),
        state: 'done',
      },
      {
        id: 'cancelled',
        title: 'Chamado cancelado',
        description: currentHint('cancelado'),
        timeLabel: formatDateTime(ticket.closed_at ?? ticket.updated_at),
        state: 'current',
      },
    ]
  }

  const createdAt =
    firstMatching(sorted, (event) => event.event_type === 'criado')?.created_at ??
    ticket.created_at

  const technicianAt =
    firstMatching(
      sorted,
      (event) =>
        event.event_type === 'atualizacao' &&
        event.message.toLocaleLowerCase('pt-BR').includes('manutenção atribuída'),
    )?.created_at ?? (ticket.technician_id ? ticket.updated_at : undefined)

  const inspectionAt =
    firstMatching(sorted, (event) => event.event_type === 'laudo_inspecao')
      ?.created_at ?? statusChangeAt(sorted, 'em_inspecao')

  const approvalAt =
    firstMatching(sorted, (event) => event.event_type === 'aprovacao_cliente')
      ?.created_at ?? statusChangeAt(sorted, 'aguardando_aprovacao')

  const completionAt =
    firstMatching(sorted, (event) => event.event_type === 'conclusao_servico')
      ?.created_at ??
    (ticket.status === 'concluido'
      ? ticket.closed_at ?? ticket.updated_at
      : undefined)

  const triageAt =
    statusChangeAt(sorted, 'triagem') ??
    (p > progressOf('aberto') ? ticket.updated_at : undefined)

  const waitingPartsAt = statusChangeAt(sorted, 'aguardando_pecas')
  const showApproval =
    ticket.status === 'aguardando_aprovacao' || Boolean(approvalAt)
  const showWaitingParts =
    ticket.status === 'aguardando_pecas' || Boolean(waitingPartsAt)

  type Row = {
    id: string
    title: string
    description: string
    time?: string
    currentFor: TicketStatus[]
    doneAtOrAfter: number
  }

  const rows: Row[] = [
    {
      id: 'received',
      title: 'Solicitação recebida',
      description: 'Chamado aberto e registrado no sistema.',
      time: createdAt,
      currentFor: ['aberto'],
      doneAtOrAfter: progressOf('triagem'),
    },
    {
      id: 'triage',
      title: 'Triagem realizada',
      description: 'Gestor analisou e classificou o chamado.',
      time: triageAt,
      currentFor: ['triagem'],
      doneAtOrAfter: progressOf('em_inspecao'),
    },
    {
      id: 'technician',
      title: 'Técnico atribuído',
      description: 'Profissional de manutenção designado para o atendimento.',
      time: technicianAt,
      currentFor: [],
      // Concluído quando o chamado já saiu da triagem ou entrou em inspeção
      doneAtOrAfter: progressOf('em_inspecao'),
    },
    {
      id: 'inspection',
      title: 'Inspeção técnica',
      description: 'Laudo e diagnóstico do equipamento.',
      time: inspectionAt,
      currentFor: ['em_inspecao'],
      doneAtOrAfter: showApproval
        ? progressOf('aguardando_aprovacao')
        : progressOf('em_execucao'),
    },
  ]

  if (showApproval) {
    rows.push({
      id: 'approval',
      title: 'Aprovação do cliente',
      description: 'Autorização dos serviços recomendados.',
      time: approvalAt,
      currentFor: ['aguardando_aprovacao'],
      doneAtOrAfter: progressOf('em_execucao'),
    })
  }

  rows.push({
    id: 'execution',
    title: 'Em execução',
    description: 'Serviço de manutenção em andamento na obra.',
    time: statusChangeAt(sorted, 'em_execucao'),
    currentFor: ['em_execucao'],
    doneAtOrAfter: showWaitingParts
      ? progressOf('aguardando_pecas')
      : progressOf('concluido'),
  })

  if (showWaitingParts) {
    rows.push({
      id: 'waiting_parts',
      title: 'Aguardando peças',
      description: 'Atendimento pausado até a chegada de peças.',
      time: waitingPartsAt,
      currentFor: ['aguardando_pecas'],
      doneAtOrAfter: progressOf('concluido'),
    })
  }

  rows.push({
    id: 'completed',
    title: 'Serviço concluído',
    description: 'Atendimento finalizado com registro de conclusão.',
    time: completionAt,
    currentFor: ['concluido'],
    doneAtOrAfter: progressOf('concluido') + 1,
  })

  const completed = ticket.status === 'concluido'

  const states: TimelineStepState[] = rows.map((row) => {
    if (completed) return 'done'
    if (row.currentFor.includes(ticket.status)) return 'current'

    if (row.id === 'technician') {
      if (!ticket.technician_id) return 'upcoming'
      // Só marca como feito depois que saiu da triagem
      return p >= progressOf('em_inspecao') ? 'done' : 'upcoming'
    }

    if (p >= row.doneAtOrAfter) return 'done'
    return 'upcoming'
  })

  let currentIndex = states.findIndex((state) => state === 'current')
  if (!completed && currentIndex < 0) {
    const lastDone = states.reduce(
      (acc, state, index) => (state === 'done' ? index : acc),
      -1,
    )
    currentIndex = Math.min(lastDone + 1, states.length - 1)
    states[currentIndex] = 'current'
  }

  for (let index = 0; index < states.length; index += 1) {
    if (completed) {
      states[index] = 'done'
      continue
    }
    if (index < currentIndex) states[index] = 'done'
    if (index > currentIndex) states[index] = 'upcoming'
  }

  return rows.map((row, index) => {
    const state = states[index]
    return {
      id: row.id,
      title: row.title,
      description:
        state === 'current' ? currentHint(ticket.status) : row.description,
      timeLabel:
        state !== 'upcoming' && row.time ? formatDateTime(row.time) : undefined,
      state,
    }
  })
}
