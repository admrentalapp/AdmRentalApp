import { type FormEvent } from 'react'
import { CheckSquare, Play } from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import type { ChecklistRun, ChecklistTemplate, EquipmentWithAllocation } from '@/types'

export function ChecklistPage({
  templates,
  runs,
  equipment,
  loading,
  error,
  selectedTemplateId,
  selectedEquipmentId,
  notes,
  startLoading,
  startMessage,
  onTemplateChange,
  onEquipmentChange,
  onNotesChange,
  onStartRun,
  onReload,
}: {
  templates: ChecklistTemplate[]
  runs: ChecklistRun[]
  equipment: EquipmentWithAllocation[]
  loading: boolean
  error: string
  selectedTemplateId: string
  selectedEquipmentId: string
  notes: string
  startLoading: boolean
  startMessage: string
  onTemplateChange: (value: string) => void
  onEquipmentChange: (value: string) => void
  onNotesChange: (value: string) => void
  onStartRun: (event: FormEvent<HTMLFormElement>) => void
  onReload: () => void
}) {
  const templateName = (id: string) =>
    templates.find((item) => item.id === id)?.name ?? 'Modelo'

  return (
    <>
      <section>
        <p className="text-sm text-zinc-500">Inspeções programadas</p>
        <h3 className="mt-1 text-2xl font-bold">Checklist</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Execute checklists de inspeção vinculados a equipamentos.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h4 className="font-bold">Iniciar checklist</h4>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onStartRun}>
          <select
            value={selectedTemplateId}
            onChange={(event) => onTemplateChange(event.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
            required
          >
            <option value="">Selecione o modelo...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <select
            value={selectedEquipmentId}
            onChange={(event) => onEquipmentChange(event.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
          >
            <option value="">Equipamento (opcional)</option>
            {equipment.map((item) => (
              <option key={item.id} value={item.id}>
                {item.asset_tag} — {item.description}
              </option>
            ))}
          </select>
          <input
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Observações iniciais"
            className="md:col-span-2 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white"
          />
          {startMessage && (
            <p className="md:col-span-2 text-sm text-red-300">{startMessage}</p>
          )}
          <button
            type="submit"
            disabled={startLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Play size={16} />
            {startLoading ? 'Iniciando...' : 'Iniciar checklist'}
          </button>
        </form>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <h4 className="font-bold">Execuções recentes</h4>
          <button type="button" onClick={onReload} className="text-sm text-red-400">
            Atualizar
          </button>
        </div>
        {loading && <p className="p-8 text-sm text-zinc-400">Carregando...</p>}
        {!loading && error && <p className="p-8 text-sm text-red-300">{error}</p>}
        {!loading && !error && runs.length === 0 && (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-8">
            <CheckSquare className="text-zinc-600" size={32} />
            <p className="text-sm text-zinc-400">Nenhum checklist executado ainda.</p>
          </div>
        )}
        {!loading && runs.length > 0 && (
          <div className="divide-y divide-zinc-800">
            {runs.map((run) => (
              <div
                key={run.id}
                className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{templateName(run.template_id)}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatDateTime(run.created_at)}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    run.status === 'concluido'
                      ? 'bg-emerald-950 text-emerald-400'
                      : 'bg-amber-950 text-amber-300'
                  }`}
                >
                  {run.status === 'concluido' ? 'Concluído' : 'Em andamento'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
