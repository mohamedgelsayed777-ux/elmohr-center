'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_GROUPS, isActive } from './nav-items'

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav aria-label="القائمة الرئيسية" className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          <p className="px-3 text-xs font-medium text-sidebar-foreground/60">{group.title}</p>
          {group.items.map((item) => {
            const active = isActive(pathname, item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
