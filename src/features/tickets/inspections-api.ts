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
  'id, ticket_id, inspector_id, inspected_at, findings, probable_cause, cause_notes, responsibility, recommendation, hour_meter_reading, created_at, updated_at'

export type SaveInspectionInput = {
  ticketId: string
  inspectorId: string
  inspectedAt: string
  findings: string
  probableCause: InspectionCause
  causeNotes: string | null
  responsibility: InspectionResponsibility
  recommendation: string
  hourMeterReading: number | null
  equipmentId?: string | null
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

  const parts = [
    inspectionResponsibilityLabel(input.responsibility),
    `Causa provável: ${inspectionCauseLabel(input.probableCause)}`,
    `Status sugerido: ${statusLabel(recommendedStatus)}`,
  ]

  if (input.hourMeterReading !== null) {
    parts.push(`Horímetro: ${input.hourMeterReading} h`)
  }

  parts.push(input.findings)

  return parts.join(' · ')
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
    hour_meter_reading: input.hourMeterReading,
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

  if (
    input.hourMeterReading !== null &&
    input.equipmentId
  ) {
    const { error: hourMeterError } = await supabase.rpc(
      'record_equipment_hour_meter',
      {
        p_equipment_id: input.equipmentId,
        p_reading_value: input.hourMeterReading,
        p_source: 'inspecao',
        p_ticket_id: input.ticketId,
        p_notes: 'Leitura registrada no laudo de inspeção',
        p_read_at: input.inspectedAt,
      },
    )

    if (hourMeterError) {
      // Laudo já salvo; horímetro é complementar
      console.warn('Falha ao atualizar horímetro:', hourMeterError.message)
    }
  }

  await insertTicketEvent(
    input.ticketId,
    'laudo_inspecao',
    buildInspectionEventMessage(input),
    input.inspectorId,
  )

  return { data: data as TicketInspection, error: null }
}
