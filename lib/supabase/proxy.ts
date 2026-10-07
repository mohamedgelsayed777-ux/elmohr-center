import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/sign-up', '/auth', '/forgot-password', '/reset-password']

function isPath(path: string, base: string) {
  return path === base || path.startsWith(`${base}/`)
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { secure: process.env.NODE_ENV === 'production' },
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some((p) => isPath(path, p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (path === '/login' || path === '/sign-up')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (user && !isPublic) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    const role = profile?.role ?? 'reception'
    const managerOnly = ['/branches', '/employees', '/audit-logs']
    const financeOnly = ['/invoices', '/expenses', '/reports']
    const accountantAllowed = ['/', ...financeOnly, '/parts', '/services', '/attendance', '/employees']
    const receptionBlocked = ['/parts', '/services', ...financeOnly, ...managerOnly]

    const forbidden =
      role === 'manager'
        ? false
        : role === 'accountant'
          ? !accountantAllowed.some((p) => isPath(path, p))
          : receptionBlocked.some((p) => isPath(path, p))

    if (forbidden) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
