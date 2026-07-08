import { TICKET_ATTACHMENTS_BUCKET } from '@/config/storage'
import { supabase } from '@/lib/supabase'
import type { TicketServiceCompletion, TicketStatus } from '@/types'

export const COMPLETABLE_TICKET_STATUSES: TicketStatus[] = [
  'em_inspecao',
  'em_execucao',
  'aguardando_pecas',
]

export const SERVICE_COMPLETION_SELECT_COLUMNS =
  'id, ticket_id, technician_signature_path, client_signature_path, technician_signed_by, client_signer_name, equipment_ready, notes, completed_at, created_at'

function dataUrlToBlob(dataUrl: string) {
  const [header, base64] = dataUrl.split(',')
  const mimeMatch = header?.match(/data:(.*?);/)
  const mimeType = mimeMatch?.[1] ?? 'image/png'
  const binary = atob(base64 ?? '')
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type: mimeType })
}

export async function uploadSignatureImage(
  ticketId: string,
  role: 'technician' | 'client',
  dataUrl: string,
) {
  const path = `${ticketId}/signatures/${role}-${crypto.randomUUID()}.png`
  const blob = dataUrlToBlob(dataUrl)

  const { error } = await supabase.storage
    .from(TICKET_ATTACHMENTS_BUCKET)
    .upload(path, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/png',
    })

  if (error) {
    return { path: null, error }
  }

  return { path, error: null }
}

export async function fetchTicketServiceCompletion(ticketId: string) {
  return supabase
    .from('ticket_service_completions')
    .select(SERVICE_COMPLETION_SELECT_COLUMNS)
    .eq('ticket_id', ticketId)
    .maybeSingle()
}

export function parseTicketServiceCompletion(data: unknown) {
  return (data ?? null) as TicketServiceCompletion | null
}

export function canCompleteTicket(status: TicketStatus, hasCompletion: boolean) {
  return !hasCompletion && COMPLETABLE_TICKET_STATUSES.includes(status)
}

export type CompleteTicketServiceInput = {
  ticketId: string
  technicianSignatureDataUrl: string
  clientSignatureDataUrl: string
  clientSignerName: string
  equipmentReady: boolean
  notes?: string
}

export async function completeTicketService(input: CompleteTicketServiceInput) {
  const [technicianUpload, clientUpload] = await Promise.all([
    uploadSignatureImage(
      input.ticketId,
      'technician',
      input.technicianSignatureDataUrl,
    ),
    uploadSignatureImage(input.ticketId, 'client', input.clientSignatureDataUrl),
  ])

  if (technicianUpload.error || !technicianUpload.path) {
    return {
      data: null,
      error: technicianUpload.error ?? { message: 'Falha ao salvar assinatura do técnico.' },
    }
  }

  if (clientUpload.error || !clientUpload.path) {
    await supabase.storage
      .from(TICKET_ATTACHMENTS_BUCKET)
      .remove([technicianUpload.path])
    return {
      data: null,
      error: clientUpload.error ?? { message: 'Falha ao salvar assinatura do cliente.' },
    }
  }

  const { data, error } = await supabase.rpc('complete_ticket_service', {
    p_ticket_id: input.ticketId,
    p_technician_signature_path: technicianUpload.path,
    p_client_signature_path: clientUpload.path,
    p_client_signer_name: input.clientSignerName.trim(),
    p_equipment_ready: input.equipmentReady,
    p_notes: input.notes?.trim() || null,
  })

  if (error) {
    await supabase.storage
      .from(TICKET_ATTACHMENTS_BUCKET)
      .remove([technicianUpload.path, clientUpload.path])
    return { data: null, error }
  }

  return { data, error: null }
}
