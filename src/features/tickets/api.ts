import { supabase } from '@/lib/supabase'
import { TICKET_SELECT_COLUMNS } from '@/features/tickets/constants'
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_BYTES,
  TICKET_ATTACHMENTS_BUCKET,
} from '@/config/storage'
import type { Attachment, Ticket, TicketEvent } from '@/types'

function sanitizeFileName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120)
}

export function validateAttachmentFile(file: File): string | null {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `Arquivo muito grande. Máximo de ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB.`
  }

  if (
    !ALLOWED_ATTACHMENT_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number],
    )
  ) {
    return 'Tipo não permitido. Use imagem (JPEG, PNG, WebP, GIF) ou PDF.'
  }

  return null
}

export async function uploadTicketAttachment(
  ticketId: string,
  file: File,
  userId: string,
) {
  const validationError = validateAttachmentFile(file)
  if (validationError) {
    return { data: null, error: { message: validationError } }
  }

  const storagePath = `${ticketId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`

  const { error: uploadError } = await supabase.storage
    .from(TICKET_ATTACHMENTS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    return { data: null, error: uploadError }
  }

  const { data, error: insertError } = await supabase
    .from('attachments')
    .insert({
      ticket_id: ticketId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || null,
      created_by: userId,
    })
    .select(
      'id, ticket_id, storage_path, file_name, mime_type, created_by, created_at',
    )
    .single()

  if (insertError) {
    await supabase.storage.from(TICKET_ATTACHMENTS_BUCKET).remove([storagePath])
    return { data: null, error: insertError }
  }

  return { data: data as Attachment, error: null }
}

export async function getAttachmentSignedUrl(storagePath: string) {
  return supabase.storage
    .from(TICKET_ATTACHMENTS_BUCKET)
    .createSignedUrl(storagePath, 3600)
}

export async function insertTicketEvent(
  ticketId: string,
  eventType: string,
  message: string,
  userId: string,
) {
  return supabase.from('ticket_events').insert({
    ticket_id: ticketId,
    event_type: eventType,
    message,
    created_by: userId,
  })
}

export async function fetchTicketEvents(ticketId: string) {
  return supabase
    .from('ticket_events')
    .select('id, ticket_id, event_type, message, created_by, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
}

export async function fetchTicketAttachments(ticketId: string) {
  return supabase
    .from('attachments')
    .select(
      'id, ticket_id, storage_path, file_name, mime_type, created_by, created_at',
    )
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
}

export function parseTicketEvents(data: unknown) {
  return (data ?? []) as TicketEvent[]
}

export function parseAttachments(data: unknown) {
  return (data ?? []) as Attachment[]
}

export type CreateClientTicketInput = {
  clientId: string
  siteId: string
  equipmentId: string
  incidentAt: string
  siteContactName: string
  siteContactPhone: string
  title: string
  description: string
  createdBy: string
  attachments?: File[]
}

export async function createClientTicket(input: CreateClientTicketInput) {
  const { data: created, error } = await supabase
    .from('tickets')
    .insert({
      client_id: input.clientId,
      site_id: input.siteId,
      equipment_id: input.equipmentId,
      title: input.title,
      description: input.description,
      incident_at: input.incidentAt,
      site_contact_name: input.siteContactName,
      site_contact_phone: input.siteContactPhone,
      status: 'aberto',
      priority: 'media',
      created_by: input.createdBy,
    })
    .select('id')
    .single()

  if (error || !created) {
    return { data: null, error, attachmentErrors: [] as string[] }
  }

  await insertTicketEvent(
    created.id,
    'criado',
    `Chamado aberto pelo cliente: ${input.title}`,
    input.createdBy,
  )

  const attachmentErrors: string[] = []

  for (const file of input.attachments ?? []) {
    const { error: uploadError } = await uploadTicketAttachment(
      created.id,
      file,
      input.createdBy,
    )

    if (uploadError) {
      attachmentErrors.push(
        `${file.name}: ${uploadError.message || 'falha no envio'}`,
      )
    }
  }

  return { data: created, error: null, attachmentErrors }
}

export type UpdateClientTicketInput = {
  ticketId: string
  siteId: string
  equipmentId: string
  incidentAt: string
  siteContactName: string
  siteContactPhone: string
  title: string
  description: string
}

export async function updateClientTicket(input: UpdateClientTicketInput) {
  const { data: ticketId, error } = await supabase.rpc('client_update_ticket', {
    p_ticket_id: input.ticketId,
    p_site_id: input.siteId,
    p_equipment_id: input.equipmentId,
    p_incident_at: input.incidentAt,
    p_site_contact_name: input.siteContactName,
    p_site_contact_phone: input.siteContactPhone,
    p_title: input.title,
    p_description: input.description,
  })

  if (error || !ticketId) {
    return { data: null, error }
  }

  const { data: ticket, error: fetchError } = await supabase
    .from('tickets')
    .select(TICKET_SELECT_COLUMNS)
    .eq('id', ticketId)
    .single()

  return {
    data: fetchError ? null : (ticket as Ticket),
    error: fetchError,
  }
}

export async function deleteClientTicket(ticketId: string) {
  return supabase.from('tickets').delete().eq('id', ticketId).select('id')
}
