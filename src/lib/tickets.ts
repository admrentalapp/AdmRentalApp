import type { Ticket, TicketPriority, TicketStatus } from '@/types'

export function statusLabel(status: TicketStatus) {
  const labels: Record<TicketStatus, string> = {
    aberto: 'Aberto',
    triagem: 'Triagem',
    em_inspecao: 'Em inspeção',
    aguardando_aprovacao: 'Aguard. aprovação',
    em_execucao: 'Em execução',
    aguardando_pecas: 'Aguard. peças',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  }
  return labels[status]
}

export function priorityLabel(priority: TicketPriority) {
  const labels: Record<TicketPriority, string> = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    critica: 'Crítica',
  }
  return labels[priority]
}

import type { UserRole } from '@/types'

export function roleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    gestor_adm: 'Gestor ADM',
    manutencao_adm: 'Manutenção ADM',
    manutencao_externa: 'Manutenção Externa',
    cliente: 'Cliente',
  }
  return labels[role]
}

export type TicketStats = {
  openCount: number
  inProgressCount: number
  triagemCount: number
  criticalOpenCount: number
  completedThisMonth: number
  byStatus: Record<TicketStatus, number>
}

export function getTicketStats(tickets: Ticket[]): TicketStats {
  const now = new Date()
  const byStatus = {
    aberto: 0,
    triagem: 0,
    em_inspecao: 0,
    aguardando_aprovacao: 0,
    em_execucao: 0,
    aguardando_pecas: 0,
    concluido: 0,
    cancelado: 0,
  } satisfies Record<TicketStatus, number>

  let openCount = 0
  let inProgressCount = 0
  let triagemCount = 0
  let criticalOpenCount = 0
  let completedThisMonth = 0

  for (const ticket of tickets) {
    byStatus[ticket.status] += 1

    const isClosed = ticket.status === 'concluido' || ticket.status === 'cancelado'

    if (!isClosed) {
      openCount += 1
      if (ticket.priority === 'critica') criticalOpenCount += 1
    }

    if (ticket.status === 'triagem') triagemCount += 1

    if (
      ['em_execucao', 'em_inspecao', 'aguardando_pecas'].includes(ticket.status)
    ) {
      inProgressCount += 1
    }

    if (ticket.status === 'concluido' && ticket.closed_at) {
      const closed = new Date(ticket.closed_at)
      if (
        closed.getMonth() === now.getMonth() &&
        closed.getFullYear() === now.getFullYear()
      ) {
        completedThisMonth += 1
      }
    }
  }

  return {
    openCount,
    inProgressCount,
    triagemCount,
    criticalOpenCount,
    completedThisMonth,
    byStatus,
  }
}
