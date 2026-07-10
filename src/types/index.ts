import type { LayoutDashboard } from 'lucide-react'

export type UserRole =
  | 'cliente'
  | 'gestor_adm'
  | 'manutencao_adm'
  | 'manutencao_externa'

export const MAINTENANCE_ROLES = [
  'manutencao_adm',
  'manutencao_externa',
] as const satisfies readonly UserRole[]

export function isMaintenanceRole(role: UserRole) {
  return MAINTENANCE_ROLES.includes(role as (typeof MAINTENANCE_ROLES)[number])
}

export type Profile = {
  id: string
  full_name: string
  role: UserRole
  client_id: string | null
}

export type AppPage =
  | 'dashboard'
  | 'chamados'
  | 'clientes'
  | 'tecnicos'
  | 'equipamentos'
  | 'estoque'
  | 'checklist'
  | 'relatorios'
  | 'help'

export type Client = {
  id: string
  name: string
  legal_name: string | null
  cnpj: string | null
  internal_code: string | null
  state_registration: string | null
  segment: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  city: string | null
  state_code: string | null
  notes: string | null
  active: boolean
  created_at: string
}

export type Site = {
  id: string
  client_id: string
  name: string
  address: string | null
  active: boolean
  created_at: string
}

export type ManagedProfile = {
  id: string
  full_name: string
  role: UserRole
  client_id: string | null
  created_at: string
}

export type Equipment = {
  id: string
  asset_tag: string
  description: string
  serial_number: string | null
  hour_meter_current: number | null
  hour_meter_updated_at: string | null
  active: boolean
  created_at: string
}

export type EquipmentAllocation = {
  id: string
  equipment_id: string
  client_id: string
  site_id: string | null
  started_at: string
  ended_at: string | null
  created_at: string
}

export type EquipmentWithAllocation = Equipment & {
  allocation: EquipmentAllocation | null
}

export type TicketStatus =
  | 'aberto'
  | 'triagem'
  | 'em_inspecao'
  | 'aguardando_aprovacao'
  | 'em_execucao'
  | 'aguardando_pecas'
  | 'concluido'
  | 'cancelado'

export type TicketPriority = 'baixa' | 'media' | 'alta' | 'critica'

export type Ticket = {
  id: string
  ticket_number: number
  client_id: string
  site_id: string | null
  equipment_id: string | null
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  created_by: string
  technician_id: string | null
  manager_id: string | null
  incident_at: string | null
  site_contact_name: string | null
  site_contact_phone: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
}

export type TicketEvent = {
  id: string
  ticket_id: string
  event_type: string
  message: string
  created_by: string
  created_at: string
}

export type InspectionCause =
  | 'desgaste_natural'
  | 'operacao_inadequada'
  | 'mau_uso'
  | 'defeito_fabricacao'
  | 'outro'

export type InspectionResponsibility = 'adm' | 'cliente'

export type TicketApprovalDecision = 'aprovado' | 'recusado'

export type TicketApproval = {
  id: string
  ticket_id: string
  decision: TicketApprovalDecision
  notes: string | null
  responded_by: string
  responded_at: string
}

export type TicketInspection = {
  id: string
  ticket_id: string
  inspector_id: string
  inspected_at: string
  findings: string
  probable_cause: InspectionCause
  cause_notes: string | null
  responsibility: InspectionResponsibility
  recommendation: string
  hour_meter_reading: number | null
  created_at: string
  updated_at: string
}

export type TicketServiceCompletion = {
  id: string
  ticket_id: string
  technician_signature_path: string
  client_signature_path: string
  technician_signed_by: string
  client_signer_name: string
  equipment_ready: boolean
  notes: string | null
  completed_at: string
  created_at: string
}

export const INSPECTION_CAUSES: InspectionCause[] = [
  'desgaste_natural',
  'operacao_inadequada',
  'mau_uso',
  'defeito_fabricacao',
  'outro',
]

export type Attachment = {
  id: string
  ticket_id: string
  storage_path: string
  file_name: string
  mime_type: string | null
  created_by: string
  created_at: string
}

export type Part = {
  id: string
  sku: string
  name: string
  description: string | null
  unit: string
  current_stock: number
  min_stock: number
  active: boolean
  created_at: string
  updated_at: string
}

export type PartMovement = {
  id: string
  part_id: string
  movement_type: 'entrada' | 'saida' | 'ajuste'
  quantity: number
  notes: string | null
  ticket_id: string | null
  created_by: string
  created_at: string
}

export type ChecklistTemplate = {
  id: string
  name: string
  description: string | null
  active: boolean
  created_at: string
}

export type ChecklistItem = {
  id: string
  template_id: string
  label: string
  sort_order: number
  required: boolean
}

export type ChecklistRun = {
  id: string
  template_id: string
  equipment_id: string | null
  ticket_id: string | null
  performed_by: string
  status: 'em_andamento' | 'concluido'
  notes: string | null
  created_at: string
  completed_at: string | null
}

export type ChecklistRunItem = {
  id: string
  run_id: string
  item_id: string
  checked: boolean
  observation: string | null
}

export type MenuItem = {
  label: string
  page: AppPage
  icon: typeof LayoutDashboard
}

export const TICKET_STATUSES: TicketStatus[] = [
  'aberto',
  'triagem',
  'em_inspecao',
  'aguardando_aprovacao',
  'em_execucao',
  'aguardando_pecas',
  'concluido',
  'cancelado',
]

export const TICKET_PRIORITIES: TicketPriority[] = [
  'baixa',
  'media',
  'alta',
  'critica',
]

export const TEST_CLIENT_NAME = 'Empresa de Teste'
