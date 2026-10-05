import { cn } from '@/lib/utils'
export function Brand({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return <div className={cn('flex items-center gap-2.5',className)}>
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
      <img src="/elmohr-logo.jpg" alt="مركز المهر" width="40" height="40" className="block h-10 w-10 object-contain" />
    </div>
    <div className="flex flex-col leading-tight"><span className={cn('text-base font-bold',inverted?'text-sidebar-accent-foreground':'text-foreground')}>مركز المهر</span><span className={cn('text-xs',inverted?'text-sidebar-foreground/70':'text-muted-foreground')}>ELMOHR CENTER</span></div>
  </div>
}
