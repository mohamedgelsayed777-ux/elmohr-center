'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Brand } from './brand'
import { NavLinks } from './nav-links'
import { BOTTOM_NAV, isActive } from './nav-items'

export function MobileMenuButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
      >
        <Menu className="size-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72 gap-6 overflow-y-auto border-sidebar-border bg-sidebar p-4">
          <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
          <Brand inverted className="px-2 pt-1" />
          <NavLinks onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="التنقل السريع"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {BOTTOM_NAV.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
