import { Brand } from './brand'
import { NavLinks } from './nav-links'

export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 overflow-y-auto border-l border-sidebar-border bg-sidebar p-4 lg:flex">
      <Brand inverted className="px-2 pt-1" />
      <NavLinks />
    </aside>
  )
}
