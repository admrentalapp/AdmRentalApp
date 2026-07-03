import { type FormEvent } from 'react'
import { Link2, Plus, Wrench, X } from 'lucide-react'
import type { Client, EquipmentWithAllocation, Site } from '@/types'

export function EquipmentPage({
  clients,
  sites,
  fleet,
  filterClientId,
  filterSiteId,
  loading,
  error,
  newModalOpen,
  newAssetTag,
  newDescription,
  newSerial,
  newLoading,
  newMessage,
  allocateModalOpen,
  allocateEquipment,
  allocateClientId,
  allocateSiteId,
  allocateLoading,
  allocateMessage,
  onFilterClientChange,
  onFilterSiteChange,
  onOpenNewModal,
  onCloseNewModal,
  onNewAssetTagChange,
  onNewDescriptionChange,
  onNewSerialChange,
  onCreateEquipment,
  onOpenAllocateModal,
  onCloseAllocateModal,
  onAllocateClientChange,
  onAllocateSiteChange,
  onCreateAllocation,
  onEndAllocation,
}: {
  clients: Client[]
  sites: Site[]
  fleet: EquipmentWithAllocation[]
  filterClientId: string
  filterSiteId: string
  loading: boolean
  error: string
  newModalOpen: boolean
  newAssetTag: string
  newDescription: string
  newSerial: string
  newLoading: boolean
  newMessage: string
  allocateModalOpen: boolean
  allocateEquipment: EquipmentWithAllocation | null
  allocateClientId: string
  allocateSiteId: string
  allocateLoading: boolean
  allocateMessage: string
  onFilterClientChange: (clientId: string) => void
  onFilterSiteChange: (siteId: string) => void
  onOpenNewModal: () => void
  onCloseNewModal: () => void
  onNewAssetTagChange: (value: string) => void
  onNewDescriptionChange: (value: string) => void
  onNewSerialChange: (value: string) => void
  onCreateEquipment: (event: FormEvent<HTMLFormElement>) => void
  onOpenAllocateModal: (item: EquipmentWithAllocation) => void
  onCloseAllocateModal: () => void
  onAllocateClientChange: (clientId: string) => void
  onAllocateSiteChange: (siteId: string) => void
  onCreateAllocation: (event: FormEvent<HTMLFormElement>) => void
  onEndAllocation: (allocationId: string) => void
}) {
  const filterClient = clients.find((item) => item.id === filterClientId)
  const allocateClient = clients.find((item) => item.id === allocateClientId)

  function clientName(clientId: string) {
    return clients.find((item) => item.id === clientId)?.name ?? 'Cliente'
  }

  function siteName(siteId: string | null) {
    if (!siteId) return 'Sem obra definida'
    return sites.find((item) => item.id === siteId)?.name ?? 'Obra'
  }

  function allocationSiteName(siteId: string | null, clientId: string) {
    if (!siteId) return 'Sem obra definida'
    return (
      sites.find((item) => item.id === siteId && item.client_id === clientId)
        ?.name ?? 'Obra'
    )
  }

  const availableCount = fleet.filter((item) => !item.allocation).length
  const allocatedCount = fleet.filter((item) => item.allocation).length

  return (
    <>
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Frota ADM</p>
          <h3 className="mt-1 text-2xl font-bold">Equipamentos</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Patrimônio da ADM em locação nos clientes. Cadastre na frota e aloque
            a uma empresa e obra.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus size={18} />
          Novo equipamento
        </button>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total na frota</p>
          <p className="mt-2 text-2xl font-bold">{fleet.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Em locação</p>
          <p className="mt-2 text-2xl font-bold">{allocatedCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Disponíveis</p>
          <p className="mt-2 text-2xl font-bold">{availableCount}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="equipmentFilterClient"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Filtrar por cliente{' '}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <select
            id="equipmentFilterClient"
            value={filterClientId}
            onChange={(event) => onFilterClientChange(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500"
          >
            <option value="">Toda a frota</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="equipmentFilterSite"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            Filtrar por obra{' '}
            <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <select
            id="equipmentFilterSite"
            value={filterSiteId}
            onChange={(event) => onFilterSiteChange(event.target.value)}
            disabled={!filterClientId}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Todas as obras</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h4 className="font-bold">
            {filterClient
              ? `Equipamentos alocados a ${filterClient.name}`
              : 'Frota completa ADM'}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Total de registros: {fleet.length}
          </p>
        </div>

        {loading && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando equipamentos...
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center text-sm text-red-600 dark:text-red-300">{error}</div>
        )}

        {!loading && !error && fleet.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
            <Wrench className="text-muted-foreground" size={34} />
            <div>
              <p className="font-medium text-foreground">
                {filterClientId
                  ? 'Nenhum equipamento alocado a este cliente.'
                  : 'Nenhum equipamento cadastrado na frota.'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Cadastre equipamentos da ADM e aloque aos clientes em locação.
              </p>
            </div>
            {!filterClientId && (
              <button
                type="button"
                onClick={onOpenNewModal}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Novo equipamento
              </button>
            )}
          </div>
        )}

        {!loading && !error && fleet.length > 0 && (
          <div className="divide-y divide-border">
            {fleet.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-red-600 dark:text-red-400">
                    <Wrench size={20} />
                  </div>

                  <div>
                    <p className="font-semibold">{item.asset_tag}</p>
                    <p className="mt-1 text-sm text-foreground">
                      {item.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.serial_number
                        ? `Série: ${item.serial_number}`
                        : 'Sem número de série'}
                    </p>
                    {item.allocation ? (
                      <p className="mt-2 text-xs text-sky-600 dark:text-sky-300">
                        Em locação: {clientName(item.allocation.client_id)}
                        {' · '}
                        {allocationSiteName(
                          item.allocation.site_id,
                          item.allocation.client_id,
                        )}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                        Disponível na frota ADM
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      item.active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.active ? 'Ativo' : 'Inativo'}
                  </span>

                  {!item.allocation ? (
                    <button
                      type="button"
                      onClick={() => onOpenAllocateModal(item)}
                      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      <Link2 size={16} />
                      Alocar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onEndAllocation(item.allocation!.id)}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      Encerrar locação
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5">
          <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Novo patrimônio</p>
                <h3 className="mt-1 text-xl font-bold">Cadastrar na frota ADM</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  O equipamento pertence à ADM. Aloque depois a um cliente.
                </p>
              </div>

              <button
                type="button"
                onClick={onCloseNewModal}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={onCreateEquipment}>
              <div>
                <label
                  htmlFor="equipmentAssetTag"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Tag / patrimônio
                </label>
                <input
                  id="equipmentAssetTag"
                  type="text"
                  required
                  autoFocus
                  value={newAssetTag}
                  onChange={(event) => onNewAssetTagChange(event.target.value)}
                  placeholder="Ex.: EQ-001"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="equipmentDescription"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Descrição
                </label>
                <input
                  id="equipmentDescription"
                  type="text"
                  required
                  value={newDescription}
                  onChange={(event) =>
                    onNewDescriptionChange(event.target.value)
                  }
                  placeholder="Ex.: Gerador 150 kVA"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="equipmentSerial"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Número de série{' '}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <input
                  id="equipmentSerial"
                  type="text"
                  value={newSerial}
                  onChange={(event) => onNewSerialChange(event.target.value)}
                  placeholder="Ex.: SN123456789"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
                />
              </div>

              {newMessage && (
                <p className="rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
                  {newMessage}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCloseNewModal}
                  className="rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={newLoading}
                  className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {newLoading ? 'Salvando...' : 'Cadastrar equipamento'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {allocateModalOpen && allocateEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5">
          <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Locação</p>
                <h3 className="mt-1 text-xl font-bold">Alocar equipamento</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {allocateEquipment.asset_tag} — {allocateEquipment.description}
                </p>
              </div>

              <button
                type="button"
                onClick={onCloseAllocateModal}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={onCreateAllocation}>
              <div>
                <label
                  htmlFor="allocateClient"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Cliente
                </label>
                <select
                  id="allocateClient"
                  required
                  value={allocateClientId}
                  onChange={(event) =>
                    onAllocateClientChange(event.target.value)
                  }
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

              <div>
                <label
                  htmlFor="allocateSite"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Obra{' '}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <select
                  id="allocateSite"
                  value={allocateSiteId}
                  onChange={(event) => onAllocateSiteChange(event.target.value)}
                  disabled={!allocateClientId}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-red-500 disabled:opacity-50"
                >
                  <option value="">Sem obra definida</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              {allocateClient && (
                <p className="text-xs text-muted-foreground">
                  O equipamento permanece da ADM e ficará em locação em{' '}
                  {allocateClient.name}
                  {allocateSiteId
                    ? ` · ${siteName(allocateSiteId)}`
                    : ''}
                  .
                </p>
              )}

              {allocateMessage && (
                <p className="rounded-lg border border-red-300 bg-red-100 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-200">
                  {allocateMessage}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCloseAllocateModal}
                  className="rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={allocateLoading}
                  className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {allocateLoading ? 'Salvando...' : 'Confirmar alocação'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
