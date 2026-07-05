import { type FormEvent } from 'react'
import {
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  PencilLine,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { PriorityBadge, StatusBadge } from '@/components/tickets/badges'
import { formatDateTime } from '@/lib/format'
import { priorityLabel, statusLabel } from '@/lib/tickets'
import type { Client, Equipment, Site, Ticket, TicketPriority } from '@/types'
import { TICKET_PRIORITIES, TICKET_STATUSES } from '@/types'

export function TicketsPage({
  tickets,
  clients,
  loading,
  error,
  statusFilter,
  modalOpen,
  newClientId,
  newSiteId,
  newEquipmentId,
  newTitle,
  newDescription,
  newPriority,
  newLoading,
  newMessage,
  formSites,
  formEquipment,
  onSelectStatusFilter,
  onOpenModal,
  onCloseModal,
  onSelectClient,
  onNewSiteChange,
  onNewEquipmentChange,
  onNewTitleChange,
  onNewDescriptionChange,
  onNewPriorityChange,
  onCreateTicket,
  onOpenTicket,
  editTicket,
  editClientId,
  editSiteId,
  editEquipmentId,
  editTitle,
  editDescription,
  editPriority,
  editLoading,
  editMessage,
  editFormSites,
  editFormEquipment,
  onOpenEditTicket,
  onCloseEditTicket,
  onSelectEditClient,
  onEditSiteChange,
  onEditEquipmentChange,
  onEditTitleChange,
  onEditDescriptionChange,
  onEditPriorityChange,
  onUpdateTicket,
  deleteTicket,
  deleteLoading,
  deleteMessage,
  onOpenDeleteTicket,
  onCloseDeleteTicket,
  onDeleteTicket,
}: {
  tickets: Ticket[]
  clients: Client[]
  loading: boolean
  error: string
  statusFilter: string
  modalOpen: boolean
  newClientId: string
  newSiteId: string
  newEquipmentId: string
  newTitle: string
  newDescription: string
  newPriority: TicketPriority
  newLoading: boolean
  newMessage: string
  formSites: Site[]
  formEquipment: Equipment[]
  onSelectStatusFilter: (status: string) => void
  onOpenModal: () => void
  onCloseModal: () => void
  onSelectClient: (clientId: string) => void
  onNewSiteChange: (value: string) => void
  onNewEquipmentChange: (value: string) => void
  onNewTitleChange: (value: string) => void
  onNewDescriptionChange: (value: string) => void
  onNewPriorityChange: (priority: TicketPriority) => void
  onCreateTicket: (event: FormEvent<HTMLFormElement>) => void
  onOpenTicket: (ticket: Ticket) => void
  editTicket: Ticket | null
  editClientId: string
  editSiteId: string
  editEquipmentId: string
  editTitle: string
  editDescription: string
  editPriority: TicketPriority
  editLoading: boolean
  editMessage: string
  editFormSites: Site[]
  editFormEquipment: Equipment[]
  onOpenEditTicket: (ticket: Ticket) => void
  onCloseEditTicket: () => void
  onSelectEditClient: (clientId: string) => void
  onEditSiteChange: (value: string) => void
  onEditEquipmentChange: (value: string) => void
  onEditTitleChange: (value: string) => void
  onEditDescriptionChange: (value: string) => void
  onEditPriorityChange: (priority: TicketPriority) => void
  onUpdateTicket: (event: FormEvent<HTMLFormElement>) => void
  deleteTicket: Ticket | null
  deleteLoading: boolean
  deleteMessage: string
  onOpenDeleteTicket: (ticket: Ticket) => void
  onCloseDeleteTicket: () => void
  onDeleteTicket: () => void
}) {
  function clientName(clientId: string) {
    return clients.find((item) => item.id === clientId)?.name ?? 'Cliente'
  }

  return (
    <>
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Ordens de serviço</p>
          <h3 className="mt-1 text-2xl font-bold">Chamados</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie chamados, faça triagem, defina prioridade e atribua manutenção.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus size={18} />
          Novo chamado
        </button>
      </section>

      <section className="mt-6">
        <label
          htmlFor="ticketStatusFilter"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Filtrar por status
        </label>
        <select
          id="ticketStatusFilter"
          value={statusFilter}
          onChange={(event) => onSelectStatusFilter(event.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500 sm:w-auto"
        >
          <option value="">Todos os status</option>
          {TICKET_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h4 className="font-bold">Chamados registrados</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Total de registros: {tickets.length}
          </p>
        </div>

        {loading && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando chamados...
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center text-sm text-red-600 dark:text-red-300">{error}</div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
            <ClipboardList className="text-muted-foreground" size={34} />
            <div>
              <p className="font-medium text-foreground">
                Nenhum chamado encontrado.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Clique em &quot;Novo chamado&quot; para registrar a primeira OS.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenModal}
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              Novo chamado
            </button>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="divide-y divide-border">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <button
                  type="button"
                  onClick={() => onOpenTicket(ticket)}
                  className="min-w-0 flex-1 text-left transition hover:opacity-90"
                >
                  <p className="font-semibold">
                    #{ticket.ticket_number} · {ticket.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {clientName(ticket.client_id)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(ticket.created_at)}
                  </p>
                </button>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />

                  <button
                    type="button"
                    onClick={() => onOpenEditTicket(ticket)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <PencilLine size={16} />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenDeleteTicket(ticket)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenTicket(ticket)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    Gerenciar
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Nova OS</p>
                <h3 className="mt-1 text-xl font-bold">Abrir chamado</h3>
              </div>

              <button
                type="button"
                onClick={onCloseModal}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={onCreateTicket}>
              <div>
                <label
                  htmlFor="ticketClient"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Cliente
                </label>
                <select
                  id="ticketClient"
                  required
                  value={newClientId}
                  onChange={(event) => onSelectClient(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
                >
                  <option value="">Selecione a empresa...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="ticketSite"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Obra{' '}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </label>
                  <select
                    id="ticketSite"
                    value={newSiteId}
                    onChange={(event) => onNewSiteChange(event.target.value)}
                    disabled={!newClientId}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500 disabled:opacity-50"
                  >
                    <option value="">Sem obra</option>
                    {formSites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ticketEquipment"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Equipamento{' '}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </label>
                  <select
                    id="ticketEquipment"
                    value={newEquipmentId}
                    onChange={(event) =>
                      onNewEquipmentChange(event.target.value)
                    }
                    disabled={!newClientId}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500 disabled:opacity-50"
                  >
                    <option value="">Sem equipamento</option>
                    {formEquipment.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.asset_tag} — {item.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="ticketTitle"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Título
                </label>
                <input
                  id="ticketTitle"
                  type="text"
                  required
                  value={newTitle}
                  onChange={(event) => onNewTitleChange(event.target.value)}
                  placeholder="Ex.: Gerador não liga"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="ticketDescription"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Descrição
                </label>
                <textarea
                  id="ticketDescription"
                  required
                  rows={4}
                  value={newDescription}
                  onChange={(event) =>
                    onNewDescriptionChange(event.target.value)
                  }
                  placeholder="Descreva o problema com detalhes..."
                  className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="ticketPriority"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Prioridade
                </label>
                <select
                  id="ticketPriority"
                  value={newPriority}
                  onChange={(event) =>
                    onNewPriorityChange(event.target.value as TicketPriority)
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

              {newMessage && (
                <p className="rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
                  {newMessage}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCloseModal}
                  className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent sm:w-auto"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={newLoading}
                  className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {newLoading ? 'Salvando...' : 'Abrir chamado'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {editTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Chamado #{editTicket.ticket_number}</p>
                <h3 className="mt-1 text-xl font-bold">Editar chamado</h3>
              </div>

              <button
                type="button"
                onClick={onCloseEditTicket}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={onUpdateTicket}>
              <div>
                <label
                  htmlFor="editTicketClient"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Cliente
                </label>
                <select
                  id="editTicketClient"
                  required
                  value={editClientId}
                  onChange={(event) => onSelectEditClient(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
                >
                  <option value="">Selecione a empresa...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="editTicketSite"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Obra{' '}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </label>
                  <select
                    id="editTicketSite"
                    value={editSiteId}
                    onChange={(event) => onEditSiteChange(event.target.value)}
                    disabled={!editClientId}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500 disabled:opacity-50"
                  >
                    <option value="">Sem obra</option>
                    {editFormSites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="editTicketEquipment"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Equipamento{' '}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </label>
                  <select
                    id="editTicketEquipment"
                    value={editEquipmentId}
                    onChange={(event) => onEditEquipmentChange(event.target.value)}
                    disabled={!editClientId}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500 disabled:opacity-50"
                  >
                    <option value="">Sem equipamento</option>
                    {editFormEquipment.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.asset_tag} — {item.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="editTicketTitle"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Título
                </label>
                <input
                  id="editTicketTitle"
                  type="text"
                  required
                  value={editTitle}
                  onChange={(event) => onEditTitleChange(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="editTicketDescription"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Descrição
                </label>
                <textarea
                  id="editTicketDescription"
                  required
                  rows={4}
                  value={editDescription}
                  onChange={(event) => onEditDescriptionChange(event.target.value)}
                  className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
                />
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

              {editMessage && (
                <p className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {editMessage}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCloseEditTicket}
                  className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent sm:w-auto"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={editLoading}
                  className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {editLoading ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTicket && (
        <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-red-100 p-3 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Excluir chamado</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Esta ação remove o chamado e o histórico vinculado a ele.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-foreground">
                Deseja excluir o chamado{' '}
                <span className="font-semibold">
                  #{deleteTicket.ticket_number} · {deleteTicket.title}
                </span>
                ?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Esta ação não pode ser desfeita.
              </p>

              {deleteMessage && (
                <p className="mt-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {deleteMessage}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={onCloseDeleteTicket}
                className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60 sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={onDeleteTicket}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
              >
                <Trash2 size={16} />
                {deleteLoading ? 'Excluindo...' : 'Excluir chamado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
