import type { Column } from '@/lib/resources'
import { formatCurrency, formatDate, formatDateTime, formatNumber, getPath } from '@/lib/format'
import { StatusBadge } from './status-badge'

export function CellValue({ column, row }: { column: Column; row: Record<string, unknown> }) {
  const value = getPath(row, column.key)
  const displayValue = column.key === 'remaining_amount'
    ? Math.max(0, Number(row.total ?? 0) - Number(row.paid_amount ?? 0))
    : value

  if (column.format === 'badge' && column.labelMap) {
    return <StatusBadge map={column.labelMap} value={value} />
  }

  if (displayValue === null || displayValue === undefined || displayValue === '') {
    return <span className="text-muted-foreground">—</span>
  }

  switch (column.format) {
    case 'currency':
      return <span className="whitespace-nowrap tabular-nums">{formatCurrency(displayValue)}</span>
    case 'number':
      return <span className="tabular-nums">{formatNumber(displayValue)}</span>
    case 'date':
      return <span className="whitespace-nowrap">{formatDate(displayValue)}</span>
    case 'datetime':
      return <span className="whitespace-nowrap">{formatDateTime(displayValue)}</span>
    case 'code':
      return (
        <span className="whitespace-nowrap font-mono text-sm tabular-nums" dir="ltr">
          {column.prefix}
          {String(displayValue)}
        </span>
      )
    default:
      return <span>{String(displayValue)}</span>
  }
}
