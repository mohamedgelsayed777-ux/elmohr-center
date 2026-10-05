export const CURRENCY_LABEL = 'ر.س'

const numberFormatter = new Intl.NumberFormat('ar-u-nu-latn', {
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('ar-u-nu-latn', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('ar-u-nu-latn', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatNumber(value: unknown) {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? numberFormatter.format(n) : '—'
}

export function formatCurrency(value: unknown) {
  return `${formatNumber(value)} ${CURRENCY_LABEL}`
}

export function formatDate(value: unknown) {
  if (!value) return '—'
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? '—' : dateFormatter.format(d)
}

export function formatDateTime(value: unknown) {
  if (!value) return '—'
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFormatter.format(d)
}

export function getPath(row: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, row)
}
