'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getResource, type Field } from '@/lib/resources'

export type ActionState = { ok: boolean; error?: string; at?: number; recordId?: string }

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
      return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(raw) ? { value: raw } : { value: null, error: `وقت "${field.label}" غير صحيح` }
    case 'relation':
      return UUID_RE.test(raw) ? { value: raw } : { value: null, error: `اختيار "${field.label}" غير صحيح` }
    case 'select':
      const allowedCategory = field.name === 'category' && ['ميكانيكا','كهرباء','عفشة','كماليات','فلاتر هواء','فلاتر زيت','زيت موتور','زيت فتيس','اصناف اخرى'].includes(raw)
      const allowed = field.options?.some((o) => o.value === raw) || allowedCategory
      return allowed ? { value: raw } : { value: null, error: 'اختيار غير صحيح' }
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
  let returnValue: string | undefined
  const payload: Record<string, unknown> = {}
  let sourceInvoiceItems: Array<Record<string, unknown>> = []

  for (const field of resource.fields) {
    if (field.readOnly) continue
    const { value, error } = parseField(field, formData)
    if (error) return { ok: false, error }
    payload[field.name] = value
  }

  if (resource.key === 'expenses') {
    const paymentMethod = String(payload.payment_method ?? '').trim()
    payload.payment_method =
      paymentMethod === 'visa'
        ? 'card'
        : paymentMethod === 'instapay'
          ? 'transfer'
          : paymentMethod === 'wallet'
            ? 'other'
            : paymentMethod || null
  }

  if (resource.key === 'parts') {
    // inventory_type is hidden in the warehouse-specific form, so read it explicitly.
    const inventoryType = String(formData.get('inventory_type') ?? '').trim()
    if (!['part', 'filter', 'oil'].includes(inventoryType)) {
      return { ok: false, error: 'نوع المخزون غير صحيح' }
    }
    payload.inventory_type = inventoryType
    const [{ data: role }, { data: branch }] = await Promise.all([
      supabase.rpc('current_user_role'),
      supabase.rpc('current_user_branch_id'),
    ])
    if (role === 'reception' || role === 'accountant') {
      if (!branch) return { ok: false, error: 'لم يتم تحديد فرع المستخدم' }
      payload.branch_id = branch
    }
  }

  if (resource.key === 'invoices') {
    const workOrderId = typeof payload.work_order_id === 'string' ? payload.work_order_id : ''
    if (workOrderId) {
      const { data: workOrder, error: workOrderError } = await supabase
        .from('work_orders')
        .select('customer_id, branch_id, total_amount')
        .eq('id', workOrderId)
        .maybeSingle()

      if (workOrderError || !workOrder) {
        return { ok: false, error: 'أمر العمل غير موجود أو لا يمكنك الوصول إليه' }
      }

      payload.customer_id = workOrder.customer_id
      payload.branch_id = workOrder.branch_id
      payload.subtotal = Number(workOrder.total_amount ?? 0)

      if (!id) {
        const { data: sourceInvoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('work_order_id', workOrderId)
          .order('issued_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (sourceInvoice?.id) {
          const { data: sourceItems } = await supabase
            .from('invoice_items')
            .select('item_type, part_id, description, quantity, unit_price, total')
            .eq('invoice_id', sourceInvoice.id)
          sourceInvoiceItems = (sourceItems ?? []) as Array<Record<string, unknown>>
        }
      }
    }

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

  if (resource.key === 'parts') {
    const { error } = await supabase.rpc('save_inventory_part', { p_payload: payload, p_id: id })
    if (error) return { ok: false, error: friendlyDbError(error.code) }
  } else {
    if (id) {
      const { error } = await supabase.from(resource.table).update(payload).eq('id', id)
      if (error) return { ok: false, error: friendlyDbError(error.code) }
    } else {
      const { data: inserted, error } = await supabase.from(resource.table).insert(payload).select('id').single()
      if (error) return { ok: false, error: friendlyDbError(error.code) }
      returnValue = inserted.id

      if (resource.key === 'invoices' && sourceInvoiceItems.length && returnValue) {
        const items = sourceInvoiceItems.map((item) => ({
          invoice_id: returnValue,
          item_type: item.item_type,
          part_id: item.part_id ?? null,
          description: item.description,
          quantity: Number(item.quantity ?? 0),
          unit_price: Number(item.unit_price ?? 0),
          total: Number(item.total ?? 0),
        }))
        const { error: itemsError } = await supabase.from('invoice_items').insert(items)
        if (itemsError) return { ok: false, error: friendlyDbError(itemsError.code) }
      }
    }
  }

  revalidatePath(resource.path)
  revalidatePath('/')
  return { ok: true, at: Date.now(), recordId: id ?? returnValue }
}


export async function getWorkOrderEditData(workOrderId: string) {
  if (!UUID_RE.test(workOrderId)) return { ok: false as const, error: 'معرف أمر العمل غير صحيح' }
  const supabase = await requireUser()
  const [{ data: role }, { data: userBranch }, { data: order, error: orderError }] = await Promise.all([
    supabase.rpc('current_user_role'),
    supabase.rpc('current_user_branch_id'),
    supabase.from('work_orders').select('id,order_number,customer_id,car_id,branch_id,employee_id,status,priority,description,repairs_done,labor_amount,amount_paid,payment_method,total_amount').eq('id', workOrderId).maybeSingle(),
  ])
  if (orderError || !order) return { ok: false as const, error: 'أمر العمل غير موجود أو لا يمكنك الوصول إليه' }
  if (role !== 'manager' && (!userBranch || order.branch_id !== userBranch)) return { ok: false as const, error: 'ليس لديك صلاحية تعديل أمر العمل هذا' }
  const { data: rows, error } = await supabase.from('work_order_items').select('item_type,service_id,part_id,description,quantity,unit_price').eq('work_order_id', workOrderId)
  if (error) return { ok: false as const, error: 'تعذر تحميل أصناف أمر العمل' }
  const { data: invoice } = await supabase.from('invoices').select('id').eq('work_order_id', workOrderId).order('issued_at', { ascending: true }).limit(1).maybeSingle()
  const { data: invoiceRows } = invoice?.id
    ? await supabase.from('invoice_items').select('item_type,part_id,description,quantity,unit_price').eq('invoice_id', invoice.id)
    : { data: [] as Array<{item_type:string;part_id:string|null;description:string|null;quantity:number|null;unit_price:number|null}> }
  const { data: serviceCatalog } = await supabase.from('services').select('id,name').eq('is_active', true)
  const itemsFromOrder = (rows ?? []).filter((x) => x.part_id && ['part','filter','oil'].includes(x.item_type)).map((x) => ({ part_id: x.part_id as string, quantity: Number(x.quantity ?? 1) }))
  const itemsFromInvoice = (invoiceRows ?? []).filter((x) => x.part_id && ['part','filter','oil'].includes(x.item_type)).map((x) => ({ part_id: x.part_id as string, quantity: Number(x.quantity ?? 1) }))
  const serviceRows = (rows ?? []).filter((x) => x.item_type === 'service' && x.service_id)
  const serviceItems = serviceRows.length
    ? serviceRows.map((x) => ({ service_id: x.service_id as string, quantity: Number(x.quantity ?? 1) }))
    : (invoiceRows ?? []).filter((x) => x.item_type === 'service').map((x) => ({
        service_id: serviceCatalog?.find(s => s.name === x.description)?.id ?? '',
        quantity: Number(x.quantity ?? 1),
      })).filter(x => x.service_id)
  const manualRows = (rows ?? []).filter((x) => x.item_type === 'part' && !x.part_id && !x.service_id && x.description !== 'مصنعيات')
  const manualPurchasedItems = manualRows.length
    ? manualRows.map((x) => ({ description: String(x.description ?? ''), price: Number(x.unit_price ?? 0) }))
    : (invoiceRows ?? []).filter((x) => x.item_type === 'part' && !x.part_id && x.description !== 'مصنعيات').map((x) => ({ description: String(x.description ?? ''), price: Number(x.unit_price ?? 0) }))
  return { ok: true as const, order, items: itemsFromOrder.length ? itemsFromOrder : itemsFromInvoice, serviceItems, manualPurchasedItems }
}

export async function saveWorkOrderEdit(
  workOrderId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!UUID_RE.test(workOrderId)) return { ok: false, error: 'معرف أمر العمل غير صحيح' }
  const supabase = await requireUser()
  const branchId = String(formData.get('branch_id') ?? '').trim()
  const customerId = String(formData.get('customer_id') ?? '').trim()
  const carId = String(formData.get('car_id') ?? '').trim()
  const employeeRaw = String(formData.get('employee_id') ?? '').trim()
  const status = String(formData.get('status') ?? 'pending')
  const priority = String(formData.get('priority') ?? 'normal')
  const faults = String(formData.get('faults') ?? '').trim().slice(0, 2000)
  const repairsDone = String(formData.get('repairs_done') ?? '').trim().slice(0, 2000)
  const laborAmount = Number(formData.get('labor_amount') ?? 0)
  const amountPaid = Number(formData.get('amount_paid') ?? 0)
  const paymentMethodRaw = String(formData.get('payment_method') ?? '').trim()
  const paymentMethod = paymentMethodRaw || null
  let items: Array<{part_id:string;quantity:number}> = []
  let serviceItems: Array<{service_id:string;quantity:number}> = []
  let manualItems: Array<{description:string;price:number}> = []
  try {
    const parsed = JSON.parse(String(formData.get('items_json') ?? '[]'))
    if (!Array.isArray(parsed)) throw new Error()
    items = parsed.map((x) => ({part_id:String(x.part_id ?? ''),quantity:Number(x.quantity)}))
    if (items.some((x) => !UUID_RE.test(x.part_id) || !Number.isFinite(x.quantity) || x.quantity <= 0 || x.quantity > 10000)) throw new Error()
  } catch { return { ok:false, error:'بيانات قطع الغيار أو الكميات غير صحيحة' } }
  try {
    const parsed = JSON.parse(String(formData.get('services_json') ?? '[]'))
    if (!Array.isArray(parsed)) throw new Error()
    serviceItems = parsed.map((x) => ({service_id:String(x.service_id ?? ''),quantity:Number(x.quantity)}))
    if (serviceItems.some((x) => !UUID_RE.test(x.service_id) || !Number.isFinite(x.quantity) || x.quantity <= 0 || x.quantity > 10000)) throw new Error()
  } catch { return { ok:false, error:'بيانات الخدمات أو الكميات غير صحيحة' } }
  try {
    const parsed = JSON.parse(String(formData.get('manual_purchased_items_json') ?? '[]'))
    if (!Array.isArray(parsed)) throw new Error()
    manualItems = parsed.map((x) => ({description:String(x.description ?? '').trim(),price:Number(x.price)}))
    if (manualItems.some((x) => !x.description || x.description.length > 200 || !Number.isFinite(x.price) || x.price < 0)) throw new Error()
  } catch { return { ok:false, error:'راجع أسماء وأسعار قطع الغيار المشتراة يدويًا' } }
  if (![laborAmount,amountPaid].every((x) => Number.isFinite(x) && x >= 0)) return { ok:false, error:'المبالغ المدخلة غير صحيحة' }
  if (![branchId,customerId,carId].every((x) => UUID_RE.test(x))) return { ok:false, error:'اختر الفرع والعميل والسيارة بشكل صحيح' }
  const { data, error } = await supabase.rpc('update_work_order_intake', {
    p_work_order_id: workOrderId,
    p_branch_id: branchId,
    p_customer_id: customerId,
    p_car_id: carId,
    p_employee_id: UUID_RE.test(employeeRaw) ? employeeRaw : null,
    p_status: status,
    p_priority: priority,
    p_faults: faults || null,
    p_repairs_done: repairsDone || null,
    p_labor_amount: laborAmount,
    p_amount_paid: amountPaid,
    p_payment_method: paymentMethod,
    p_items: items,
    p_services: serviceItems,
    p_manual_items: manualItems,
  })
  if (error) {
    const message = error.message ?? ''
    if (message.includes('INSUFFICIENT_STOCK')) return { ok:false, error:'الكمية المطلوبة غير متوفرة في المخزن' }
    if (message.includes('PART_BRANCH_MISMATCH')) return { ok:false, error:'إحدى قطع الغيار تابعة لفرع مختلف' }
    if (message.includes('CUSTOMER_BRANCH_MISMATCH')) return { ok:false, error:'العميل مرتبط بفرع مختلف عن الفرع المختار' }
    if (message.includes('INVALID_MANUAL_ITEM')) return { ok:false, error:'راجع اسم وسعر قطعة الغيار المشتراة يدويًا' }
    if (message.includes('INVALID_PART_ITEM')) return { ok:false, error:'راجع قطع الغيار والكميات المختارة' }
    if (message.includes('INVALID_SERVICE_ITEM')) return { ok:false, error:'راجع الخدمات والكميات المختارة' }
    if (message.includes('NOT_AUTHENTICATED')) return { ok:false, error:'انتهت الجلسة، سجّل الدخول مرة أخرى' }
    if (message.includes('WORK_ORDER_NOT_FOUND')) return { ok:false, error:'أمر العمل غير موجود أو تم حذفه' }
    if (message.includes('INVALID_AMOUNT')) return { ok:false, error:'المبالغ يجب أن تكون أرقامًا موجبة أو صفرًا' }
    if (message.includes('CAR_NOT_BELONG_TO_CUSTOMER')) return { ok:false, error:'السيارة المختارة غير مسجلة باسم العميل' }
    if (message.includes('PAID_EXCEEDS_TOTAL')) return { ok:false, error:'المبلغ المدفوع أكبر من إجمالي أمر العمل' }
    if (message.includes('BRANCH_FORBIDDEN')) return { ok:false, error:'ليس لديك صلاحية تعديل أمر العمل في هذا الفرع' }
    if (message.includes('SERVICE_NOT_FOUND')) return { ok:false, error:'إحدى الخدمات لم تعد متاحة' }
    if (message.includes('INVALID_STATUS')) return { ok:false, error:'حالة أمر العمل غير صحيحة' }
    if (message.includes('INVALID_PRIORITY')) return { ok:false, error:'الأولوية غير صحيحة' }
    if (message.includes('INVALID_PAYMENT')) return { ok:false, error:'طريقة الدفع غير صحيحة' }
    return { ok:false, error: friendlyDbError(error.code) }
  }
  revalidatePath('/work-orders')
  revalidatePath('/invoices')
  revalidatePath('/parts')
  revalidatePath('/')
  return { ok:true, at:Date.now(), recordId:workOrderId }
}

export async function deleteRecord(resourceKey: string, id: string): Promise<ActionState> {
  const resource = getResource(resourceKey)
  if (!resource || !UUID_RE.test(id)) return { ok: false, error: 'طلب غير صالح' }

  const supabase = await requireUser()
  const { data: roleData } = await supabase.rpc('current_user_role')
  if (roleData === 'reception' && resource.key === 'work_orders') return { ok: false, error: 'ليس لديك صلاحية حذف أوامر العمل' }
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
  const servicesRaw = String(formData.get('services_json') ?? '[]')
  const manualPurchasedRaw = String(formData.get('manual_purchased_items_json') ?? '[]')

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
  let serviceItems: Array<{ service_id: string; quantity: number }> = []
  let manualPurchasedItems: Array<{ description: string; price: number }> = []
  try {
    const parsed = JSON.parse(itemsRaw)
    if (!Array.isArray(parsed)) throw new Error()
    items = parsed
      .map((item) => ({ part_id: String(item.part_id ?? ''), quantity: Number(item.quantity) }))
      .filter((item) => UUID_RE.test(item.part_id) && Number.isFinite(item.quantity) && item.quantity > 0)
  } catch {
    return { ok: false, error: 'بيانات قطع الغيار غير صحيحة' }
  }

  try {
    const parsed = JSON.parse(servicesRaw)
    if (!Array.isArray(parsed)) throw new Error()
    serviceItems = parsed.map((item) => ({ service_id: String(item.service_id ?? ''), quantity: Number(item.quantity) })).filter((item) => UUID_RE.test(item.service_id) && Number.isFinite(item.quantity) && item.quantity > 0)
  } catch { return { ok: false, error: 'بيانات الخدمات غير صحيحة' } }

  try {
    const parsed = JSON.parse(manualPurchasedRaw)
    if (!Array.isArray(parsed)) throw new Error()
    manualPurchasedItems = parsed.map((item) => ({ description: String(item.description ?? '').trim(), price: Number(item.price) })).filter((item) => item.description.length > 0 || item.price > 0)
    if (manualPurchasedItems.some((item) => !item.description || item.description.length > 200 || !Number.isFinite(item.price) || item.price < 0)) return { ok: false, error: 'راجع اسم وسعر قطع الغيار المشتراة يدويًا' }
  } catch { return { ok: false, error: 'بيانات قطع الغيار المشتراة يدويًا غير صحيحة' } }

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

  const { data: pricedServices } = serviceItems.length ? await supabase.from('services').select('id,name,price').eq('is_active', true).in('id', serviceItems.map((i) => i.service_id)) : { data: [] as any[] }
  if (serviceItems.length !== (pricedServices?.length ?? 0)) return { ok: false, error: 'إحدى الخدمات المختارة غير موجودة أو غير متاحة' }

  const partsTotal = items.reduce(
    (sum, item) => sum + Number(pricedParts?.find((p) => p.id === item.part_id)?.sale_price ?? 0) * item.quantity,
    0,
  )
  const servicesTotal = serviceItems.reduce((sum, item) => sum + Number(pricedServices?.find((s) => s.id === item.service_id)?.price ?? 0) * item.quantity, 0)
  const manualPurchasedTotal = manualPurchasedItems.reduce((sum, item) => sum + item.price, 0)
  const totalAmount = Math.round((partsTotal + servicesTotal + manualPurchasedTotal + laborAmount) * 100) / 100
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
      if (pricedServices?.length) {
        const { error: serviceItemsError } = await supabase.from('invoice_items').insert(serviceItems.map((item) => { const s = pricedServices.find((x) => x.id === item.service_id); return { invoice_id: invoice.id, item_type: 'service', part_id: null, description: s?.name ?? 'خدمة', quantity: item.quantity, unit_price: Number(s?.price ?? 0), total: Math.round(Number(s?.price ?? 0) * item.quantity * 100) / 100 } }))
        if (serviceItemsError) return { ok: false, error: friendlyDbError(serviceItemsError.code) }
      }
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
      if (manualPurchasedItems.length) {
        const { error: manualItemsError } = await supabase.from('invoice_items').insert(manualPurchasedItems.map((item) => ({
          invoice_id: invoice.id,
          item_type: 'part',
          part_id: null,
          description: item.description,
          quantity: 1,
          unit_price: item.price,
          total: Math.round(item.price * 100) / 100,
        })))
        if (manualItemsError) return { ok: false, error: friendlyDbError(manualItemsError.code) }
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
