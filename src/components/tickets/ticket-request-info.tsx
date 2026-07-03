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
    <div className="mt-6 rounded-xl border border-border bg-background p-4">
      <p className="text-sm font-medium text-foreground">Dados da solicitação</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        {siteName && (
          <div>
            <dt className="text-xs text-muted-foreground">Obra</dt>
            <dd className="mt-1 text-foreground">{siteName}</dd>
          </div>
        )}
        {equipmentLabel && (
          <div>
            <dt className="text-xs text-muted-foreground">Equipamento</dt>
            <dd className="mt-1 text-foreground">{equipmentLabel}</dd>
          </div>
        )}
        {ticket.incident_at && (
          <div>
            <dt className="text-xs text-muted-foreground">Data/hora da avaria</dt>
            <dd className="mt-1 text-foreground">
              {formatDateTime(ticket.incident_at)}
            </dd>
          </div>
        )}
        {ticket.site_contact_name && (
          <div>
            <dt className="text-xs text-muted-foreground">Contato na obra</dt>
            <dd className="mt-1 text-foreground">{ticket.site_contact_name}</dd>
          </div>
        )}
        {ticket.site_contact_phone && (
          <div>
            <dt className="text-xs text-muted-foreground">Telefone do contato</dt>
            <dd className="mt-1 text-foreground">{ticket.site_contact_phone}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
