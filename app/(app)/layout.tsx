import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app/app-sidebar'
import { AppHeader } from '@/components/app/app-header'
import { BottomNav } from '@/components/app/mobile-nav'
import { claimFirstManager } from '@/lib/actions'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  await claimFirstManager()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const role = profile?.role ?? 'reception'

  const name = (user.user_metadata?.full_name as string | undefined) || user.email?.split('@')[0] || 'موظف'

  return (
    <div className="flex min-h-dvh">
      <AppSidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader name={name} email={user.email ?? ''} role={role} />
        <main className="flex-1 px-4 pb-28 pt-5 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>
      </div>
      <BottomNav role={role} />
    </div>
  )
}
