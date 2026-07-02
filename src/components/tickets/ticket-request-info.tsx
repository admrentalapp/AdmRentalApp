import { formatDateTime } from '@/lib/format'
import type { Ticket } from '@/types'

export function TicketRequestInfo({
  ticket,
  siteName,
  equipmentLabel,
}: {
  ticket: Ticket
  siteName?: string
  equipmentLabel?: string
}) {
  const hasRequestInfo =
    ticket.incident_at ||
    ticket.site_contact_name ||
    ticket.site_contact_phone ||
    siteName ||
    equipmentLabel

  if (!hasRequestInfo) {
    return null
  }

  return (
    <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-sm font-medium text-zinc-300">Dados da solicitação</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        {siteName && (
          <div>
            <dt className="text-xs text-zinc-500">Obra</dt>
            <dd className="mt-1 text-zinc-300">{siteName}</dd>
          </div>
        )}
        {equipmentLabel && (
          <div>
            <dt className="text-xs text-zinc-500">Equipamento</dt>
            <dd className="mt-1 text-zinc-300">{equipmentLabel}</dd>
          </div>
        )}
        {ticket.incident_at && (
          <div>
            <dt className="text-xs text-zinc-500">Data/hora da avaria</dt>
            <dd className="mt-1 text-zinc-300">
              {formatDateTime(ticket.incident_at)}
            </dd>
          </div>
        )}
        {ticket.site_contact_name && (
          <div>
            <dt className="text-xs text-zinc-500">Contato na obra</dt>
            <dd className="mt-1 text-zinc-300">{ticket.site_contact_name}</dd>
          </div>
        )}
        {ticket.site_contact_phone && (
          <div>
            <dt className="text-xs text-zinc-500">Telefone do contato</dt>
            <dd className="mt-1 text-zinc-300">{ticket.site_contact_phone}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
