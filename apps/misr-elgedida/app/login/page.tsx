import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = { title: 'تسجيل الدخول' }

export default function LoginPage() {
  return (
    <AuthShell title="تسجيل الدخول" description="أدخل بيانات حسابك للوصول إلى نظام الإدارة">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
