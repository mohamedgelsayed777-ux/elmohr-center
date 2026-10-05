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
    case 'time':
      return /^\\d{2}:\\d{2}$/.test(raw) ? { value: raw } : { value: null, error: `وقت "${field.label}" غير صحيح` }
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

  if (resource.key === 'parts') {
    const [{ data: role }, { data: branch }] = await Promise.all([
      supabase.rpc('current_user_role'),
      supabase.rpc('current_user_branch_id'),
    ])
    if (role === 'reception') {
      return { ok: false, error: 'ليس لديك صلاحية لإضافة أصناف المخزن' }
    }
    if (role === 'accountant') {
      if (!branch) return { ok: false, error: 'لم يتم تحديد فرع المستخدم' }
      payload.branch_id = branch
    }
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
  if (resource.key === 'parts') {
    const { data: deleted, error } = await supabase
      .from('parts')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle()
    if (error) return { ok: false, error: error.message || friendlyDbError(error.code) }
    if (!deleted) return { ok: false, error: 'لم يتم حذف قطعة الغيار. تأكد من صلاحية المستخدم والفرع.' }
  } else {
    const { error } = await supabase.from(resource.table).delete().eq('id', id)
    if (error) return { ok: false, error: friendlyDbError(error.code) }
  }

  revalidatePath(resource.path)
  revalidatePath('/')
  return { ok: true, at: Date.now() }
}

export async function claimFirstManager() { const supabase=await requireUser(); await supabase.rpc('claim_first_manager'); }

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function saveWorkOrderIntake(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await requireUser()

  const branchId = String(formData.get('branch_id') ?? '').trim()
  const customerId = String(formData.get('customer_id') ?? '').trim()
  const carId = String(formData.get('car_id') ?? '').trim()
  const employeeId = String(formData.get('employee_id') ?? '').trim()
  const status = String(formData.get('status') ?? 'pending')
  const priority = String(formData.get('priority') ?? 'normal')
  const faults = String(formData.get('faults') ?? '').trim()
  const repairsDone = String(formData.get('repairs_done') ?? '').trim()
  const laborAmount = Number(formData.get('labor_amount') ?? 0)
  const amountPaid = Number(formData.get('amount_paid') ?? 0)
  const paymentMethod = String(formData.get('payment_method') ?? '').trim() || null
  const itemsRaw = String(formData.get('items_json') ?? '[]')

  if (!UUID_RE.test(branchId)) return { ok: false, error: 'الفرع غير صحيح' }
  if (!UUID_RE.test(customerId)) return { ok: false, error: 'العميل المختار غير صحيح' }
  if (!UUID_RE.test(carId)) return { ok: false, error: 'السيارة المختارة غير صحيحة' }
  if (!Number.isFinite(laborAmount) || laborAmount < 0 || !Number.isFinite(amountPaid) || amountPaid < 0) {
    return { ok: false, error: 'المبالغ المدخلة غير صحيحة' }
  }

  const [{ data: customer }, { data: car }] = await Promise.all([
    supabase.from('customers').select('id,branch_id').eq('id', customerId).maybeSingle(),
    supabase.from('cars').select('id,customer_id').eq('id', carId).maybeSingle(),
  ])

  if (!customer) return { ok: false, error: 'العميل غير موجود أو لا يمكنك الوصول إليه' }
  if (!car || car.customer_id !== customerId) return { ok: false, error: 'السيارة المختارة غير مسجلة باسم هذا العميل' }
  if (customer.branch_id && customer.branch_id !== branchId) return { ok: false, error: 'العميل تابع لفرع مختلف عن الفرع المختار' }

  let items: Array<{ part_id: string; quantity: number }> = []
  try {
    const parsed = JSON.parse(itemsRaw)
    if (!Array.isArray(parsed)) throw new Error()
    items = parsed
      .map((item) => ({ part_id: String(item.part_id ?? ''), quantity: Number(item.quantity) }))
      .filter((item) => UUID_RE.test(item.part_id) && Number.isFinite(item.quantity) && item.quantity > 0)
  } catch {
    return { ok: false, error: 'بيانات قطع الغيار غير صحيحة' }
  }

  if (items.length) {
    const { data: availableParts, error: partsError } = await supabase
      .from('parts')
      .select('id,name,quantity,branch_id')
      .in('id', items.map((item) => item.part_id))

    if (partsError) return { ok: false, error: 'تعذر التحقق من مخزون قطع الغيار' }

    for (const item of items) {
      const part = availableParts?.find((p) => p.id === item.part_id)
      if (!part) return { ok: false, error: 'إحدى قطع الغيار غير موجودة في المخزن' }
      if (part.branch_id && part.branch_id !== branchId) {
        return { ok: false, error: `قطعة الغيار "${part.name}" موجودة في فرع مختلف عن فرع أمر العمل` }
      }
      if (Number(part.quantity) < item.quantity) {
        return { ok: false, error: `الكمية المتاحة من "${part.name}" هي ${part.quantity} فقط` }
      }
    }
  }

  const { data, error } = await supabase.rpc('create_existing_car_work_order_intake', {
    p_branch_id: branchId,
    p_customer_id: customerId,
    p_car_id: carId,
    p_employee_id: UUID_RE.test(employeeId) ? employeeId : null,
    p_status: status,
    p_priority: priority,
    p_faults: faults || null,
    p_repairs_done: repairsDone || null,
    p_total_amount: 0,
    p_payment_method: paymentMethod,
    p_items: items,
  })

  if (error) {
    if (error.message.includes('CUSTOMER_NOT_FOUND')) return { ok: false, error: 'العميل غير موجود' }
    if (error.message.includes('CAR_NOT_BELONG_TO_CUSTOMER')) return { ok: false, error: 'السيارة المختارة غير مسجلة باسم هذا العميل' }
    if (error.message.includes('INSUFFICIENT_STOCK')) return { ok: false, error: 'الكمية المطلوبة غير متوفرة في المخزن' }
    if (error.message.includes('PART_BRANCH_MISMATCH')) return { ok: false, error: 'قطعة الغيار المختارة تابعة لفرع مختلف عن فرع أمر العمل' }
    if (error.message.includes('PART_NOT_FOUND')) return { ok: false, error: 'إحدى قطع الغيار غير موجودة في المخزن' }
    if (error.message.includes('INVALID_PAYMENT')) return { ok: false, error: 'طريقة الدفع غير صحيحة' }
    if (error.message.includes('INVALID_STATUS')) return { ok: false, error: 'حالة أمر العمل غير صحيحة' }
    if (error.message.includes('INVALID_PRIORITY')) return { ok: false, error: 'أولوية أمر العمل غير صحيحة' }
    return { ok: false, error: friendlyDbError(error.code) }
  }

  const { data: createdOrder } = await supabase
    .from('work_orders')
    .select('id,customer_id,branch_id')
    .eq('id', String(data))
    .maybeSingle()

  const { data: pricedParts } = items.length
    ? await supabase.from('parts').select('id,name,sale_price,inventory_type').in('id', items.map((i) => i.part_id))
    : { data: [] as any[] }

  const partsTotal = items.reduce(
    (sum, item) => sum + Number(pricedParts?.find((p) => p.id === item.part_id)?.sale_price ?? 0) * item.quantity,
    0,
  )
  const totalAmount = Math.round((partsTotal + laborAmount) * 100) / 100
  if (amountPaid > totalAmount) return { ok: false, error: 'المبلغ المدفوع أكبر من إجمالي الفاتورة' }

  if (createdOrder) {
    await supabase
      .from('work_orders')
      .update({ total_amount: totalAmount, labor_amount: laborAmount, amount_paid: amountPaid })
      .eq('id', createdOrder.id)

    const { data: invoice } = await supabase
      .from('invoices')
      .insert({
        work_order_id: createdOrder.id,
        customer_id: createdOrder.customer_id,
        branch_id: createdOrder.branch_id,
        subtotal: totalAmount,
        discount: 0,
        tax: 0,
        total: totalAmount,
        paid_amount: amountPaid,
        status: amountPaid <= 0 ? 'unpaid' : amountPaid >= totalAmount ? 'paid' : 'partial',
        payment_method:
          paymentMethod === 'visa'
            ? 'card'
            : paymentMethod === 'instapay'
              ? 'transfer'
              : paymentMethod === 'wallet'
                ? 'other'
                : paymentMethod,
      })
      .select('id')
      .single()

    if (invoice) {
      if (pricedParts?.length) {
        await supabase.from('invoice_items').insert(
          items.map((item) => {
            const p = pricedParts.find((x) => x.id === item.part_id)
            return {
              invoice_id: invoice.id,
              item_type: p?.inventory_type ?? 'part',
              part_id: item.part_id,
              description: p?.name ?? 'صنف',
              quantity: item.quantity,
              unit_price: Number(p?.sale_price ?? 0),
              total: Math.round(Number(p?.sale_price ?? 0) * item.quantity * 100) / 100,
            }
          }),
        )
      }
      if (laborAmount > 0) {
        await supabase.from('invoice_items').insert({
          invoice_id: invoice.id,
          item_type: 'labor',
          description: 'مصنعيات',
          quantity: 1,
          unit_price: laborAmount,
          total: laborAmount,
        })
      }
    }
  }

  revalidatePath('/work-orders')
  revalidatePath('/customers')
  revalidatePath('/cars')
  revalidatePath('/parts')
  revalidatePath('/')
  return { ok: true, at: Date.now() }
}
