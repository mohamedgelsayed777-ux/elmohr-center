import { Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Brand({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Wrench className="size-5" aria-hidden="true" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={cn('text-base font-bold', inverted ? 'text-sidebar-accent-foreground' : 'text-foreground')}>
          مركز المهر
        </span>
        <span className={cn('text-xs', inverted ? 'text-sidebar-foreground/70' : 'text-muted-foreground')}>
          نظام إدارة الخدمة
        </span>
      </div>
    </div>
  )
}
