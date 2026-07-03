import { supabase } from '@/lib/supabase'
import type { TicketApproval, TicketApprovalDecision } from '@/types'

const APPROVAL_COLUMNS =
  'id, ticket_id, decision, notes, responded_by, responded_at'

export async function fetchTicketApproval(ticketId: string) {
  return supabase
    .from('ticket_approvals')
    .select(APPROVAL_COLUMNS)
    .eq('ticket_id', ticketId)
    .maybeSingle()
}

export function parseTicketApproval(data: unknown) {
  return (data ?? null) as TicketApproval | null
}

export async function respondTicketApproval(
  ticketId: string,
  decision: TicketApprovalDecision,
  notes: string | null,
) {
  return supabase.rpc('client_respond_ticket_approval', {
    p_ticket_id: ticketId,
    p_decision: decision,
    p_notes: notes,
  })
}

export function approvalDecisionLabel(decision: TicketApprovalDecision) {
  return decision === 'aprovado' ? 'Aprovado' : 'Recusado'
}
