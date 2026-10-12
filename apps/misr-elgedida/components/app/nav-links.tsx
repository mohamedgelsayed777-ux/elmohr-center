'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_GROUPS, isActive } from './nav-items'

export function NavLinks({ onNavigate, role }: { onNavigate?: () => void; role?: string }) {
  const pathname = usePathname()
  const can = (href: string) => {
    const path = href.split('?')[0]
    if (role === 'manager') return true
    if (role !== 'manager') return !['/audit-logs', '/deleted-records'].includes(path)
    if (role === 'reception') return !['/branches', '/employees', '/invoices', '/expenses', '/reports', '/audit-logs', '/deleted-records'].includes(path)
    return !['/parts', '/services', '/branches', '/employees', '/attendance', '/invoices', '/expenses', '/reports', '/audit-logs', '/deleted-records'].includes(path)
  }

  return (
    <nav aria-label="القائمة الرئيسية" className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => can(item.href))
        if (!items.length) return null
        return (
          <div key={group.title} className="flex flex-col gap-1">
            <p className="px-3 text-xs font-medium text-sidebar-foreground/60">{group.title}</p>
            {items.map((item) => {
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
                  <Icon className="size-4.5 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}
