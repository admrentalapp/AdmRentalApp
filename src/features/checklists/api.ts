import { supabase } from '@/lib/supabase'
import type { ChecklistRun, ChecklistTemplate } from '@/types'

export async function fetchChecklistTemplates() {
  return supabase
    .from('checklist_templates')
    .select('id, name, description, active, created_at')
    .order('name', { ascending: true })
}

export async function fetchChecklistItems(templateId: string) {
  return supabase
    .from('checklist_items')
    .select('id, template_id, label, sort_order, required')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: true })
}

export async function fetchChecklistRuns(limit = 20) {
  let query = supabase
    .from('checklist_runs')
    .select(
      'id, template_id, equipment_id, ticket_id, performed_by, status, notes, created_at, completed_at',
    )
    .order('created_at', { ascending: false })

  if (limit > 0) {
    query = query.limit(limit)
  }

  return query
}

export async function startChecklistRun(input: {
  templateId: string
  equipmentId: string | null
  performedBy: string
  notes: string | null
}) {
  const itemsResult = await fetchChecklistItems(input.templateId)
  if (itemsResult.error || !itemsResult.data?.length) {
    return {
      data: null,
      error: itemsResult.error ?? { message: 'Modelo sem itens.' },
    }
  }

  const { data: run, error } = await supabase
    .from('checklist_runs')
    .insert({
      template_id: input.templateId,
      equipment_id: input.equipmentId,
      performed_by: input.performedBy,
      notes: input.notes,
      status: 'em_andamento',
    })
    .select(
      'id, template_id, equipment_id, ticket_id, performed_by, status, notes, created_at, completed_at',
    )
    .single()

  if (error || !run) {
    return { data: null, error }
  }

  const runItems = itemsResult.data.map((item) => ({
    run_id: run.id,
    item_id: item.id,
    checked: false,
  }))

  const { error: itemsError } = await supabase
    .from('checklist_run_items')
    .insert(runItems)

  if (itemsError) {
    return { data: null, error: itemsError }
  }

  return { data: run as ChecklistRun, error: null }
}

export async function fetchRunItems(runId: string) {
  return supabase
    .from('checklist_run_items')
    .select(
      'id, run_id, item_id, checked, observation, checklist_items(label, sort_order, required)',
    )
    .eq('run_id', runId)
}

export async function updateRunItem(
  itemId: string,
  checked: boolean,
  observation: string | null,
) {
  return supabase
    .from('checklist_run_items')
    .update({ checked, observation })
    .eq('id', itemId)
}

export async function completeChecklistRun(runId: string) {
  return supabase
    .from('checklist_runs')
    .update({
      status: 'concluido',
      completed_at: new Date().toISOString(),
    })
    .eq('id', runId)
}

export async function deleteChecklistRun(runId: string) {
  return supabase.from('checklist_runs').delete().eq('id', runId).select('id')
}

export async function createChecklistTemplate(input: {
  name: string
  description: string | null
}) {
  return supabase
    .from('checklist_templates')
    .insert({
      name: input.name,
      description: input.description,
      active: true,
    })
    .select('id, name, description, active, created_at')
    .single()
}

export async function createChecklistItem(input: {
  templateId: string
  label: string
  sortOrder: number
  required: boolean
}) {
  return supabase.from('checklist_items').insert({
    template_id: input.templateId,
    label: input.label,
    sort_order: input.sortOrder,
    required: input.required,
  })
}

export async function updateChecklistItem(
  itemId: string,
  fields: { label?: string; sort_order?: number; required?: boolean },
) {
  return supabase.from('checklist_items').update(fields).eq('id', itemId)
}

export async function deleteChecklistItem(itemId: string) {
  return supabase.from('checklist_items').delete().eq('id', itemId)
}

export function parseTemplates(data: unknown) {
  return (data ?? []) as ChecklistTemplate[]
}

export function parseRuns(data: unknown) {
  return (data ?? []) as ChecklistRun[]
}
