import { supabase } from '@/lib/supabase'
import type {
  Equipment,
  EquipmentAllocation,
  EquipmentWithAllocation,
} from '@/types'

const EQUIPMENT_COLUMNS =
  'id, asset_tag, description, serial_number, hour_meter_current, hour_meter_updated_at, active, created_at'

const ALLOCATION_COLUMNS =
  'id, equipment_id, client_id, site_id, started_at, ended_at, created_at'

export function mergeEquipmentWithAllocations(
  equipment: Equipment[],
  allocations: EquipmentAllocation[],
): EquipmentWithAllocation[] {
  const activeByEquipment = new Map(
    allocations
      .filter((allocation) => !allocation.ended_at)
      .map((allocation) => [allocation.equipment_id, allocation]),
  )

  return equipment.map((item) => ({
    ...item,
    allocation: activeByEquipment.get(item.id) ?? null,
  }))
}

export function filterFleet(
  fleet: EquipmentWithAllocation[],
  clientId = '',
  siteId = '',
) {
  if (!clientId) {
    return fleet
  }

  return fleet.filter((item) => {
    if (!item.allocation || item.allocation.client_id !== clientId) {
      return false
    }

    if (siteId && item.allocation.site_id !== siteId) {
      return false
    }

    return true
  })
}

export async function fetchFleetData() {
  const [equipmentResult, allocationsResult] = await Promise.all([
    supabase
      .from('equipment')
      .select(EQUIPMENT_COLUMNS)
      .order('asset_tag', { ascending: true }),
    supabase
      .from('equipment_allocations')
      .select(ALLOCATION_COLUMNS)
      .is('ended_at', null),
  ])

  return {
    equipment: (equipmentResult.data ?? []) as Equipment[],
    allocations: (allocationsResult.data ?? []) as EquipmentAllocation[],
    error: equipmentResult.error ?? allocationsResult.error,
  }
}

export async function fetchAllocatedEquipmentForClient(clientId: string) {
  const { data, error } = await fetchClientAllocatedFleet(clientId)

  if (error) {
    return { data: [] as Equipment[], error }
  }

  return {
    data: data.map((item: EquipmentWithAllocation) => ({
      id: item.id,
      asset_tag: item.asset_tag,
      description: item.description,
      serial_number: item.serial_number,
      hour_meter_current: item.hour_meter_current,
      hour_meter_updated_at: item.hour_meter_updated_at,
      active: item.active,
      created_at: item.created_at,
    })),
    error: null,
  }
}

export async function fetchClientAllocatedFleet(clientId: string) {
  const { data, error } = await supabase.rpc('get_client_allocated_fleet', {
    p_client_id: clientId,
  })

  if (error) {
    return { data: [] as EquipmentWithAllocation[], error }
  }

  const fleet: EquipmentWithAllocation[] = (data ?? []).map((row: unknown) => {
    const record = row as {
      equipment_id: string
      asset_tag: string
      description: string
      serial_number: string | null
      active: boolean
      hour_meter_current: number | null
      hour_meter_updated_at: string | null
      equipment_created_at: string
      allocation_id: string
      allocation_client_id: string
      allocation_site_id: string | null
      started_at: string
      ended_at: string | null
      allocation_created_at: string
    }

    return {
      id: record.equipment_id,
      asset_tag: record.asset_tag,
      description: record.description,
      serial_number: record.serial_number,
      hour_meter_current: record.hour_meter_current ?? null,
      hour_meter_updated_at: record.hour_meter_updated_at ?? null,
      active: record.active,
      created_at: record.equipment_created_at,
      allocation: {
        id: record.allocation_id,
        equipment_id: record.equipment_id,
        client_id: record.allocation_client_id,
        site_id: record.allocation_site_id,
        started_at: record.started_at,
        ended_at: record.ended_at,
        created_at: record.allocation_created_at,
      },
    } satisfies EquipmentWithAllocation
  })

  return { data: fleet, error: null }
}

export function filterClientEquipmentBySite(
  fleet: EquipmentWithAllocation[],
  siteId: string,
) {
  if (!siteId) {
    return []
  }

  return fleet.filter((item) => {
    if (!item.allocation) {
      return false
    }

    if (item.allocation.site_id === null) {
      return true
    }

    return item.allocation.site_id === siteId
  })
}

export async function createFleetEquipment(input: {
  assetTag: string
  description: string
  serialNumber: string | null
  hourMeterCurrent: number | null
}) {
  const hourMeterUpdatedAt =
    input.hourMeterCurrent !== null ? new Date().toISOString() : null

  return supabase
    .from('equipment')
    .insert({
      asset_tag: input.assetTag,
      description: input.description,
      serial_number: input.serialNumber,
      hour_meter_current: input.hourMeterCurrent,
      hour_meter_updated_at: hourMeterUpdatedAt,
      active: true,
    })
    .select(EQUIPMENT_COLUMNS)
    .single()
}

export async function updateFleetEquipment(input: {
  equipmentId: string
  assetTag: string
  description: string
  serialNumber: string | null
  hourMeterCurrent: number | null
}) {
  const hourMeterUpdatedAt =
    input.hourMeterCurrent !== null ? new Date().toISOString() : null

  return supabase
    .from('equipment')
    .update({
      asset_tag: input.assetTag,
      description: input.description,
      serial_number: input.serialNumber,
      hour_meter_current: input.hourMeterCurrent,
      hour_meter_updated_at: hourMeterUpdatedAt,
    })
    .eq('id', input.equipmentId)
    .select(EQUIPMENT_COLUMNS)
    .single()
}

export async function deactivateFleetEquipment(equipmentId: string) {
  return supabase
    .from('equipment')
    .update({ active: false })
    .eq('id', equipmentId)
    .select(EQUIPMENT_COLUMNS)
    .single()
}

export async function createEquipmentAllocation(input: {
  equipmentId: string
  clientId: string
  siteId: string | null
}) {
  return supabase
    .from('equipment_allocations')
    .insert({
      equipment_id: input.equipmentId,
      client_id: input.clientId,
      site_id: input.siteId,
    })
    .select(ALLOCATION_COLUMNS)
    .single()
}

export async function endEquipmentAllocation(allocationId: string) {
  return supabase
    .from('equipment_allocations')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', allocationId)
}

export async function recordEquipmentHourMeter(input: {
  equipmentId: string
  readingValue: number
  source: 'manual' | 'abertura_chamado' | 'inspecao' | 'conclusao'
  ticketId?: string | null
  notes?: string | null
  readAt?: string | null
}) {
  return supabase.rpc('record_equipment_hour_meter', {
    p_equipment_id: input.equipmentId,
    p_reading_value: input.readingValue,
    p_source: input.source,
    p_ticket_id: input.ticketId ?? null,
    p_notes: input.notes ?? null,
    p_read_at: input.readAt ?? new Date().toISOString(),
  })
}
