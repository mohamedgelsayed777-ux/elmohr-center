import type { Column } from '@/lib/resources'
import { formatCurrency, formatDate, formatDateTime, formatNumber, getPath } from '@/lib/format'
import { StatusBadge } from './status-badge'

export function CellValue({ column, row }: { column: Column; row: Record<string, unknown> }) {
  const value = getPath(row, column.key)

  if (column.format === 'badge' && column.labelMap) {
    return <StatusBadge map={column.labelMap} value={value} />
  }

  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">—</span>
  }

  switch (column.format) {
    case 'currency':
      return <span className="whitespace-nowrap tabular-nums">{formatCurrency(value)}</span>
    case 'number':
      return <span className="tabular-nums">{formatNumber(value)}</span>
    case 'date':
      return <span className="whitespace-nowrap">{formatDate(value)}</span>
    case 'datetime':
      return <span className="whitespace-nowrap">{formatDateTime(value)}</span>
    case 'code':
      return (
        <span className="whitespace-nowrap font-mono text-sm tabular-nums" dir="ltr">
          {column.prefix}
          {String(value)}
        </span>
      )
    default:
      return <span>{String(value)}</span>
  }
}
