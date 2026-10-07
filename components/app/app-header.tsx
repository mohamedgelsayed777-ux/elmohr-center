import { LogOut, Search } from 'lucide-react'
import Link from 'next/link'
import { signOut } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Brand } from './brand'
import { MobileMenuButton } from './mobile-nav'

export function AppHeader({ name, email, role }: { name: string; email: string; role: string }) {
  const initial = name.trim().charAt(0) || '؟'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur lg:px-8">
      <MobileMenuButton role={role} />
      <Brand className="lg:hidden" />
      <div className="ms-auto flex items-center gap-3"><Link href="/search" aria-label="البحث الشامل" className="flex h-10 items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground hover:bg-muted"><Search className="size-4" /><span className="hidden sm:inline">بحث شامل...</span></Link>
        <Link href="/profile" className="hidden text-end sm:block hover:opacity-80">
          <p className="text-sm font-medium leading-tight">{name}</p>
          <p className="text-xs text-muted-foreground">{role === 'manager' ? 'مدير المركز' : role === 'accountant' ? 'محاسب' : 'مهندس استقبال'}</p><p className="text-xs text-muted-foreground" dir="ltr">{email}</p>
        </div>
        <div
          className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          aria-hidden="true"
        >
          {initial}
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="icon" aria-label="تسجيل الخروج">
            <LogOut className="size-4.5 rtl:-scale-x-100" />
          </Button>
        </form>
      </div>
    </header>
  )
}
