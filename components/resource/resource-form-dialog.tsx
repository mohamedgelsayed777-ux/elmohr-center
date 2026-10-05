'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { Loader2, Pencil, Plus } from 'lucide-react'
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

type Props = {
  resourceKey: string
  singular: string
  fields: Field[]
  relationOptions: Partial<Record<RelationKey, Option[]>>
  record?: Record<string, unknown>
}

const initialState: ActionState = { ok: false }

function initialValue(field: Field, record?: Record<string, unknown>) {
  const v = record?.[field.name]
  if (v !== undefined && v !== null) return v
  if (field.type === 'date' && !record) return new Date().toISOString().slice(0, 10)
  if (field.type === 'time' && !record) return new Date().toTimeString().slice(0, 5)
  return field.defaultValue ?? ''
}

export function ResourceFormDialog({ resourceKey, singular, fields, relationOptions, record }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedMake, setSelectedMake] = useState(String(record?.make ?? ''))
  const [selectedInventoryType, setSelectedInventoryType] = useState(String(record?.inventory_type ?? 'part'))
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
    }
  }, [state, isEdit, singular])

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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <FieldInput
                    key={`${field.name}-${resourceKey === 'parts' && field.name === 'category' ? selectedInventoryType : ''}`}
                    field={field}
                    value={initialValue(field, record)}
                    options={field.relation ? relationOptions[field.relation] ?? [] : field.options ?? []}
                    specialOptions={
                      resourceKey === 'cars' && field.name === 'make'
                        ? makes.map((make) => ({ value: make, label: make }))
                        : resourceKey === 'cars' && field.name === 'model'
                          ? models.map((model) => ({ value: model, label: model }))
                          : resourceKey === 'parts' && field.name === 'category'
                            ? (selectedInventoryType === 'part'
                                ? ['ميكانيكا', 'كهرباء', 'عفشة', 'كماليات', 'اصناف اخرى']
                                : selectedInventoryType === 'filter'
                                  ? ['فلاتر هواء', 'فلاتر زيت', 'اصناف اخرى']
                                  : ['زيت موتور', 'زيت فتيس', 'اصناف اخرى', 'فلاتر زيت']
                              ).map((x) => ({ value: x, label: x }))
                            : undefined
                    }
                    onSpecialChange={
                      resourceKey === 'cars' && field.name === 'make'
                        ? setSelectedMake
                        : resourceKey === 'parts' && field.name === 'inventory_type'
                          ? setSelectedInventoryType
                          : undefined
                    }
                  />
                ))}
              </div>
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
}: {
  field: Field
  value: unknown
  options: Option[]
  specialOptions?: Option[]
  onSpecialChange?: (value: string) => void
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
        <NativeSelect id={inputId} name={field.name} defaultValue={String(value)} required={field.required}>
          <option value="">{field.required ? 'اختر...' : 'بدون'}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
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
          defaultValue={String(value)}
          required={field.required}
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
        defaultValue={String(value)}
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
