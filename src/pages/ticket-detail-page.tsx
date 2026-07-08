import { type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { PriorityBadge, StatusBadge } from '@/components/tickets/badges'
import { AttachmentsSection } from '@/components/tickets/attachments-section'
import { InspectionSection } from '@/components/tickets/inspection-section'
import { ServiceCompletionSection } from '@/components/tickets/service-completion-section'
import { approvalDecisionLabel } from '@/features/tickets/approvals-api'
import { TicketRequestInfo } from '@/components/tickets/ticket-request-info'
import { TicketEventsSection } from '@/components/tickets/ticket-events-section'
import { formatDateTime } from '@/lib/format'
import { priorityLabel, roleLabel, statusLabel } from '@/lib/tickets'
import type {
  Attachment,
  Client,
  ManagedProfile,
  Ticket,
  TicketApproval,
  TicketEvent,
  TicketInspection,
  TicketServiceCompletion,
  TicketPriority,
  TicketStatus,
} from '@/types'
import { isMaintenanceRole } from '@/types'
import { TICKET_PRIORITIES, TICKET_STATUSES } from '@/types'

export function TicketDetailPage({
  ticket,
  clients,
  profiles,
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
  editStatus,
  editPriority,
  editTechnicianId,
  editLoading,
  editMessage,
  inspection,
  inspectionLoading,
  approval,
  approvalLoading,
  serviceCompletion,
  serviceCompletionLoading,
  onBack,
  onEditStatusChange,
  onEditPriorityChange,
  onEditTechnicianChange,
  onSave,
}: {
  ticket: Ticket
  clients: Client[]
  profiles: ManagedProfile[]
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
  editStatus: TicketStatus
  editPriority: TicketPriority
  editTechnicianId: string
  editLoading: boolean
  editMessage: string
  inspection: TicketInspection | null
  inspectionLoading: boolean
  approval: TicketApproval | null
  approvalLoading: boolean
  serviceCompletion: TicketServiceCompletion | null
  serviceCompletionLoading: boolean
  onBack: () => void
  onEditStatusChange: (status: TicketStatus) => void
  onEditPriorityChange: (priority: TicketPriority) => void
  onEditTechnicianChange: (value: string) => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
}) {
  const client = clients.find((item) => item.id === ticket.client_id)
  const technicians = profiles.filter((item) => isMaintenanceRole(item.role))
  const assignedTechnician = profiles.find(
    (item) => item.id === ticket.technician_id,
  )
  const inspectorName = inspection
    ? profiles.find((item) => item.id === inspection.inspector_id)?.full_name
    : undefined
  const completionTechnicianName = serviceCompletion
    ? profiles.find((item) => item.id === serviceCompletion.technician_signed_by)
        ?.full_name
    : undefined

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Voltar para chamados
      </button>

      <section className="mt-5 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              OS #{ticket.ticket_number}
            </p>
            <h3 className="mt-1 text-2xl font-bold">{ticket.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cliente: {client?.name ?? '—'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Aberto em {formatDateTime(ticket.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
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

        {assignedTechnician && (
          <p className="mt-4 text-sm text-muted-foreground">
            Manutenção atual:{' '}
            <span className="text-foreground">
              {assignedTechnician.full_name || 'Sem nome'}
              {' · '}
              {roleLabel(assignedTechnician.role)}
            </span>
          </p>
        )}
      </section>

      <InspectionSection
        mode="view"
        inspection={inspection}
        loading={inspectionLoading}
        inspectorName={inspectorName}
        currentStatus={editStatus}
        onApplyRecommendedStatus={onEditStatusChange}
      />

      {!approvalLoading && ticket.status === 'aguardando_aprovacao' && !approval && (
        <section className="mt-6 rounded-2xl border border-purple-300 bg-purple-100 dark:border-purple-900/50 dark:bg-purple-950/20 p-5">
          <p className="text-sm font-semibold text-purple-700 dark:text-purple-200">
            Aguardando aprovação do cliente
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            O cliente precisa aprovar ou recusar o laudo e os serviços
            recomendados antes da execução.
          </p>
        </section>
      )}

      {!approvalLoading && approval && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">
            Resposta do cliente: {approvalDecisionLabel(approval.decision)}
          </p>
          {approval.notes && (
            <p className="mt-2 text-sm text-muted-foreground">{approval.notes}</p>
          )}
        </section>
      )}

      <TicketEventsSection
        events={events}
        loading={eventsLoading}
        profiles={profiles}
      />

      <AttachmentsSection
        attachments={attachments}
        loading={attachmentsLoading}
        canUpload={canUpload}
        uploading={uploading}
        uploadError={uploadError}
        onUpload={onUpload}
      />

      <ServiceCompletionSection
        completion={serviceCompletion}
        loading={serviceCompletionLoading}
        technicianName={completionTechnicianName}
      />

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h4 className="font-bold">Triagem e gestão</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize status, prioridade e atribua manutenção (ADM ou externa).
        </p>

        <form className="mt-6 space-y-5" onSubmit={onSave}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="editTicketStatus"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Status
              </label>
              <select
                id="editTicketStatus"
                value={editStatus}
                onChange={(event) =>
                  onEditStatusChange(event.target.value as TicketStatus)
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
              >
                {TICKET_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="editTicketPriority"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Prioridade
              </label>
              <select
                id="editTicketPriority"
                value={editPriority}
                onChange={(event) =>
                  onEditPriorityChange(event.target.value as TicketPriority)
                }
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
              >
                {TICKET_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityLabel(priority)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="editTicketTechnician"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Manutenção responsável{' '}
              <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <select
              id="editTicketTechnician"
              value={editTechnicianId}
              onChange={(event) => onEditTechnicianChange(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
            >
              <option value="">Nenhum profissional atribuído</option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.full_name || 'Sem nome'} (
                  {roleLabel(technician.role)})
                </option>
              ))}
            </select>

            {technicians.length === 0 && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                Nenhum profissional de manutenção cadastrado. Defina o papel em
                Usuários.
              </p>
            )}
          </div>

          {editMessage && (
            <p className="rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
              {editMessage}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={editLoading}
              className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editLoading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}
