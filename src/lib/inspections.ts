import type {
  InspectionCause,
  InspectionResponsibility,
  TicketStatus,
} from '@/types'

export function inspectionCauseLabel(cause: InspectionCause) {
  const labels: Record<InspectionCause, string> = {
    desgaste_natural: 'Desgaste natural / vida útil',
    operacao_inadequada: 'Operação inadequada',
    mau_uso: 'Mau uso / negligência',
    defeito_fabricacao: 'Defeito de fabricação',
    outro: 'Outro',
  }
  return labels[cause]
}

export function inspectionResponsibilityLabel(
  responsibility: InspectionResponsibility,
) {
  return responsibility === 'adm' ? 'Responsabilidade ADM' : 'Responsabilidade do cliente'
}

export function recommendedStatusForResponsibility(
  responsibility: InspectionResponsibility,
): TicketStatus {
  return responsibility === 'adm' ? 'em_execucao' : 'aguardando_aprovacao'
}

export function eventTypeLabel(eventType: string) {
  const labels: Record<string, string> = {
    criado: 'Chamado criado',
    atualizacao: 'Atualização',
    anotacao: 'Anotação',
    anexo: 'Anexo',
    laudo_inspecao: 'Laudo de inspeção',
    aprovacao_cliente: 'Aprovação do cliente',
  }
  return labels[eventType] ?? eventType
}
