import type { UserRole } from '@/types'
import { roleLabel } from '@/lib/tickets'

export function RoleBadge({ role }: { role: UserRole }) {
  const styles: Record<UserRole, string> = {
    gestor_adm: 'bg-red-950 text-red-300',
    manutencao_adm: 'bg-blue-950 text-blue-300',
    manutencao_externa: 'bg-violet-950 text-violet-300',
    cliente: 'bg-zinc-800 text-zinc-300',
  }

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${styles[role]}`}
    >
      {roleLabel(role)}
    </span>
  )
}
