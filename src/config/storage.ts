export const TICKET_ATTACHMENTS_BUCKET = 'ticket-attachments'

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const

export const ATTACHMENT_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,application/pdf'
