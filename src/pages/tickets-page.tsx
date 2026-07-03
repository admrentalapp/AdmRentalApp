import { type FormEvent } from 'react'
import { ChevronRight, ClipboardList, Plus, X } from 'lucide-react'
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
              <button
                key={ticket.id}
                type="button"
                onClick={() => onOpenTicket(ticket)}
                className="flex w-full flex-col gap-3 px-6 py-5 text-left transition hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    #{ticket.ticket_number} · {ticket.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {clientName(ticket.client_id)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(ticket.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <span className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                    Gerenciar
                    <ChevronRight size={16} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-5">
          <section className="my-auto w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nova OS</p>
                <h3 className="mt-1 text-xl font-bold">Abrir chamado</h3>
              </div>

              <button
                type="button"
                onClick={onCloseModal}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
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
                  className="rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={newLoading}
                  className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {newLoading ? 'Salvando...' : 'Abrir chamado'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
