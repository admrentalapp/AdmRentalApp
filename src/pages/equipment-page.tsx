import { type FormEvent } from 'react'
import {
  AlertTriangle,
  Link2,
  PencilLine,
  Plus,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
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
  editEquipment,
  editAssetTag,
  editDescription,
  editSerial,
  editLoading,
  editMessage,
  deactivateEquipment,
  deactivateLoading,
  deactivateMessage,
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
  onOpenEditModal,
  onCloseEditModal,
  onEditAssetTagChange,
  onEditDescriptionChange,
  onEditSerialChange,
  onUpdateEquipment,
  onOpenDeactivateModal,
  onCloseDeactivateModal,
  onDeactivateEquipment,
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
  editEquipment: EquipmentWithAllocation | null
  editAssetTag: string
  editDescription: string
  editSerial: string
  editLoading: boolean
  editMessage: string
  deactivateEquipment: EquipmentWithAllocation | null
  deactivateLoading: boolean
  deactivateMessage: string
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
  onOpenEditModal: (item: EquipmentWithAllocation) => void
  onCloseEditModal: () => void
  onEditAssetTagChange: (value: string) => void
  onEditDescriptionChange: (value: string) => void
  onEditSerialChange: (value: string) => void
  onUpdateEquipment: (event: FormEvent<HTMLFormElement>) => void
  onOpenDeactivateModal: (item: EquipmentWithAllocation) => void
  onCloseDeactivateModal: () => void
  onDeactivateEquipment: () => void
  onOpenAllocateModal: (item: EquipmentWithAllocation) => void
  onCloseAllocateModal: () => void
  onAllocateClientChange: (clientId: string) => void
  onAllocateSiteChange: (siteId: string) => void
  onCreateAllocation: (event: FormEvent<HTMLFormElement>) => void
  onEndAllocation: (allocationId: string) => void
}) {
  const filterClient = clients.find((item) => item.id === filterClientId)
  const allocateClient = clients.find((item) => item.id === allocateClientId)
  const activeFleet = fleet.filter((item) => item.active)
  const inactiveCount = fleet.length - activeFleet.length

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

  const availableCount = activeFleet.filter((item) => !item.allocation).length
  const allocatedCount = activeFleet.filter((item) => item.allocation).length

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
          <p className="text-sm text-muted-foreground">Total ativo na frota</p>
          <p className="mt-2 text-2xl font-bold">{activeFleet.length}</p>
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
            Equipamentos ativos: {activeFleet.length}
          </p>
          {inactiveCount > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Inativos preservados no histórico: {inactiveCount}
            </p>
          )}
        </div>

        {loading && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Carregando equipamentos...
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center text-sm text-red-600 dark:text-red-300">{error}</div>
        )}

        {!loading && !error && activeFleet.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
            <Wrench className="text-muted-foreground" size={34} />
            <div>
              <p className="font-medium text-foreground">
                {filterClientId
                  ? 'Nenhum equipamento alocado a este cliente.'
                  : 'Nenhum equipamento ativo cadastrado na frota.'}
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

        {!loading && !error && activeFleet.length > 0 && (
          <div className="divide-y divide-border">
            {activeFleet.map((item) => (
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
                  <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    Ativo
                  </span>

                  <button
                    type="button"
                    onClick={() => onOpenEditModal(item)}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    <PencilLine size={16} />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenDeactivateModal(item)}
                    className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={16} />
                    Apagar
                  </button>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Novo patrimônio</p>
                <h3 className="mt-1 text-xl font-bold">Cadastrar na frota ADM</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  O equipamento pertence à ADM. Aloque depois a um cliente.
                </p>
              </div>

              <button
                type="button"
                onClick={onCloseNewModal}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
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
                  className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent sm:w-auto"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={newLoading}
                  className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {newLoading ? 'Salvando...' : 'Cadastrar equipamento'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {editEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Editar patrimônio</p>
                <h3 className="mt-1 text-xl font-bold">Atualizar equipamento</h3>
              </div>

              <button
                type="button"
                onClick={onCloseEditModal}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form className="mt-6 space-y-5" onSubmit={onUpdateEquipment}>
              <div>
                <label
                  htmlFor="editEquipmentAssetTag"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Tag / patrimônio
                </label>
                <input
                  id="editEquipmentAssetTag"
                  type="text"
                  required
                  autoFocus
                  value={editAssetTag}
                  onChange={(event) => onEditAssetTagChange(event.target.value)}
                  placeholder="Ex.: EQ-001"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="editEquipmentDescription"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Descrição
                </label>
                <input
                  id="editEquipmentDescription"
                  type="text"
                  required
                  value={editDescription}
                  onChange={(event) => onEditDescriptionChange(event.target.value)}
                  placeholder="Ex.: Gerador 150 kVA"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
                />
              </div>

              <div>
                <label
                  htmlFor="editEquipmentSerial"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Número de série{' '}
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                </label>
                <input
                  id="editEquipmentSerial"
                  type="text"
                  value={editSerial}
                  onChange={(event) => onEditSerialChange(event.target.value)}
                  placeholder="Ex.: SN123456789"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground outline-none placeholder:text-muted-foreground focus:border-red-500"
                />
              </div>

              {editMessage && (
                <p className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {editMessage}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCloseEditModal}
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

      {deactivateEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-red-100 p-3 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Apagar equipamento da lista</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    O equipamento será apenas inativado para preservar o histórico.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-foreground">
                Deseja inativar o equipamento{' '}
                <span className="font-semibold">{deactivateEquipment.asset_tag}</span>?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {deactivateEquipment.allocation
                  ? 'Este item possui locação ativa. Encerre a locação antes de apagar da lista.'
                  : 'O patrimônio sairá da lista principal, mas os registros históricos serão preservados.'}
              </p>

              {deactivateMessage && (
                <p className="mt-4 rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {deactivateMessage}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                disabled={deactivateLoading}
                onClick={onCloseDeactivateModal}
                className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60 sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deactivateLoading}
                onClick={onDeactivateEquipment}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
              >
                <Trash2 size={16} />
                {deactivateLoading ? 'Apagando...' : 'Apagar da lista'}
              </button>
            </div>
          </section>
        </div>
      )}

      {allocateModalOpen && allocateEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Locação</p>
                <h3 className="mt-1 text-xl font-bold">Alocar equipamento</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {allocateEquipment.asset_tag} — {allocateEquipment.description}
                </p>
              </div>

              <button
                type="button"
                onClick={onCloseAllocateModal}
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
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
                  className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-accent sm:w-auto"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={allocateLoading}
                  className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
