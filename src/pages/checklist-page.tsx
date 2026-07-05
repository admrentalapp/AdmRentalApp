import { useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  CheckSquare,
  ChevronRight,
  ListChecks,
  Play,
  Plus,
  Save,
  Settings2,
  Trash2,
  X,
} from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import {
  completeChecklistRun,
  createChecklistTemplate,
  createChecklistItem,
  deleteChecklistItem,
  deleteChecklistRun,
  fetchChecklistItems,
  fetchRunItems,
  updateChecklistItem,
  updateRunItem,
} from '@/features/checklists/api'
import type {
  ChecklistItem,
  ChecklistRun,
  ChecklistRunItem,
  ChecklistTemplate,
  EquipmentWithAllocation,
} from '@/types'

type ChecklistItemMeta = {
  label: string
  sort_order: number
  required: boolean
}

type RunItemRow = ChecklistRunItem & {
  checklist_items: ChecklistItemMeta | ChecklistItemMeta[] | null
}

function checklistItemMeta(item: RunItemRow): ChecklistItemMeta | null {
  const related = item.checklist_items
  if (!related) return null
  if (Array.isArray(related)) return related[0] ?? null
  return related
}

function normalizeTemplateName(name: string) {
  return name.trim().toLocaleLowerCase('pt-BR')
}

function buildVisibleTemplates(templates: ChecklistTemplate[], activeOnly: boolean) {
  const visible = activeOnly ? templates.filter((template) => template.active) : templates
  const deduped = new Map<string, ChecklistTemplate>()

  for (const template of visible) {
    const key = normalizeTemplateName(template.name)
    const current = deduped.get(key)

    if (!current) {
      deduped.set(key, template)
      continue
    }

    const currentTime = new Date(current.created_at).getTime()
    const templateTime = new Date(template.created_at).getTime()
    const shouldReplace =
      (!current.active && template.active) ||
      (current.active === template.active && templateTime < currentTime)

    if (shouldReplace) {
      deduped.set(key, template)
    }
  }

  return Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

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
  isGestor,
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
  isGestor: boolean
  onTemplateChange: (value: string) => void
  onEquipmentChange: (value: string) => void
  onNotesChange: (value: string) => void
  onStartRun: (event: FormEvent<HTMLFormElement>) => void
  onReload: () => void
}) {
  const startTemplates = buildVisibleTemplates(templates, true)
  const manageTemplates = buildVisibleTemplates(templates, false)

  const templateName = (id: string) =>
    templates.find((item) => item.id === id)?.name ?? 'Modelo'

  // --- Detalhe / execução de uma run ---
  const [detailRun, setDetailRun] = useState<ChecklistRun | null>(null)
  const [detailItems, setDetailItems] = useState<RunItemRow[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [detailSaving, setDetailSaving] = useState(false)
  const [runDeleteId, setRunDeleteId] = useState('')
  const [pendingRunDelete, setPendingRunDelete] = useState<ChecklistRun | null>(null)

  async function openRun(run: ChecklistRun) {
    setDetailRun(run)
    setDetailItems([])
    setDetailError('')
    setDetailLoading(true)
    const { data, error: itemsError } = await fetchRunItems(run.id)
    setDetailLoading(false)
    if (itemsError) {
      setDetailError(itemsError.message || 'Não foi possível carregar os itens.')
      return
    }
    const rows = ((data ?? []) as RunItemRow[]).sort(
      (a, b) =>
        (checklistItemMeta(a)?.sort_order ?? 0) -
        (checklistItemMeta(b)?.sort_order ?? 0),
    )
    setDetailItems(rows)
  }

  function closeRun() {
    setDetailRun(null)
    setDetailItems([])
    setDetailError('')
  }

  function setItemChecked(id: string, checked: boolean) {
    setDetailItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked } : item)),
    )
  }

  function setItemObservation(id: string, observation: string) {
    setDetailItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, observation } : item)),
    )
  }

  async function saveDetail(markComplete: boolean) {
    if (!detailRun) return

    if (markComplete) {
      const missingRequired = detailItems.some(
        (item) => checklistItemMeta(item)?.required && !item.checked,
      )
      if (missingRequired) {
        setDetailError('Marque todos os itens obrigatórios antes de concluir.')
        return
      }
    }

    setDetailSaving(true)
    setDetailError('')

    for (const item of detailItems) {
      const { error: saveError } = await updateRunItem(
        item.id,
        item.checked,
        item.observation?.trim() ? item.observation.trim() : null,
      )
      if (saveError) {
        setDetailSaving(false)
        setDetailError(saveError.message || 'Não foi possível salvar os itens.')
        return
      }
    }

    if (markComplete) {
      const { error: completeError } = await completeChecklistRun(detailRun.id)
      if (completeError) {
        setDetailSaving(false)
        setDetailError(
          completeError.message || 'Não foi possível concluir o checklist.',
        )
        return
      }
    }

    setDetailSaving(false)
    closeRun()
    onReload()
  }

  async function removeRun(run: ChecklistRun) {
    setRunDeleteId(run.id)
    setDetailError('')
    const { data, error: deleteError } = await deleteChecklistRun(run.id)
    setRunDeleteId('')

    if (deleteError) {
      setDetailError(deleteError.message || 'Não foi possível excluir a execução.')
      return
    }

    if (!data?.length) {
      setDetailError(
        'A execução não foi excluída. Reexecute `supabase/checklists.sql` no Supabase para aplicar a policy de exclusão do gestor.',
      )
      return
    }

    if (detailRun?.id === run.id) {
      closeRun()
    }

    setPendingRunDelete(null)
    onReload()
  }

  const isRunConcluded = detailRun?.status === 'concluido'
  const detailProgress = detailItems.length
    ? detailItems.filter((item) => item.checked).length
    : 0

  // --- Gestão de itens do modelo (gestor) ---
  const [manageOpen, setManageOpen] = useState(false)
  const [manageTemplateId, setManageTemplateId] = useState('')
  const [manageItems, setManageItems] = useState<ChecklistItem[]>([])
  const [manageLoading, setManageLoading] = useState(false)
  const [manageError, setManageError] = useState('')
  const [manageBusy, setManageBusy] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [newItemLabel, setNewItemLabel] = useState('')
  const [newItemRequired, setNewItemRequired] = useState(true)

  async function loadManageItems(templateId: string) {
    if (!templateId) {
      setManageItems([])
      return
    }
    setManageLoading(true)
    setManageError('')
    const { data, error: itemsError } = await fetchChecklistItems(templateId)
    setManageLoading(false)
    if (itemsError) {
      setManageError(
        itemsError.message || 'Não foi possível carregar os itens do modelo.',
      )
      setManageItems([])
      return
    }
    setManageItems((data ?? []) as ChecklistItem[])
  }

  function onManageTemplateChange(value: string) {
    setManageTemplateId(value)
    setManageError('')
    void loadManageItems(value)
  }

  function updateManageItemLocal(id: string, patch: Partial<ChecklistItem>) {
    setManageItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  async function addManageTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newTemplateName.trim()) {
      setManageError('Informe o nome do novo modelo.')
      return
    }

    setManageBusy(true)
    setManageError('')

    const { data, error: createError } = await createChecklistTemplate({
      name: newTemplateName.trim(),
      description: newTemplateDescription.trim() || null,
    })

    setManageBusy(false)

    if (createError || !data) {
      const duplicateMessage =
        createError?.message?.includes('checklist_templates_active_name_unique') ||
        createError?.message?.toLowerCase().includes('duplicate')

      setManageError(
        duplicateMessage
          ? 'Já existe um modelo ativo com esse nome.'
          : createError?.message || 'Não foi possível criar o modelo.',
      )
      return
    }

    setNewTemplateName('')
    setNewTemplateDescription('')
    setManageTemplateId(data.id)
    setManageItems([])
    await loadManageItems(data.id)
    onReload()
  }

  async function addManageItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!manageTemplateId || !newItemLabel.trim()) return
    setManageBusy(true)
    setManageError('')
    const nextOrder =
      manageItems.reduce((max, item) => Math.max(max, item.sort_order), 0) + 1
    const { error: createError } = await createChecklistItem({
      templateId: manageTemplateId,
      label: newItemLabel.trim(),
      sortOrder: nextOrder,
      required: newItemRequired,
    })
    setManageBusy(false)
    if (createError) {
      setManageError(createError.message || 'Não foi possível adicionar o item.')
      return
    }
    setNewItemLabel('')
    setNewItemRequired(true)
    await loadManageItems(manageTemplateId)
  }

  async function saveManageItem(item: ChecklistItem) {
    if (!item.label.trim()) {
      setManageError('O item não pode ficar sem descrição.')
      return
    }
    setManageBusy(true)
    setManageError('')
    const { error: updateError } = await updateChecklistItem(item.id, {
      label: item.label.trim(),
      required: item.required,
      sort_order: item.sort_order,
    })
    setManageBusy(false)
    if (updateError) {
      setManageError(updateError.message || 'Não foi possível salvar o item.')
      return
    }
    await loadManageItems(manageTemplateId)
  }

  async function removeManageItem(item: ChecklistItem) {
    setManageBusy(true)
    setManageError('')
    const { error: deleteError } = await deleteChecklistItem(item.id)
    setManageBusy(false)
    if (deleteError) {
      setManageError(
        'Não foi possível excluir. O item pode já estar em uso em execuções existentes.',
      )
      return
    }
    await loadManageItems(manageTemplateId)
  }

  return (
    <>
      <section>
        <p className="text-sm text-muted-foreground">Inspeções programadas</p>
        <h3 className="mt-1 text-2xl font-bold">Checklist</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Execute checklists de inspeção vinculados a equipamentos.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h4 className="font-bold">Iniciar checklist</h4>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onStartRun}>
          <div className="space-y-2">
            <label
              htmlFor="checklistTemplate"
              className="block text-sm font-medium text-muted-foreground"
            >
              Modelo de checklist
            </label>
            <select
              id="checklistTemplate"
              value={selectedTemplateId}
              onChange={(event) => onTemplateChange(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
              required
            >
              <option value="">Selecione o modelo...</option>
              {startTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="checklistEquipment"
              className="block text-sm font-medium text-muted-foreground"
            >
              Equipamento <span className="font-normal">(opcional)</span>
            </label>
            <select
              id="checklistEquipment"
              value={selectedEquipmentId}
              onChange={(event) => onEquipmentChange(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            >
              <option value="">Equipamento (opcional)</option>
              {equipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.asset_tag} — {item.description}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="checklistNotes"
              className="block text-sm font-medium text-muted-foreground"
            >
              Observações iniciais <span className="font-normal">(opcional)</span>
            </label>
            <input
              id="checklistNotes"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="Observações iniciais"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
            />
          </div>
          {startMessage && (
            <p className="md:col-span-2 text-sm text-red-600 dark:text-red-300">
              {startMessage}
            </p>
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

      {isGestor && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setManageOpen((open) => !open)}
            className="flex w-full items-center justify-between px-6 py-5 text-left"
          >
            <span className="flex items-center gap-2 font-bold">
              <Settings2 size={18} className="text-muted-foreground" />
              Gerenciar itens do modelo
            </span>
            <ChevronRight
              size={18}
              className={`text-muted-foreground transition-transform ${
                manageOpen ? 'rotate-90' : ''
              }`}
            />
          </button>

          {manageOpen && (
            <div className="border-t border-border px-6 py-5">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <form
                  onSubmit={addManageTemplate}
                  className="rounded-xl border border-dashed border-border p-4"
                >
                  <h5 className="font-semibold">Novo modelo de checklist</h5>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="newChecklistTemplateName"
                        className="block text-sm font-medium text-muted-foreground"
                      >
                        Nome do modelo
                      </label>
                      <input
                        id="newChecklistTemplateName"
                        value={newTemplateName}
                        onChange={(event) => setNewTemplateName(event.target.value)}
                        placeholder="Ex.: Checklist de manutenção preventiva"
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="newChecklistTemplateDescription"
                        className="block text-sm font-medium text-muted-foreground"
                      >
                        Descrição <span className="font-normal">(opcional)</span>
                      </label>
                      <textarea
                        id="newChecklistTemplateDescription"
                        value={newTemplateDescription}
                        onChange={(event) =>
                          setNewTemplateDescription(event.target.value)
                        }
                        placeholder="Explique quando esse checklist deve ser usado"
                        rows={3}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={manageBusy || !newTemplateName.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      <Plus size={16} />
                      Criar modelo
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  <label
                    htmlFor="manageTemplate"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    Modelo a editar
                  </label>
                  <select
                    id="manageTemplate"
                    value={manageTemplateId}
                    onChange={(event) => onManageTemplateChange(event.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                  >
                    <option value="">Selecione o modelo...</option>
                    {manageTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Depois de criar o modelo, selecione-o aqui para incluir os
                    itens do checklist.
                  </p>
                </div>
              </div>

              {manageError && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-300">
                  {manageError}
                </p>
              )}

              {manageTemplateId && (
                <>
                  {manageLoading ? (
                    <p className="mt-6 text-sm text-muted-foreground">
                      Carregando itens...
                    </p>
                  ) : (
                    <div className="mt-6 space-y-3">
                      {manageItems.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Nenhum item neste modelo ainda. Adicione o primeiro
                          abaixo.
                        </p>
                      )}
                      {manageItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center"
                        >
                          <input
                            value={item.label}
                            onChange={(event) =>
                              updateManageItemLocal(item.id, {
                                label: event.target.value,
                              })
                            }
                            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-foreground"
                          />
                          <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input
                              type="checkbox"
                              checked={item.required}
                              onChange={(event) =>
                                updateManageItemLocal(item.id, {
                                  required: event.target.checked,
                                })
                              }
                              className="h-4 w-4 accent-red-600"
                            />
                            Obrigatório
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={manageBusy}
                              onClick={() => void saveManageItem(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
                            >
                              <Save size={14} />
                              Salvar
                            </button>
                            <button
                              type="button"
                              disabled={manageBusy}
                              onClick={() => void removeManageItem(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                            >
                              <Trash2 size={14} />
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <form
                    onSubmit={addManageItem}
                    className="mt-4 flex flex-col gap-3 rounded-xl border border-dashed border-border p-3 sm:flex-row sm:items-center"
                  >
                    <input
                      value={newItemLabel}
                      onChange={(event) => setNewItemLabel(event.target.value)}
                      placeholder="Novo item de verificação..."
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                    />
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={newItemRequired}
                        onChange={(event) =>
                          setNewItemRequired(event.target.checked)
                        }
                        className="h-4 w-4 accent-red-600"
                      />
                      Obrigatório
                    </label>
                    <button
                      type="submit"
                      disabled={manageBusy || !newItemLabel.trim()}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </section>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h4 className="font-bold">Execuções recentes</h4>
          <button
            type="button"
            onClick={onReload}
            className="text-sm text-red-600 dark:text-red-400"
          >
            Atualizar
          </button>
        </div>
        {!loading && !error && detailError && !detailRun && (
          <p className="px-6 pt-4 text-sm text-red-600 dark:text-red-300">{detailError}</p>
        )}
        {loading && (
          <p className="p-8 text-sm text-muted-foreground">Carregando...</p>
        )}
        {!loading && error && (
          <p className="p-8 text-sm text-red-600 dark:text-red-300">{error}</p>
        )}
        {!loading && !error && runs.length === 0 && (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-8">
            <CheckSquare className="text-muted-foreground" size={32} />
            <p className="text-sm text-muted-foreground">
              Nenhum checklist executado ainda.
            </p>
          </div>
        )}
        {!loading && runs.length > 0 && (
          <div className="divide-y divide-border">
            {runs.map((run) => (
              <div
                key={run.id}
                className="flex items-center gap-3 px-6 py-4 transition hover:bg-accent"
              >
                <button
                  type="button"
                  onClick={() => void openRun(run)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{templateName(run.template_id)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(run.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        run.status === 'concluido'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {run.status === 'concluido' ? 'Concluído' : 'Em andamento'}
                    </span>
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </div>
                </button>
                {isGestor && (
                  <button
                    type="button"
                    disabled={runDeleteId === run.id}
                    onClick={(event) => {
                      event.stopPropagation()
                      setPendingRunDelete(run)
                    }}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={14} />
                    {runDeleteId === run.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {pendingRunDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-red-100 p-3 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h4 className="text-lg font-bold">Excluir execução</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Esta ação remove a execução e todos os itens preenchidos
                    dela.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-foreground">
                Deseja excluir a execução{' '}
                <span className="font-semibold">
                  "{templateName(pendingRunDelete.template_id)}"
                </span>
                ?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                disabled={runDeleteId === pendingRunDelete.id}
                onClick={() => setPendingRunDelete(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={runDeleteId === pendingRunDelete.id}
                onClick={() => void removeRun(pendingRunDelete)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Trash2 size={16} />
                {runDeleteId === pendingRunDelete.id ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailRun && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
              <div className="min-w-0">
                <h4 className="flex items-center gap-2 text-lg font-bold">
                  <ListChecks size={20} className="text-muted-foreground" />
                  {templateName(detailRun.template_id)}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Iniciado em {formatDateTime(detailRun.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRun}
                aria-label="Fechar"
                className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              {detailRun.notes && (
                <p className="mb-4 rounded-lg bg-background p-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Observações iniciais:
                  </span>{' '}
                  {detailRun.notes}
                </p>
              )}

              {isRunConcluded && (
                <p className="mb-4 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  Checklist concluído
                  {detailRun.completed_at
                    ? ` em ${formatDateTime(detailRun.completed_at)}`
                    : ''}
                  .
                </p>
              )}

              {!isRunConcluded && detailItems.length > 0 && (
                <p className="mb-4 text-xs text-muted-foreground">
                  {detailProgress} de {detailItems.length} itens marcados
                </p>
              )}

              {detailLoading && (
                <p className="text-sm text-muted-foreground">
                  Carregando itens...
                </p>
              )}
              {detailError && (
                <p className="mb-3 text-sm text-red-600 dark:text-red-300">
                  {detailError}
                </p>
              )}

              {!detailLoading && detailItems.length === 0 && !detailError && (
                <p className="text-sm text-muted-foreground">
                  Esta execução não possui itens.
                </p>
              )}

              <div className="space-y-3">
                {detailItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-background p-3"
                  >
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        disabled={isRunConcluded || detailSaving}
                        onChange={(event) =>
                          setItemChecked(item.id, event.target.checked)
                        }
                        className="mt-1 h-5 w-5 shrink-0 accent-red-600"
                      />
                      <span className="text-sm font-medium text-foreground">
                        {checklistItemMeta(item)?.label ?? 'Item'}
                        {checklistItemMeta(item)?.required && (
                          <span className="ml-1 text-red-600 dark:text-red-400">
                            *
                          </span>
                        )}
                      </span>
                    </label>
                    <textarea
                      value={item.observation ?? ''}
                      disabled={isRunConcluded || detailSaving}
                      onChange={(event) =>
                        setItemObservation(item.id, event.target.value)
                      }
                      placeholder="Observação (opcional)"
                      rows={2}
                      className="mt-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground disabled:opacity-70"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={closeRun}
                className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent sm:w-auto"
              >
                Fechar
              </button>
              {!isRunConcluded && (
                <>
                  <button
                    type="button"
                    disabled={detailSaving || detailLoading}
                    onClick={() => void saveDetail(false)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-60 sm:w-auto"
                  >
                    <Save size={16} />
                    {detailSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    type="button"
                    disabled={detailSaving || detailLoading}
                    onClick={() => void saveDetail(true)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
                  >
                    <CheckSquare size={16} />
                    Concluir checklist
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
