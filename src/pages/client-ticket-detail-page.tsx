import { ArrowLeft } from 'lucide-react'
import { PriorityBadge, StatusBadge } from '@/components/tickets/badges'
import { ClientApprovalSection } from '@/components/tickets/client-approval-section'
import { AttachmentsSection } from '@/components/tickets/attachments-section'
import { InspectionSection } from '@/components/tickets/inspection-section'
import { TicketRequestInfo } from '@/components/tickets/ticket-request-info'
import { TicketEventsSection } from '@/components/tickets/ticket-events-section'
import { formatDateTime } from '@/lib/format'
import type { Attachment, Ticket, TicketApproval, TicketEvent, TicketInspection } from '@/types'

export function ClientTicketDetailPage({
  ticket,
  companyName,
  siteName,
  equipmentLabel,
  events,
  eventsLoading,
  attachments,
  attachmentsLoading,
  canUpload = false,
  uploading = false,
  uploadError = '',
  onUpload,
  inspection,
  inspectionLoading,
  approval,
  approvalLoading,
  approvalSubmitLoading,
  approvalSubmitError,
  onRespondApproval,
  onBack,
}: {
  ticket: Ticket
  companyName: string
  siteName?: string
  equipmentLabel?: string
  events: TicketEvent[]
  eventsLoading: boolean
  attachments: Attachment[]
  attachmentsLoading: boolean
  canUpload?: boolean
  uploading?: boolean
  uploadError?: string
  onUpload?: (file: File) => void | Promise<void>
  inspection: TicketInspection | null
  inspectionLoading: boolean
  approval: TicketApproval | null
  approvalLoading: boolean
  approvalSubmitLoading: boolean
  approvalSubmitError: string
  onRespondApproval: (
    decision: 'aprovado' | 'recusado',
    notes: string,
  ) => void | Promise<void>
  onBack: () => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Voltar para meus chamados
      </button>

      <section className="mt-5 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          OS #{ticket.ticket_number} · {companyName}
        </p>
        <h3 className="mt-1 text-2xl font-bold">{ticket.title}</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <div className="mt-6 rounded-xl border border-border bg-background p-4">
          <p className="text-sm font-medium text-foreground">Descrição</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {ticket.description}
          </p>
        </div>

        <TicketRequestInfo
          ticket={ticket}
          siteName={siteName}
          equipmentLabel={equipmentLabel}
        />

        <p className="mt-4 text-xs text-muted-foreground">
          Aberto em {formatDateTime(ticket.created_at)}
          {ticket.updated_at !== ticket.created_at &&
            ` · Atualizado em ${formatDateTime(ticket.updated_at)}`}
        </p>
      </section>

      <InspectionSection
        mode="view"
        inspection={inspection}
        loading={inspectionLoading}
        currentStatus={ticket.status}
      />

      <ClientApprovalSection
        ticket={ticket}
        inspection={inspection}
        approval={approval}
        loading={approvalLoading}
        submitLoading={approvalSubmitLoading}
        submitError={approvalSubmitError}
        onRespond={onRespondApproval}
      />

      <TicketEventsSection events={events} loading={eventsLoading} />

      <AttachmentsSection
        attachments={attachments}
        loading={attachmentsLoading}
        canUpload={canUpload}
        uploading={uploading}
        uploadError={uploadError}
        onUpload={onUpload}
      />
    </>
  )
}
