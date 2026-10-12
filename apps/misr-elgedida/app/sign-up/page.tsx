import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { SignUpForm } from '@/components/auth/sign-up-form'

export const metadata: Metadata = { title: 'إنشاء حساب موظف' }

export default function SignUpPage() {
  return (
    <AuthShell title="إنشاء حساب موظف" description="سجّل حساباً جديداً للوصول إلى نظام مركز المهر">
      <SignUpForm />
    </AuthShell>
  )
}
