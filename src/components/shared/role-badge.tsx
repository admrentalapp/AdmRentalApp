import type { UserRole } from '@/types'
import { roleLabel } from '@/lib/tickets'

export function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    gestor_adm:
      'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    manutencao_adm:
      'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    manutencao_externa:
      'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    cliente:
      'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  }

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${styles[role]}`}
    >
      {roleLabel(role)}
    </span>
  )
}
