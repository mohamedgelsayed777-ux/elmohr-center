'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getResource, type Field } from '@/lib/resources'

export type ActionState = { ok: boolean; error?: string; at?: number }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseField(field: Field, formData: FormData): { value: unknown; error?: string } {
  if (field.type === 'boolean') {
    return { value: formData.get(field.name) === 'on' }
  }

  const raw = String(formData.get(field.name) ?? '').trim()

  if (!raw) {
    if (field.required) return { value: null, error: `حقل "${field.label}" مطلوب` }
    if (field.type === 'number' && field.defaultValue !== undefined) {
      return { value: Number(field.defaultValue) }
    }
    return { value: null }
  }

  if (raw.length > 2000) return { value: null, error: `حقل "${field.label}" طويل جداً` }

  switch (field.type) {
    case 'number': {
      const n = Number(raw)
      if (!Number.isFinite(n)) return { value: null, error: `قيمة "${field.label}" غير صحيحة` }
      if (field.min !== undefined && n < field.min) {
        return { value: null, error: `قيمة "${field.label}" يجب ألا تقل عن ${field.min}` }
      }
      if (!field.step && !Number.isInteger(n)) {
        return { value: null, error: `قيمة "${field.label}" يجب أن تكون عدداً صحيحاً` }
      }
      return { value: n }
    }
    case 'email':
      return EMAIL_RE.test(raw)
        ? { value: raw.toLowerCase() }
        : { value: null, error: 'البريد الإلكتروني غير صحيح' }
    case 'date':
      return DATE_RE.test(raw) ? { value: raw } : { value: null, error: `تاريخ "${field.label}" غير صحيح` }
    case 'relation':
      return UUID_RE.test(raw) ? { value: raw } : { value: null, error: `اختيار "${field.label}" غير صحيح` }
    case 'select':
      return field.options?.some((o) => o.value === raw)
        ? { value: raw }
        : { value: null, error: `اختيار "${field.label}" غير صحيح` }
    default:
      return { value: raw }
  }
}

function friendlyDbError(code?: string) {
  if (code === '23503') return 'لا يمكن تنفيذ العملية لارتباط هذا السجل ببيانات أخرى'
  if (code === '23514') return 'بعض القيم المدخلة غير مسموح بها'
  if (code === '42501') return 'ليست لديك صلاحية لتنفيذ هذه العملية'
  return 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى'
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return supabase
}

export async function saveRecord(
  resourceKey: string,
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const resource = getResource(resourceKey)
  if (!resource) return { ok: false, error: 'نوع السجل غير معروف' }
  if (id && !UUID_RE.test(id)) return { ok: false, error: 'معرف السجل غير صحيح' }

  const supabase = await requireUser()
  const payload: Record<string, unknown> = {}

  for (const field of resource.fields) {
    if (field.readOnly) continue
    const { value, error } = parseField(field, formData)
    if (error) return { ok: false, error }
    payload[field.name] = value
  }

  if (resource.key === 'invoices') {
    const subtotal = Number(payload.subtotal ?? 0)
    const discount = Number(payload.discount ?? 0)
    const tax = Number(payload.tax ?? 0)
    const paid = Number(payload.paid_amount ?? 0)
    if (discount > subtotal) return { ok: false, error: 'الخصم لا يمكن أن يتجاوز المبلغ قبل الخصم' }
    const total = Math.round((subtotal - discount + tax) * 100) / 100
    if (paid > total) return { ok: false, error: 'المبلغ المدفوع أكبر من إجمالي الفاتورة' }
    payload.total = total
    payload.status =
      payload.status === 'cancelled' ? 'cancelled' : paid <= 0 ? 'unpaid' : paid >= total ? 'paid' : 'partial'
  }

  if (resource.key === 'work_orders') {
    const { data: car } = await supabase
      .from('cars')
      .select('customer_id')
      .eq('id', payload.car_id as string)
      .maybeSingle()
    if (!car || car.customer_id !== payload.customer_id) {
      return { ok: false, error: 'السيارة المختارة غير مسجلة باسم هذا العميل' }
    }
    const done = payload.status === 'completed' || payload.status === 'delivered'
    if (!done) payload.completed_at = null
    else if (!id) payload.completed_at = new Date().toISOString()
    else {
      const { data: existing } = await supabase
        .from('work_orders')
        .select('completed_at')
        .eq('id', id)
        .maybeSingle()
      payload.completed_at = existing?.completed_at ?? new Date().toISOString()
    }
  }

  const { error } = id
    ? await supabase.from(resource.table).update(payload).eq('id', id)
    : await supabase.from(resource.table).insert(payload)

  if (error) return { ok: false, error: friendlyDbError(error.code) }

  revalidatePath(resource.path)
  revalidatePath('/')
  return { ok: true, at: Date.now() }
}

export async function deleteRecord(resourceKey: string, id: string): Promise<ActionState> {
  const resource = getResource(resourceKey)
  if (!resource || !UUID_RE.test(id)) return { ok: false, error: 'طلب غير صالح' }

  const supabase = await requireUser()
  const { error } = await supabase.from(resource.table).delete().eq('id', id)
  if (error) return { ok: false, error: friendlyDbError(error.code) }

  revalidatePath(resource.path)
  revalidatePath('/')
  return { ok: true, at: Date.now() }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
