import type { TicketPriority, TicketStatus } from '@/types'
import { priorityLabel, statusLabel } from '@/lib/tickets'

export function StatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    aberto:
      'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    triagem:
      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    em_inspecao:
      'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    aguardando_aprovacao:
      'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    em_execucao:
      'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    aguardando_pecas:
      'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    concluido:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    cancelado:
      'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
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
    baixa:
      'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    media:
      'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
    alta:
      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    critica:
      'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  }

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${styles[priority]}`}
    >
      {priorityLabel(priority)}
    </span>
  )
}
