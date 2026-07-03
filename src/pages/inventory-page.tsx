import { type FormEvent } from 'react'
import { AlertTriangle, Package, Plus, X } from 'lucide-react'
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
          <p className="text-sm text-zinc-500">Peças e insumos</p>
          <h3 className="mt-1 text-2xl font-bold">Estoque</h3>
          <p className="mt-2 text-sm text-zinc-400">
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
        <section className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-400" size={18} />
          <div>
            <p className="text-sm font-semibold text-amber-200">
              {lowStock.length} item(ns) abaixo do estoque mínimo
            </p>
            <p className="mt-1 text-sm text-amber-100/80">
              {lowStock.map((part) => part.name).join(', ')}
            </p>
          </div>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h4 className="font-bold">Movimentar estoque</h4>
        <form
          className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
          onSubmit={onRegisterMovement}
        >
          <select
            value={movementPartId}
            onChange={(event) => onMovementPartChange(event.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
            required
          >
            <option value="">Selecione a peça...</option>
            {parts.map((part) => (
              <option key={part.id} value={part.id}>
                {part.sku} — {part.name} ({part.current_stock})
              </option>
            ))}
          </select>
          <select
            value={movementType}
            onChange={(event) =>
              onMovementTypeChange(
                event.target.value as 'entrada' | 'saida' | 'ajuste',
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="ajuste">Ajuste</option>
          </select>
          <input
            type="number"
            min={1}
            value={movementQty}
            onChange={(event) => onMovementQtyChange(event.target.value)}
            placeholder="Quantidade"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
            required
          />
          <input
            value={movementNotes}
            onChange={(event) => onMovementNotesChange(event.target.value)}
            placeholder="Observação"
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
          />
          <button
            type="submit"
            disabled={movementLoading}
            className="rounded-lg bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-white disabled:opacity-60"
          >
            {movementLoading ? 'Salvando...' : 'Registrar'}
          </button>
        </form>
        {movementMessage && (
          <p className="mt-3 text-sm text-red-300">{movementMessage}</p>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <h4 className="font-bold">Itens em estoque</h4>
          <button type="button" onClick={onReload} className="text-sm text-red-400">
            Atualizar
          </button>
        </div>
        {loading && <p className="p-8 text-sm text-zinc-400">Carregando...</p>}
        {!loading && error && <p className="p-8 text-sm text-red-300">{error}</p>}
        {!loading && !error && parts.length === 0 && (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center">
            <Package className="text-zinc-600" size={32} />
            <p className="text-sm text-zinc-400">Nenhuma peça cadastrada.</p>
          </div>
        )}
        {!loading && parts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/40 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-6 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Atual</th>
                  <th className="px-4 py-3 text-left">Mínimo</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {parts.map((part) => (
                  <tr key={part.id}>
                    <td className="px-6 py-3 font-medium">{part.sku}</td>
                    <td className="px-4 py-3">{part.name}</td>
                    <td className="px-4 py-3">{part.current_stock}</td>
                    <td className="px-4 py-3">{part.min_stock}</td>
                    <td className="px-6 py-3">
                      {isPartBelowMinimum(part) ? (
                        <span className="text-amber-400">Abaixo do mínimo</span>
                      ) : (
                        <span className="text-emerald-400">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5">
          <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold">Nova peça</h3>
              <button type="button" onClick={onCloseModal} className="text-zinc-400">
                <X size={20} />
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={onCreatePart}>
              <input
                value={newSku}
                onChange={(event) => onNewSkuChange(event.target.value)}
                placeholder="SKU"
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
              />
              <input
                value={newName}
                onChange={(event) => onNewNameChange(event.target.value)}
                placeholder="Nome da peça"
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
              />
              <input
                value={newDescription}
                onChange={(event) => onNewDescriptionChange(event.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={0}
                  value={newCurrentStock}
                  onChange={(event) => onNewCurrentStockChange(event.target.value)}
                  placeholder="Estoque inicial"
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
                />
                <input
                  type="number"
                  min={0}
                  value={newMinStock}
                  onChange={(event) => onNewMinStockChange(event.target.value)}
                  placeholder="Estoque mínimo"
                  className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
                />
              </div>
              {newMessage && <p className="text-sm text-red-300">{newMessage}</p>}
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
    </>
  )
}
