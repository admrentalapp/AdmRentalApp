import type { TicketPriority, TicketStatus } from '@/types'
import { priorityLabel, statusLabel } from '@/lib/tickets'

export function StatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    aberto: 'bg-zinc-800 text-zinc-300',
    triagem: 'bg-amber-950 text-amber-300',
    em_inspecao: 'bg-blue-950 text-blue-300',
    aguardando_aprovacao: 'bg-purple-950 text-purple-300',
    em_execucao: 'bg-sky-950 text-sky-300',
    aguardando_pecas: 'bg-orange-950 text-orange-300',
    concluido: 'bg-emerald-950 text-emerald-400',
    cancelado: 'bg-red-950 text-red-300',
  }

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {statusLabel(status)}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const styles: Record<TicketPriority, string> = {
    baixa: 'bg-zinc-800 text-zinc-400',
    media: 'bg-zinc-800 text-zinc-200',
    alta: 'bg-amber-950 text-amber-300',
    critica: 'bg-red-950 text-red-300',
  }

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${styles[priority]}`}
    >
      {priorityLabel(priority)}
    </span>
  )
}
