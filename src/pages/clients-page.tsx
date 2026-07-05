import { type FormEvent } from 'react'
import { AlertTriangle, Building2, ChevronRight, PencilLine, Plus, Trash2, X } from 'lucide-react'
import { ClientFormFields } from '@/components/clients/client-form-fields'
import { clientDisplaySubtitle, formatCnpj, type ClientFormValues } from '@/features/clients/api'
import type { Client } from '@/types'

export function ClientsPage({
  clients,
  loading,
  error,
  modalOpen,
  newClientForm,
  newClientLoading,
  newClientMessage,
  editClient,
  editClientForm,
  editClientLoading,
  editClientMessage,
  deactivateClient,
  deactivateClientLoading,
  deactivateClientMessage,
  onOpenModal,
  onCloseModal,
  onNewClientFormChange,
  onCreateClient,
  onCreateTestClient,
  onOpenClient,
  onOpenEditClient,
  onCloseEditClient,
  onEditClientFormChange,
  onUpdateClient,
  onOpenDeactivateClient,
  onCloseDeactivateClient,
  onDeactivateClient,
}: {
  clients: Client[]
  loading: boolean
  error: string
  modalOpen: boolean
  newClientForm: ClientFormValues
  newClientLoading: boolean
  newClientMessage: string
  editClient: Client | null
  editClientForm: ClientFormValues
  editClientLoading: boolean
  editClientMessage: string
  deactivateClient: Client | null
  deactivateClientLoading: boolean
  deactivateClientMessage: string
  onOpenModal: () => void
  onCloseModal: () => void
  onNewClientFormChange: (patch: Partial<ClientFormValues>) => void
  onCreateClient: (event: FormEvent<HTMLFormElement>) => void
  onCreateTestClient: () => void
  onOpenClient: (client: Client) => void
  onOpenEditClient: (client: Client) => void
  onCloseEditClient: () => void
  onEditClientFormChange: (patch: Partial<ClientFormValues>) => void
  onUpdateClient: (event: FormEvent<HTMLFormElement>) => void
  onOpenDeactivateClient: (client: Client) => void
  onCloseDeactivateClient: () => void
  onDeactivateClient: () => void
}) {
  const activeClients = clients.filter((client) => client.active)
  const inactiveCount = clients.length - activeClients.length

  return (
    <>
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Cadastro de empresas</p>
          <h3 className="mt-1 text-2xl font-bold">Clientes</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre empresas com dados comerciais completos para gestão e relatórios.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCreateTestClient}
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent"
          >
            Cadastrar empresa de teste
          </button>

          <button
            type="button"
            onClick={onOpenModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Plus size={18} />
            Novo cliente
          </button>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h4 className="font-bold">Empresas cadastradas</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Clientes ativos: {activeClients.length}
          </p>
          {inactiveCount > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Inativos preservados no histórico: {inactiveCount}
            </p>
          )}
        </div>

        {loading && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando clientes...
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center text-sm text-red-600 dark:text-red-300">{error}</div>
        )}

        {!loading && !error && activeClients.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
            <Building2 className="text-muted-foreground" size={34} />
            <div>
              <p className="font-medium text-foreground">
                Nenhum cliente ativo cadastrado.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Clique em &quot;Novo cliente&quot; ou cadastre uma empresa de
                teste.
              </p>
            </div>
            <button
              type="button"
              onClick={onCreateTestClient}
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              Cadastrar empresa de teste
            </button>
          </div>
        )}

        {!loading && !error && activeClients.length > 0 && (
          <div className="divide-y divide-border">
            {activeClients.map((client) => {
              const subtitle = clientDisplaySubtitle(client)

              return (
                <div
                  key={client.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <button
                    type="button"
                    onClick={() => onOpenClient(client)}
                    className="flex min-w-0 flex-1 items-center gap-4 text-left transition hover:opacity-90"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-red-600 dark:text-red-400">
                      <Building2 size={20} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">{client.name}</p>
                      {client.legal_name && client.legal_name !== client.name && (
                        <p className="truncate text-sm text-muted-foreground">
                          {client.legal_name}
                        </p>
                      )}
                      {subtitle && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {subtitle}
                        </p>
                      )}
                      {client.contact_name && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          Contato: {client.contact_name}
                          {client.contact_phone ? ` · ${client.contact_phone}` : ''}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Cadastrado em{' '}
                        {new Intl.DateTimeFormat('pt-BR').format(
                          new Date(client.created_at),
                        )}
                      </p>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {client.internal_code && (
                      <span className="w-fit rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                        {client.internal_code}
                      </span>
                    )}

                    <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      Ativo
                    </span>

                    <button
                      type="button"
                      onClick={() => onOpenEditClient(client)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      <PencilLine size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenDeactivateClient(client)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={16} />
                      Apagar
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenClient(client)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400"
                    >
                      Ver obras
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto max-h-[calc(100svh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Novo cadastro</p>
                <h3 className="mt-1 text-xl font-bold">Cadastrar cliente</h3>
              </div>

              <button
                type="button"
                onClick={onCloseModal}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={onCreateClient}>
              <ClientFormFields
                idPrefix="new-client"
                form={newClientForm}
                onChange={onNewClientFormChange}
              />

              {newClientMessage && (
                <p className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {newClientMessage}
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
                  disabled={newClientLoading}
                  className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {newClientLoading ? 'Salvando...' : 'Cadastrar cliente'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {editClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto max-h-[calc(100svh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Editar cadastro</p>
                <h3 className="mt-1 text-xl font-bold">Atualizar cliente</h3>
                {editClient.cnpj && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    CNPJ: {formatCnpj(editClient.cnpj)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onCloseEditClient}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={onUpdateClient}>
              <ClientFormFields
                idPrefix="edit-client"
                form={editClientForm}
                onChange={onEditClientFormChange}
              />

              {editClientMessage && (
                <p className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {editClientMessage}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCloseEditClient}
                  className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent sm:w-auto"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={editClientLoading}
                  className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {editClientLoading ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deactivateClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-red-100 p-3 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Apagar cliente da lista</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    O cliente será apenas inativado para preservar usuários e histórico.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-foreground">
                Deseja inativar o cliente{' '}
                <span className="font-semibold">{deactivateClient.name}</span>?
              </p>
              {deactivateClient.cnpj && (
                <p className="mt-1 text-sm text-muted-foreground">
                  CNPJ: {formatCnpj(deactivateClient.cnpj)}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                Os usuários vinculados não serão apagados.
              </p>

              {deactivateClientMessage && (
                <p className="mt-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {deactivateClientMessage}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                disabled={deactivateClientLoading}
                onClick={onCloseDeactivateClient}
                className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60 sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deactivateClientLoading}
                onClick={onDeactivateClient}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
              >
                <Trash2 size={16} />
                {deactivateClientLoading ? 'Apagando...' : 'Apagar da lista'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
