export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatHourMeter(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value)} h`
}

export function parseHourMeterInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return null

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return Number.NaN
  }

  return Math.round(parsed * 10) / 10
}
