'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { Loader2, Pencil, Plus, Printer } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { saveRecord, type ActionState } from '@/lib/actions'
import type { Field, Option, RelationKey } from '@/lib/resources'
import { cn } from '@/lib/utils'
import { NativeSelect } from './native-select'
import Link from 'next/link'

type Props = {
  resourceKey: string
  singular: string
  fields: Field[]
  relationOptions: Partial<Record<RelationKey, Option[]>>
  record?: Record<string, unknown>
  inventoryType?: 'part' | 'filter' | 'oil'
}

const initialState: ActionState = { ok: false }

function initialValue(field: Field, record?: Record<string, unknown>) {
  const v = record?.[field.name]
  if (v !== undefined && v !== null) return v
  if (field.type === 'date' && !record) return new Date().toISOString().slice(0, 10)
  if (field.type === 'time' && !record) return new Date().toTimeString().slice(0, 5)
  return field.defaultValue ?? ''
}

export function ResourceFormDialog({ resourceKey, singular, fields, relationOptions, record, inventoryType }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedMake, setSelectedMake] = useState(String(record?.make ?? ''))
  const [selectedInventoryType, setSelectedInventoryType] = useState(String(inventoryType ?? record?.inventory_type ?? 'part'))
  const [invoiceValues, setInvoiceValues] = useState({
    work_order_id: String(record?.work_order_id ?? ''),
    customer_id: String(record?.customer_id ?? ''),
    branch_id: String(record?.branch_id ?? ''),
    subtotal: String(record?.subtotal ?? 0),
    discount: String(record?.discount ?? 0),
    tax: String(record?.tax ?? 0),
    paid_amount: String(record?.paid_amount ?? 0),
  })
  const catalog = relationOptions.vehicle_catalog ?? []
  const makes = useMemo(() => Array.from(new Set(catalog.map((o) => o.value.split('|||')[0]))).filter(Boolean), [catalog])
  const models = useMemo(() => catalog.filter((o) => o.value.startsWith(`${selectedMake}|||`)).map((o) => o.value.split('|||')[1]), [catalog, selectedMake])
  const id = (record?.id as string | undefined) ?? null
  const isEdit = Boolean(id)
  const [state, formAction, isPending] = useActionState(saveRecord.bind(null, resourceKey, id), initialState)

  useEffect(() => {
    if (state.ok && state.at) {
      setOpen(false)
      toast.success(isEdit ? 'تم حفظ التعديلات' : `تمت إضافة ${singular} بنجاح`)
      if (resourceKey === 'invoices' && !isEdit && state.recordId) window.open(`/invoices/${state.recordId}/print`, '_blank')
    }
  }, [state, isEdit, singular])

  const invoiceFieldValue = (field: Field) => resourceKey === 'invoices' && field.name in invoiceValues
    ? invoiceValues[field.name as keyof typeof invoiceValues]
    : initialValue(field, record)

  const invoiceTotal = Math.max(0, Number(invoiceValues.subtotal || 0) - Number(invoiceValues.discount || 0) + Number(invoiceValues.tax || 0))
  const invoiceRemaining = Math.max(0, invoiceTotal - Number(invoiceValues.paid_amount || 0))

  const handleInvoiceValue = (fieldName: 'discount' | 'tax' | 'paid_amount', value: string) => {
    setInvoiceValues((current) => ({ ...current, [fieldName]: value }))
  }

  const handleInvoiceWorkOrder = (value: string) => {
    const option = (relationOptions.work_orders ?? []).find((o) => o.value === value)
    const meta = option?.meta
    setInvoiceValues((current) => ({
      ...current,
      work_order_id: value,
      customer_id: String(meta?.customer_id ?? ''),
      branch_id: String(meta?.branch_id ?? ''),
      subtotal: String(meta?.subtotal ?? 0),
    }))
  }

  return (
    <>
      {isEdit ? (
        <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} aria-label={`تعديل ${singular}`}>
          <Pencil className="size-4" />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)} className="h-10 w-full sm:w-auto">
          <Plus className="size-4" aria-hidden="true" />
          {`إضافة ${singular}`}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="text-start">
            <DialogTitle>{isEdit ? `تعديل ${singular}` : `إضافة ${singular} جديد`}</DialogTitle>
            <DialogDescription>الحقول المميزة بعلامة * إلزامية</DialogDescription>
          </DialogHeader>
          {open && (
            <form action={formAction} className="flex flex-col gap-5">
              {resourceKey === 'parts' && inventoryType && <input type="hidden" name="inventory_type" value={inventoryType} />}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.filter((field) => !(resourceKey === 'parts' && inventoryType && field.name === 'inventory_type')).map((field) => (
                  <FieldInput
                    key={`${field.name}-${resourceKey === 'parts' && field.name === 'category' ? selectedInventoryType : ''}`}
                    field={field}
                    value={invoiceFieldValue(field)}
                    options={field.relation ? relationOptions[field.relation] ?? [] : field.options ?? []}
                    specialOptions={
                      resourceKey === 'cars' && field.name === 'make'
                        ? makes.map((make) => ({ value: make, label: make }))
                        : resourceKey === 'cars' && field.name === 'model'
                          ? models.map((model) => ({ value: model, label: model }))
                          : resourceKey === 'parts' && field.name === 'category'
                            ? ((inventoryType ?? selectedInventoryType) === 'part'
                                ? ['ميكانيكا', 'كهرباء', 'عفشة', 'كماليات', 'اصناف اخرى']
                                : (inventoryType ?? selectedInventoryType) === 'filter'
                                  ? ['فلاتر هواء', 'فلاتر زيت', 'اصناف اخرى']
                                  : ['زيت موتور', 'زيت فتيس', 'اصناف اخرى']
                              ).map((x) => ({ value: x, label: x }))
                            : undefined
                    }
                    readOnly={resourceKey === 'invoices' && ['customer_id', 'branch_id', 'subtotal'].includes(field.name)}
                    onSpecialChange={
                      resourceKey === 'cars' && field.name === 'make'
                        ? setSelectedMake
                        : resourceKey === 'parts' && field.name === 'inventory_type'
                          ? setSelectedInventoryType
                          : resourceKey === 'invoices' && field.name === 'work_order_id'
                            ? handleInvoiceWorkOrder
                            : resourceKey === 'invoices' && ['discount', 'tax', 'paid_amount'].includes(field.name)
                              ? (value) => handleInvoiceValue(field.name as 'discount' | 'tax' | 'paid_amount', value)
                              : undefined
                    }
                  />
                ))}
              </div>
              {resourceKey === 'invoices' && (
                <div className="rounded-lg border bg-muted/40 p-4 sm:col-span-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span>إجمالي الفاتورة</span>
                    <strong>{invoiceTotal.toFixed(2)} جنيه</strong>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                    <span>المبلغ المطلوب دفعه</span>
                    <strong className="text-lg">{invoiceRemaining.toFixed(2)} جنيه</strong>
                  </div>
                </div>
              )}
              {state.error && !state.ok && (
                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.error}
                </p>
              )}
              <DialogFooter className="gap-2 sm:justify-start">
                <Button type="submit" disabled={isPending} className="h-10">
                  {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {isEdit ? 'حفظ التعديلات' : 'حفظ'}
                </Button>
                <Button type="button" variant="outline" className="h-10" onClick={() => setOpen(false)}>
                  إلغاء
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function FieldInput({
  field,
  value,
  options,
  specialOptions,
  onSpecialChange,
  readOnly = false,
}: {
  field: Field
  value: unknown
  options: Option[]
  specialOptions?: Option[]
  onSpecialChange?: (value: string) => void
  readOnly?: boolean
}) {
  const inputId = `field-${field.name}`
  const wrapper = cn('flex flex-col gap-1.5', field.fullWidth && 'sm:col-span-2')
  const label = (
    <Label htmlFor={inputId}>
      {field.label}
      {field.required && <span className="text-destructive"> *</span>}
    </Label>
  )
  const hint = field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>

  if (field.type === 'boolean') {
    return (
      <div className={cn(wrapper, 'justify-end')}>
        <label htmlFor={inputId} className="flex h-10 items-center gap-2.5 rounded-md border px-3 text-sm">
          <input
            id={inputId}
            name={field.name}
            type="checkbox"
            defaultChecked={Boolean(value)}
            className="size-4 accent-primary"
          />
          {field.label}
        </label>
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div className={wrapper}>
        {label}
        <Textarea id={inputId} name={field.name} defaultValue={String(value)} rows={3} required={field.required} />
        {hint}
      </div>
    )
  }

  if (field.type === 'select' || field.type === 'relation') {
    return (
      <div className={wrapper}>
        {label}
        <NativeSelect id={inputId} name={field.name} defaultValue={String(value)} required={field.required} onChange={onSpecialChange ? (e) => onSpecialChange(e.target.value) : undefined}>
          <option value="">{field.required ? 'اختر...' : 'بدون'}</option>
          {(specialOptions ?? options).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        {readOnly && <input type="hidden" name={field.name} value={String(value)} />}
        </NativeSelect>
        {field.type === 'relation' && options.length === 0 && (
          <p className="text-xs text-muted-foreground">لا توجد سجلات متاحة بعد</p>
        )}
        {hint}
      </div>
    )
  }

  if (specialOptions) {
    return (
      <div className={wrapper}>
        {label}
        <NativeSelect
          id={inputId}
          name={field.name}
          value={String(value)}
          required={field.required}
          disabled={readOnly}
          onChange={onSpecialChange ? (e) => onSpecialChange(e.target.value) : undefined}
        >
          <option value="">اختر...</option>
          {specialOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelect>
        {hint}
      </div>
    )
  }

  const isLtr = field.type === 'tel' || field.type === 'email'

  return (
    <div className={wrapper}>
      {label}
      <Input
        id={inputId}
        name={field.name}
        type={field.type}
        {...(readOnly ? { value: String(value), readOnly: true } : { defaultValue: String(value) })}
        required={field.required}
        placeholder={field.placeholder}
        min={field.min}
        step={field.type === 'number' ? field.step ?? '1' : undefined}
        inputMode={field.type === 'number' ? (field.step ? 'decimal' : 'numeric') : undefined}
        dir={isLtr ? 'ltr' : undefined}
        className={cn('h-10', isLtr && 'text-end')}
      />
      {hint}
    </div>
  )
}
