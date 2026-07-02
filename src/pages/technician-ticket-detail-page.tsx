import { type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { PriorityBadge, StatusBadge } from '@/components/tickets/badges'
import { AttachmentsSection } from '@/components/tickets/attachments-section'
import {
  InspectionSection,
  type InspectionFormValues,
} from '@/components/tickets/inspection-section'
import { TicketRequestInfo } from '@/components/tickets/ticket-request-info'
import { TicketEventsSection } from '@/components/tickets/ticket-events-section'
import { formatDateTime } from '@/lib/format'
import type { Attachment, Ticket, TicketEvent, TicketInspection } from '@/types'

export function TechnicianTicketDetailPage({
  ticket,
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
  eventMessage,
  eventLoading,
  eventError,
  inspection,
  inspectionLoading,
  inspectionSaveLoading,
  inspectionSaveError,
  inspectionSaveSuccess,
  onSaveInspection,
  onBack,
  onEventMessageChange,
  onAddEvent,
}: {
  ticket: Ticket
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
  eventMessage: string
  eventLoading: boolean
  eventError: string
  inspection: TicketInspection | null
  inspectionLoading: boolean
  inspectionSaveLoading: boolean
  inspectionSaveError: string
  inspectionSaveSuccess: string
  onSaveInspection: (values: InspectionFormValues) => void | Promise<void>
  onBack: () => void
  onEventMessageChange: (value: string) => void
  onAddEvent: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-white"
      >
        <ArrowLeft size={16} />
        Voltar para meus chamados
      </button>

      <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-500">OS #{ticket.ticket_number}</p>
        <h3 className="mt-1 text-2xl font-bold">{ticket.title}</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm font-medium text-zinc-300">Descrição</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {ticket.description}
          </p>
        </div>

        <TicketRequestInfo
          ticket={ticket}
          siteName={siteName}
          equipmentLabel={equipmentLabel}
        />

        <p className="mt-4 text-xs text-zinc-500">
          Aberto em {formatDateTime(ticket.created_at)}
        </p>
      </section>

      <InspectionSection
        mode="form"
        inspection={inspection}
        loading={inspectionLoading}
        saveLoading={inspectionSaveLoading}
        saveError={inspectionSaveError}
        saveSuccess={inspectionSaveSuccess}
        onSave={onSaveInspection}
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

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h4 className="font-bold">Anotação rápida</h4>
        <p className="mt-1 text-sm text-zinc-500">
          Registre atividades complementares no histórico (além do laudo
          estruturado acima).
        </p>

        <form className="mt-6 space-y-4" onSubmit={onAddEvent}>
          <textarea
            rows={4}
            required
            value={eventMessage}
            onChange={(event) => onEventMessageChange(event.target.value)}
            placeholder="Descreva o que foi verificado ou realizado..."
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-red-500"
          />

          {eventError && (
            <p className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
              {eventError}
            </p>
          )}

          <button
            type="submit"
            disabled={eventLoading}
            className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {eventLoading ? 'Salvando...' : 'Registrar no histórico'}
          </button>
        </form>
      </section>
    </>
  )
}
