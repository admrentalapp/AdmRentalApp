import { supabase } from '@/lib/supabase'
import type { Part } from '@/types'

export async function fetchParts() {
  return supabase
    .from('parts')
    .select(
      'id, sku, name, description, unit, current_stock, min_stock, active, created_at, updated_at',
    )
    .eq('active', true)
    .order('name', { ascending: true })
}

export function parseParts(data: unknown) {
  return (data ?? []) as Part[]
}

export async function createPart(input: {
  sku: string
  name: string
  description: string | null
  minStock: number
  currentStock: number
}) {
  return supabase
    .from('parts')
    .insert({
      sku: input.sku,
      name: input.name,
      description: input.description,
      min_stock: input.minStock,
      current_stock: input.currentStock,
    })
    .select(
      'id, sku, name, description, unit, current_stock, min_stock, active, created_at, updated_at',
    )
    .single()
}

export async function registerPartMovement(input: {
  partId: string
  movementType: 'entrada' | 'saida' | 'ajuste'
  quantity: number
  notes: string | null
}) {
  return supabase.rpc('register_part_movement', {
    p_part_id: input.partId,
    p_movement_type: input.movementType,
    p_quantity: input.quantity,
    p_notes: input.notes,
    p_ticket_id: null,
  })
}

export function isPartBelowMinimum(part: Part) {
  return part.current_stock < part.min_stock
}
