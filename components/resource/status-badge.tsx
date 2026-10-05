import { cn } from '@/lib/utils'
import { LABEL_MAPS, type LabelMapKey, type Tone } from '@/lib/labels'

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-primary/10 text-primary',
  primary: 'bg-primary text-primary-foreground',
  warning: 'bg-warning/20 text-foreground',
  success: 'bg-success/15 text-success',
  danger: 'bg-destructive/10 text-destructive',
}

export function StatusBadge({ map, value }: { map: LabelMapKey; value: unknown }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">—</span>
  }
  const entry = LABEL_MAPS[map][String(value)]
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASSES[entry?.tone ?? 'neutral'],
      )}
    >
      {entry?.label ?? String(value)}
    </span>
  )
}
