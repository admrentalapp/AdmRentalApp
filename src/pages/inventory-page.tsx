import { type FormEvent } from 'react'
import { AlertTriangle, Package, PencilLine, Plus, Trash2, X } from 'lucide-react'
import { isPartBelowMinimum } from '@/features/inventory/api'
import type { Part } from '@/types'

export function InventoryPage({
  parts,
  loading,
  error,
  modalOpen,
  newSku,
  newName,
  newDescription,
  newMinStock,
  newCurrentStock,
  newLoading,
  newMessage,
  editPart,
  editSku,
  editName,
  editDescription,
  editMinStock,
  editCurrentStock,
  editLoading,
  editMessage,
  deactivatePart,
  deactivateLoading,
  deactivateMessage,
  movementPartId,
  movementType,
  movementQty,
  movementNotes,
  movementLoading,
  movementMessage,
  onOpenModal,
  onCloseModal,
  onNewSkuChange,
  onNewNameChange,
  onNewDescriptionChange,
  onNewMinStockChange,
  onNewCurrentStockChange,
  onCreatePart,
  onOpenEditModal,
  onCloseEditModal,
  onEditSkuChange,
  onEditNameChange,
  onEditDescriptionChange,
  onEditMinStockChange,
  onEditCurrentStockChange,
  onUpdatePart,
  onOpenDeactivateModal,
  onCloseDeactivateModal,
  onDeactivatePart,
  onMovementPartChange,
  onMovementTypeChange,
  onMovementQtyChange,
  onMovementNotesChange,
  onRegisterMovement,
  onReload,
}: {
  parts: Part[]
  loading: boolean
  error: string
  modalOpen: boolean
  newSku: string
  newName: string
  newDescription: string
  newMinStock: string
  newCurrentStock: string
  newLoading: boolean
  newMessage: string
  editPart: Part | null
  editSku: string
  editName: string
  editDescription: string
  editMinStock: string
  editCurrentStock: string
  editLoading: boolean
  editMessage: string
  deactivatePart: Part | null
  deactivateLoading: boolean
  deactivateMessage: string
  movementPartId: string
  movementType: 'entrada' | 'saida' | 'ajuste'
  movementQty: string
  movementNotes: string
  movementLoading: boolean
  movementMessage: string
  onOpenModal: () => void
  onCloseModal: () => void
  onNewSkuChange: (value: string) => void
  onNewNameChange: (value: string) => void
  onNewDescriptionChange: (value: string) => void
  onNewMinStockChange: (value: string) => void
  onNewCurrentStockChange: (value: string) => void
  onCreatePart: (event: FormEvent<HTMLFormElement>) => void
  onOpenEditModal: (part: Part) => void
  onCloseEditModal: () => void
  onEditSkuChange: (value: string) => void
  onEditNameChange: (value: string) => void
  onEditDescriptionChange: (value: string) => void
  onEditMinStockChange: (value: string) => void
  onEditCurrentStockChange: (value: string) => void
  onUpdatePart: (event: FormEvent<HTMLFormElement>) => void
  onOpenDeactivateModal: (part: Part) => void
  onCloseDeactivateModal: () => void
  onDeactivatePart: () => void
  onMovementPartChange: (value: string) => void
  onMovementTypeChange: (value: 'entrada' | 'saida' | 'ajuste') => void
  onMovementQtyChange: (value: string) => void
  onMovementNotesChange: (value: string) => void
  onRegisterMovement: (event: FormEvent<HTMLFormElement>) => void
  onReload: () => void
}) {
  const lowStock = parts.filter(isPartBelowMinimum)

  return (
    <>
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Peças e insumos</p>
          <h3 className="mt-1 text-2xl font-bold">Estoque</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Controle de peças, estoque mínimo e movimentações.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenModal}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Plus size={16} />
          Nova peça
        </button>
      </section>

      {lowStock.length > 0 && (
        <section className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-100 dark:bg-amber-950/20 p-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={18} />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">
              {lowStock.length} item(ns) abaixo do estoque mínimo
            </p>
            <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-100/80">
              {lowStock.map((part) => part.name).join(', ')}
            </p>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h4 className="font-bold">Movimentar estoque</h4>
        <form
          className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
          onSubmit={onRegisterMovement}
        >
          <div className="space-y-2">
            <label
              htmlFor="movementPart"
              className="block text-sm font-medium text-muted-foreground"
            >
              Peça
            </label>
            <select
              id="movementPart"
              value={movementPartId}
              onChange={(event) => onMovementPartChange(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
              required
            >
              <option value="">Selecione a peça...</option>
              {parts.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.sku} — {part.name} ({part.current_stock})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="movementType"
              className="block text-sm font-medium text-muted-foreground"
            >
              Tipo de movimentação
            </label>
            <select
              id="movementType"
              value={movementType}
              onChange={(event) =>
                onMovementTypeChange(
                  event.target.value as 'entrada' | 'saida' | 'ajuste',
                )
              }
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="movementQuantity"
              className="block text-sm font-medium text-muted-foreground"
            >
              Quantidade
            </label>
            <input
              id="movementQuantity"
              type="number"
              min={1}
              value={movementQty}
              onChange={(event) => onMovementQtyChange(event.target.value)}
              placeholder="Quantidade"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
              required
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="movementNotes"
              className="block text-sm font-medium text-muted-foreground"
            >
              Observação
            </label>
            <input
              id="movementNotes"
              value={movementNotes}
              onChange={(event) => onMovementNotesChange(event.target.value)}
              placeholder="Observação"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={movementLoading}
              className="w-full rounded-lg bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-white disabled:opacity-60"
            >
              {movementLoading ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
        {movementMessage && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-300">{movementMessage}</p>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h4 className="font-bold">Itens em estoque</h4>
          <button type="button" onClick={onReload} className="text-sm text-red-600 dark:text-red-400">
            Atualizar
          </button>
        </div>
        {loading && <p className="p-8 text-sm text-muted-foreground">Carregando...</p>}
        {!loading && error && <p className="p-8 text-sm text-red-600 dark:text-red-300">{error}</p>}
        {!loading && !error && parts.length === 0 && (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center">
            <Package className="text-muted-foreground" size={32} />
            <p className="text-sm text-muted-foreground">Nenhuma peça cadastrada.</p>
          </div>
        )}
        {!loading && parts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-background/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Atual</th>
                  <th className="px-4 py-3 text-left">Mínimo</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parts.map((part) => (
                  <tr key={part.id}>
                    <td className="px-6 py-3 font-medium">{part.sku}</td>
                    <td className="px-4 py-3">{part.name}</td>
                    <td className="px-4 py-3">{part.current_stock}</td>
                    <td className="px-4 py-3">{part.min_stock}</td>
                    <td className="px-6 py-3">
                      {isPartBelowMinimum(part) ? (
                        <span className="text-amber-600 dark:text-amber-400">Abaixo do mínimo</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">OK</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(part)}
                          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
                        >
                          <PencilLine size={14} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDeactivateModal(part)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-950 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          <Trash2 size={14} />
                          Apagar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-bold">Nova peça</h3>
              <button
                type="button"
                onClick={onCloseModal}
                className="shrink-0 text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={onCreatePart}>
              <div className="space-y-2">
                <label
                  htmlFor="newPartSku"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Tag / Patrimônio da peça
                </label>
                <input
                  id="newPartSku"
                  value={newSku}
                  onChange={(event) => onNewSkuChange(event.target.value)}
                  placeholder="Tag"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="newPartName"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Nome da peça
                </label>
                <input
                  id="newPartName"
                  value={newName}
                  onChange={(event) => onNewNameChange(event.target.value)}
                  placeholder="Nome da peça"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="newPartDescription"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Descrição <span className="font-normal">(opcional)</span>
                </label>
                <input
                  id="newPartDescription"
                  value={newDescription}
                  onChange={(event) => onNewDescriptionChange(event.target.value)}
                  placeholder="Descrição (opcional)"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label
                    htmlFor="newPartCurrentStock"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    Estoque inicial
                  </label>
                  <input
                    id="newPartCurrentStock"
                    type="number"
                    min={0}
                    value={newCurrentStock}
                    onChange={(event) => onNewCurrentStockChange(event.target.value)}
                    placeholder="Estoque inicial"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="newPartMinStock"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    Estoque mínimo
                  </label>
                  <input
                    id="newPartMinStock"
                    type="number"
                    min={0}
                    value={newMinStock}
                    onChange={(event) => onNewMinStockChange(event.target.value)}
                    placeholder="Estoque mínimo"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
              </div>
              {newMessage && <p className="text-sm text-red-600 dark:text-red-300">{newMessage}</p>}
              <button
                type="submit"
                disabled={newLoading}
                className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white disabled:opacity-60"
              >
                {newLoading ? 'Salvando...' : 'Cadastrar peça'}
              </button>
            </form>
          </section>
        </div>
      )}

      {editPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-bold">Editar peça</h3>
              <button
                type="button"
                onClick={onCloseEditModal}
                className="shrink-0 text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={onUpdatePart}>
              <div className="space-y-2">
                <label
                  htmlFor="editPartSku"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Tag / Patrimônio da peça
                </label>
                <input
                  id="editPartSku"
                  value={editSku}
                  onChange={(event) => onEditSkuChange(event.target.value)}
                  placeholder="Tag"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="editPartName"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Nome da peça
                </label>
                <input
                  id="editPartName"
                  value={editName}
                  onChange={(event) => onEditNameChange(event.target.value)}
                  placeholder="Nome da peça"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="editPartDescription"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Descrição <span className="font-normal">(opcional)</span>
                </label>
                <input
                  id="editPartDescription"
                  value={editDescription}
                  onChange={(event) => onEditDescriptionChange(event.target.value)}
                  placeholder="Descrição (opcional)"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label
                    htmlFor="editPartCurrentStock"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    Estoque atual
                  </label>
                  <input
                    id="editPartCurrentStock"
                    type="number"
                    min={0}
                    value={editCurrentStock}
                    onChange={(event) => onEditCurrentStockChange(event.target.value)}
                    placeholder="Estoque atual"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="editPartMinStock"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    Estoque mínimo
                  </label>
                  <input
                    id="editPartMinStock"
                    type="number"
                    min={0}
                    value={editMinStock}
                    onChange={(event) => onEditMinStockChange(event.target.value)}
                    placeholder="Estoque mínimo"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                  />
                </div>
              </div>
              {editMessage && <p className="text-sm text-red-600 dark:text-red-300">{editMessage}</p>}
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
                  className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 sm:w-auto"
                >
                  {editLoading ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deactivatePart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 sm:p-5">
          <section className="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-red-100 p-3 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Apagar peça da lista</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A peça será apenas inativada para preservar movimentações e histórico.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-foreground">
                Deseja inativar a peça <span className="font-semibold">{deactivatePart.name}</span>?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ela sairá da lista principal, mas os registros históricos serão preservados.
              </p>
              {deactivateMessage && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-300">{deactivateMessage}</p>
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
                onClick={onDeactivatePart}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
              >
                <Trash2 size={16} />
                {deactivateLoading ? 'Apagando...' : 'Apagar da lista'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
