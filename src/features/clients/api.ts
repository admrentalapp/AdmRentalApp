import type { Client } from '@/types'

export const CLIENT_SELECT_COLUMNS =
  'id, name, legal_name, cnpj, internal_code, state_registration, segment, contact_name, contact_email, contact_phone, city, state_code, notes, active, created_at'

export const CLIENT_SEGMENTS = [
  'Construção civil',
  'Indústria',
  'Eventos',
  'Infraestrutura',
  'Comercial',
  'Outros',
] as const

export const BRAZILIAN_STATE_CODES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const

export type ClientFormValues = {
  name: string
  legalName: string
  cnpj: string
  internalCode: string
  stateRegistration: string
  segment: string
  contactName: string
  contactEmail: string
  contactPhone: string
  city: string
  stateCode: string
  notes: string
}

export function emptyClientForm(): ClientFormValues {
  return {
    name: '',
    legalName: '',
    cnpj: '',
    internalCode: '',
    stateRegistration: '',
    segment: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    city: '',
    stateCode: '',
    notes: '',
  }
}

export function clientToForm(client: Client): ClientFormValues {
  return {
    name: client.name,
    legalName: client.legal_name ?? '',
    cnpj: client.cnpj ? formatCnpj(client.cnpj) : '',
    internalCode: client.internal_code ?? '',
    stateRegistration: client.state_registration ?? '',
    segment: client.segment ?? '',
    contactName: client.contact_name ?? '',
    contactEmail: client.contact_email ?? '',
    contactPhone: client.contact_phone ?? '',
    city: client.city ?? '',
    stateCode: client.state_code ?? '',
    notes: client.notes ?? '',
  }
}

export function normalizeCnpj(value: string) {
  return value.replace(/\D/g, '').slice(0, 14)
}

export function formatCnpj(value: string) {
  const digits = normalizeCnpj(value)

  if (digits.length <= 2) return digits
  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`
  }
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export function isValidCnpj(value: string) {
  const cnpj = normalizeCnpj(value)

  if (cnpj.length !== 14) return false
  if (/^(\d)\1+$/.test(cnpj)) return false

  const calcDigit = (base: string, factors: number[]) => {
    const total = base
      .split('')
      .reduce((sum, digit, index) => sum + Number(digit) * factors[index], 0)
    const remainder = total % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const firstDigit = calcDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const secondDigit = calcDigit(
    cnpj.slice(0, 12) + String(firstDigit),
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  )

  return cnpj.endsWith(`${firstDigit}${secondDigit}`)
}

function trimOrNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function clientFormToPayload(form: ClientFormValues) {
  return {
    name: form.name.trim(),
    legal_name: trimOrNull(form.legalName),
    cnpj: trimOrNull(normalizeCnpj(form.cnpj)),
    internal_code: trimOrNull(form.internalCode),
    state_registration: trimOrNull(form.stateRegistration),
    segment: trimOrNull(form.segment),
    contact_name: trimOrNull(form.contactName),
    contact_email: trimOrNull(form.contactEmail),
    contact_phone: trimOrNull(form.contactPhone),
    city: trimOrNull(form.city),
    state_code: trimOrNull(form.stateCode),
    notes: trimOrNull(form.notes),
  }
}

export function validateClientForm(form: ClientFormValues): string | null {
  const name = form.name.trim()
  const legalName = form.legalName.trim()
  const cnpj = normalizeCnpj(form.cnpj)
  const contactEmail = form.contactEmail.trim()
  const contactPhone = form.contactPhone.trim()

  if (name.length < 2) {
    return 'Informe o nome fantasia com pelo menos 2 caracteres.'
  }

  if (legalName.length < 2) {
    return 'Informe a razão social com pelo menos 2 caracteres.'
  }

  if (cnpj.length > 0 && !isValidCnpj(cnpj)) {
    return 'Informe um CNPJ válido.'
  }

  if (contactEmail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return 'Informe um e-mail comercial válido.'
  }

  if (contactPhone.length > 0 && contactPhone.replace(/\D/g, '').length < 8) {
    return 'Informe um telefone comercial válido.'
  }

  if (form.stateCode && !BRAZILIAN_STATE_CODES.includes(form.stateCode as (typeof BRAZILIAN_STATE_CODES)[number])) {
    return 'Selecione uma UF válida.'
  }

  return null
}

export function clientDisplaySubtitle(client: Client) {
  const parts = [
    client.cnpj ? formatCnpj(client.cnpj) : null,
    client.city && client.state_code ? `${client.city}/${client.state_code}` : client.city,
    client.segment,
  ].filter(Boolean)

  return parts.join(' · ')
}

export const TEST_CLIENT_FORM: ClientFormValues = {
  name: 'Empresa de Teste',
  legalName: 'Empresa de Teste Locação Ltda.',
  cnpj: '11.444.777/0001-61',
  internalCode: 'CLI-TESTE',
  stateRegistration: '',
  segment: 'Construção civil',
  contactName: 'Responsável Teste',
  contactEmail: 'contato@empresadeteste.com.br',
  contactPhone: '(11) 99999-0000',
  city: 'São Paulo',
  stateCode: 'SP',
  notes: 'Cliente criado para testes do sistema.',
}
