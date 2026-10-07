'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCircle, Save, Lock } from 'lucide-react'

const roleLabel=(role:string|null)=>role==='manager'?'مدير المركز':role==='accountant'?'محاسب':'مهندس استقبال'

export default function ProfilePage(){
 const [loading,setLoading]=useState(true)
 const [saving,setSaving]=useState(false)
 const [changing,setChanging]=useState(false)
 const [message,setMessage]=useState('')
 const [error,setError]=useState('')
 const [userId,setUserId]=useState('')
 const [email,setEmail]=useState('')
 const [role,setRole]=useState('')
 const [employeeCode,setEmployeeCode]=useState('')
 const [fullName,setFullName]=useState('')
 const [newPassword,setNewPassword]=useState('')
 const [confirmPassword,setConfirmPassword]=useState('')

 useEffect(()=>{(async()=>{
  const supabase=createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){setError('انتهت جلسة الدخول. يرجى تسجيل الدخول مرة أخرى.');setLoading(false);return}
  setUserId(user.id);setEmail(user.email??'')
  const {data,error}=await supabase.from('profiles').select('full_name,role,employee_code').eq('id',user.id).maybeSingle()
  if(error){setError(error.message);setLoading(false);return}
  setFullName(data?.full_name??(user.user_metadata?.full_name as string??''))
  setRole(data?.role??'reception');setEmployeeCode(data?.employee_code??'')
  setLoading(false)
 })()},[])

 const save=async()=>{
  setSaving(true);setMessage('');setError('')
  const supabase=createClient()
  const {error}=await supabase.from('profiles').update({full_name:fullName.trim()||null}).eq('id',userId)
  if(error){setError('تعذر حفظ الاسم: '+error.message);setSaving(false);return}
  const {error:authError}=await supabase.auth.updateUser({data:{full_name:fullName.trim()}})
  if(authError){setError('تم حفظ الاسم في الملف، لكن تعذر تحديث اسم الحساب: '+authError.message);setSaving(false);return}
  setMessage('تم حفظ بيانات البروفايل بنجاح')
  setSaving(false)
 }

 const changePassword=async()=>{
  setMessage('');setError('')
  if(newPassword.length<6){setError('كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف.');return}
  if(newPassword!==confirmPassword){setError('تأكيد كلمة المرور غير مطابق.');return}
  setChanging(true)
  const {error}=await createClient().auth.updateUser({password:newPassword})
  if(error)setError('تعذر تغيير كلمة المرور: '+error.message)
  else{setMessage('تم تغيير كلمة المرور بنجاح');setNewPassword('');setConfirmPassword('')}
  setChanging(false)
 }

 if(loading)return <div className="mx-auto max-w-3xl rounded-xl border bg-card p-10 text-center text-muted-foreground">جاري تحميل البروفايل...</div>

 return <div className="mx-auto flex max-w-3xl flex-col gap-5">
  <div><div className="flex items-center gap-2"><UserCircle className="size-7"/><h1 className="text-2xl font-bold">البروفايل الشخصي</h1></div><p className="mt-1 text-muted-foreground">بيانات حسابك وإعدادات الأمان</p></div>
  {error&&<div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
  {message&&<div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">{message}</div>}
  <div className="rounded-xl border bg-card p-5">
   <div className="mb-5 flex items-center gap-4"><div className="flex size-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">{(fullName.trim().charAt(0)||'?').toUpperCase()}</div><div><h2 className="text-lg font-bold">{fullName||'بدون اسم'}</h2><p className="text-sm text-muted-foreground">{roleLabel(role)}</p></div></div>
   <div className="grid gap-4 sm:grid-cols-2">
    <label className="grid gap-2 text-sm"><span className="font-medium">الاسم</span><input value={fullName} onChange={e=>setFullName(e.target.value)} className="h-10 rounded-lg border bg-background px-3 outline-none focus:ring-2 focus:ring-primary" /></label>
    <label className="grid gap-2 text-sm"><span className="font-medium">البريد الإلكتروني</span><input value={email} readOnly dir="ltr" className="h-10 rounded-lg border bg-muted px-3 text-left text-muted-foreground" /></label>
    <div className="grid gap-2 text-sm"><span className="font-medium">الوظيفة</span><div className="flex h-10 items-center rounded-lg border bg-muted px-3">{roleLabel(role)}</div></div>
    <div className="grid gap-2 text-sm"><span className="font-medium">كود الموظف</span><div className="flex h-10 items-center rounded-lg border bg-muted px-3">{employeeCode||'غير محدد'}</div></div>
   </div>
   <button onClick={save} disabled={saving} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"><Save className="size-4"/>{saving?'جاري الحفظ...':'حفظ البيانات'}</button>
  </div>
  <div className="rounded-xl border bg-card p-5">
   <div className="mb-4 flex items-center gap-2"><Lock className="size-5"/><h2 className="font-bold">تغيير كلمة المرور</h2></div>
   <div className="grid gap-4 sm:grid-cols-2">
    <label className="grid gap-2 text-sm"><span className="font-medium">كلمة المرور الجديدة</span><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="h-10 rounded-lg border bg-background px-3" /></label>
    <label className="grid gap-2 text-sm"><span className="font-medium">تأكيد كلمة المرور</span><input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="h-10 rounded-lg border bg-background px-3" /></label>
   </div>
   <button onClick={changePassword} disabled={changing} className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium disabled:opacity-60"><Lock className="size-4"/>{changing?'جاري التغيير...':'تغيير كلمة المرور'}</button>
  </div>
 </div>
