import { type FormEvent } from 'react'
import { Building2, ChevronRight, Plus, X } from 'lucide-react'
import type { Client } from '@/types'

export function ClientsPage({
  clients,
  loading,
  error,
  modalOpen,
  newClientName,
  newClientLoading,
  newClientMessage,
  onOpenModal,
  onCloseModal,
  onNewClientNameChange,
  onCreateClient,
  onCreateTestClient,
  onOpenClient,
}: {
  clients: Client[]
  loading: boolean
  error: string
  modalOpen: boolean
  newClientName: string
  newClientLoading: boolean
  newClientMessage: string
  onOpenModal: () => void
  onCloseModal: () => void
  onNewClientNameChange: (value: string) => void
  onCreateClient: (event: FormEvent<HTMLFormElement>) => void
  onCreateTestClient: () => void
  onOpenClient: (client: Client) => void
}) {
  return (
    <>
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Cadastro de empresas</p>
          <h3 className="mt-1 text-2xl font-bold">Clientes</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre as empresas que poderão abrir chamados.
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
            Total de registros: {clients.length}
          </p>
        </div>

        {loading && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando clientes...
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center text-sm text-red-600 dark:text-red-300">{error}</div>
        )}

        {!loading && !error && clients.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
            <Building2 className="text-muted-foreground" size={34} />
            <div>
              <p className="font-medium text-foreground">
                Nenhum cliente cadastrado.
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

        {!loading && !error && clients.length > 0 && (
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => onOpenClient(client)}
                className="flex w-full flex-col gap-3 px-6 py-5 text-left transition hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-red-600 dark:text-red-400">
                    <Building2 size={20} />
                  </div>

                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cadastrado em{' '}
                      {new Intl.DateTimeFormat('pt-BR').format(
                        new Date(client.created_at),
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      client.active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {client.active ? 'Ativo' : 'Inativo'}
                  </span>

                  <span className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                    Ver obras
                    <ChevronRight size={16} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5">
          <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Novo cadastro</p>
                <h3 className="mt-1 text-xl font-bold">Cadastrar cliente</h3>
              </div>

              <button
                type="button"
                onClick={onCloseModal}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={onCreateClient}>
              <div>
                <label
                  htmlFor="clientName"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Nome da empresa
                </label>

                <input
                  id="clientName"
                  type="text"
                  required
                  autoFocus
                  value={newClientName}
                  onChange={(event) =>
                    onNewClientNameChange(event.target.value)
                  }
                  placeholder="Ex.: Construtora Exemplo Ltda."
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
                />
              </div>

              {newClientMessage && (
                <p className="rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
                  {newClientMessage}
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
                  disabled={newClientLoading}
                  className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {newClientLoading ? 'Salvando...' : 'Cadastrar cliente'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
