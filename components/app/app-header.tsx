import { LogOut } from 'lucide-react'
import { signOut } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Brand } from './brand'
import { MobileMenuButton } from './mobile-nav'

export function AppHeader({ name, email }: { name: string; email: string }) {
  const initial = name.trim().charAt(0) || '؟'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur lg:px-8">
      <MobileMenuButton />
      <Brand className="lg:hidden" />
      <div className="ms-auto flex items-center gap-3">
        <div className="hidden text-end sm:block">
          <p className="text-sm font-medium leading-tight">{name}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {email}
          </p>
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
