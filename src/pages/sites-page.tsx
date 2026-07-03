import { type FormEvent } from 'react'
import { ArrowLeft, MapPin, Plus, X } from 'lucide-react'
import type { Client, Site } from '@/types'

export function SitesPage({
  client,
  sites,
  loading,
  error,
  modalOpen,
  newSiteName,
  newSiteAddress,
  newSiteLoading,
  newSiteMessage,
  onBack,
  onOpenModal,
  onCloseModal,
  onNewSiteNameChange,
  onNewSiteAddressChange,
  onCreateSite,
}: {
  client: Client
  sites: Site[]
  loading: boolean
  error: string
  modalOpen: boolean
  newSiteName: string
  newSiteAddress: string
  newSiteLoading: boolean
  newSiteMessage: string
  onBack: () => void
  onOpenModal: () => void
  onCloseModal: () => void
  onNewSiteNameChange: (value: string) => void
  onNewSiteAddressChange: (value: string) => void
  onCreateSite: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Voltar para clientes
      </button>

      <section className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Obras / unidades</p>
          <h3 className="mt-1 text-2xl font-bold">{client.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Locais onde os equipamentos deste cliente estão instalados.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus size={18} />
          Nova obra
        </button>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h4 className="font-bold">Obras cadastradas</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Total de registros: {sites.length}
          </p>
        </div>

        {loading && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando obras...
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center text-sm text-red-600 dark:text-red-300">{error}</div>
        )}

        {!loading && !error && sites.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
            <MapPin className="text-muted-foreground" size={34} />
            <div>
              <p className="font-medium text-foreground">
                Nenhuma obra cadastrada.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Clique em &quot;Nova obra&quot; para cadastrar a primeira
                unidade deste cliente.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenModal}
              className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              Nova obra
            </button>
          </div>
        )}

        {!loading && !error && sites.length > 0 && (
          <div className="divide-y divide-border">
            {sites.map((site) => (
              <div
                key={site.id}
                className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-red-600 dark:text-red-400">
                    <MapPin size={20} />
                  </div>

                  <div>
                    <p className="font-semibold">{site.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {site.address && site.address.trim().length > 0
                        ? site.address
                        : 'Sem endereço cadastrado'}
                    </p>
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    site.active
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {site.active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
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
                <h3 className="mt-1 text-xl font-bold">Cadastrar obra</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vinculada a {client.name}
                </p>
              </div>

              <button
                type="button"
                onClick={onCloseModal}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={onCreateSite}>
              <div>
                <label
                  htmlFor="siteName"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Nome da obra
                </label>

                <input
                  id="siteName"
                  type="text"
                  required
                  autoFocus
                  value={newSiteName}
                  onChange={(event) => onNewSiteNameChange(event.target.value)}
                  placeholder="Ex.: Obra Centro / Unidade Matriz"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="siteAddress"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Endereço{' '}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>

                <input
                  id="siteAddress"
                  type="text"
                  value={newSiteAddress}
                  onChange={(event) =>
                    onNewSiteAddressChange(event.target.value)
                  }
                  placeholder="Ex.: Rua Exemplo, 123 - Bairro"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
                />
              </div>

              {newSiteMessage && (
                <p className="rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
                  {newSiteMessage}
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
                  disabled={newSiteLoading}
                  className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {newSiteLoading ? 'Salvando...' : 'Cadastrar obra'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
