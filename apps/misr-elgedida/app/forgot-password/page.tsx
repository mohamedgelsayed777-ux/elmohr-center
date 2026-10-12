import { AuthShell } from '@/components/auth/auth-shell'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="استرجاع كلمة المرور"
      description="أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور."
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}