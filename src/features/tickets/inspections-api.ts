import { supabase } from '@/lib/supabase'
import {
  inspectionCauseLabel,
  inspectionResponsibilityLabel,
  recommendedStatusForResponsibility,
} from '@/lib/inspections'
import { statusLabel } from '@/lib/tickets'
import { insertTicketEvent } from '@/features/tickets/api'
import type {
  InspectionCause,
  InspectionResponsibility,
  TicketInspection,
} from '@/types'

const INSPECTION_COLUMNS =
  'id, ticket_id, inspector_id, inspected_at, findings, probable_cause, cause_notes, responsibility, recommendation, created_at, updated_at'

export type SaveInspectionInput = {
  ticketId: string
  inspectorId: string
  inspectedAt: string
  findings: string
  probableCause: InspectionCause
  causeNotes: string | null
  responsibility: InspectionResponsibility
  recommendation: string
}

export async function fetchTicketInspection(ticketId: string) {
  return supabase
    .from('ticket_inspections')
    .select(INSPECTION_COLUMNS)
    .eq('ticket_id', ticketId)
    .maybeSingle()
}

export function parseTicketInspection(data: unknown) {
  return (data ?? null) as TicketInspection | null
}

function buildInspectionEventMessage(input: SaveInspectionInput) {
  const recommendedStatus = recommendedStatusForResponsibility(
    input.responsibility,
  )

  return [
    inspectionResponsibilityLabel(input.responsibility),
    `Causa provável: ${inspectionCauseLabel(input.probableCause)}`,
    `Status sugerido: ${statusLabel(recommendedStatus)}`,
    input.findings,
  ].join(' · ')
}

export async function saveTicketInspection(input: SaveInspectionInput) {
  const payload = {
    ticket_id: input.ticketId,
    inspector_id: input.inspectorId,
    inspected_at: input.inspectedAt,
    findings: input.findings,
    probable_cause: input.probableCause,
    cause_notes: input.causeNotes,
    responsibility: input.responsibility,
    recommendation: input.recommendation,
    updated_at: new Date().toISOString(),
  }

  const { data: existing } = await supabase
    .from('ticket_inspections')
    .select('id')
    .eq('ticket_id', input.ticketId)
    .maybeSingle()

  const query = existing?.id
    ? supabase
        .from('ticket_inspections')
        .update(payload)
        .eq('id', existing.id)
        .select(INSPECTION_COLUMNS)
        .single()
    : supabase
        .from('ticket_inspections')
        .insert(payload)
        .select(INSPECTION_COLUMNS)
        .single()

  const { data, error } = await query

  if (error || !data) {
    return { data: null, error }
  }

  await insertTicketEvent(
    input.ticketId,
    'laudo_inspecao',
    buildInspectionEventMessage(input),
    input.inspectorId,
  )

  return { data: data as TicketInspection, error: null }
}
