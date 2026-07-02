import { supabase } from '@/lib/supabase'
import type { Ticket, TicketEvent } from '@/types'

export async function fetchDashboardEvents(ticketIds: string[]) {
  if (ticketIds.length === 0) {
    return { data: [] as TicketEvent[], error: null }
  }

  const chunkSize = 80
  const chunks: string[][] = []

  for (let index = 0; index < ticketIds.length; index += chunkSize) {
    chunks.push(ticketIds.slice(index, index + chunkSize))
  }

  const results = await Promise.all(
    chunks.map((chunk) =>
      supabase
        .from('ticket_events')
        .select('id, ticket_id, event_type, message, created_by, created_at')
        .in('ticket_id', chunk)
        .order('created_at', { ascending: true }),
    ),
  )

  const error = results.find((result) => result.error)?.error ?? null

  if (error) {
    return { data: [] as TicketEvent[], error }
  }

  const data = results.flatMap((result) => (result.data ?? []) as TicketEvent[])

  return { data, error: null }
}

export async function fetchDashboardLookups(tickets: Ticket[]) {
  const siteIds = [...new Set(tickets.map((ticket) => ticket.site_id).filter(Boolean))] as string[]
  const equipmentIds = [
    ...new Set(tickets.map((ticket) => ticket.equipment_id).filter(Boolean)),
  ] as string[]

  const [sitesResult, equipmentResult] = await Promise.all([
    siteIds.length > 0
      ? supabase.from('sites').select('id, name').in('id', siteIds)
      : Promise.resolve({ data: [], error: null }),
    equipmentIds.length > 0
      ? supabase
          .from('equipment')
          .select('id, asset_tag, description')
          .in('id', equipmentIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const siteLabels = new Map<string, string>()
  const equipmentLabels = new Map<string, string>()

  for (const site of sitesResult.data ?? []) {
    siteLabels.set(site.id, site.name)
  }

  for (const equipment of equipmentResult.data ?? []) {
    equipmentLabels.set(
      equipment.id,
      `${equipment.asset_tag} — ${equipment.description}`,
    )
  }

  return {
    siteLabels,
    equipmentLabels,
    error: sitesResult.error ?? equipmentResult.error ?? null,
  }
}
