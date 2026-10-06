'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Option } from '@/lib/resources'
import { NativeSelect } from './native-select'

export type ToolbarFilter = { name: string; label: string; options: Option[] }

export function ResourceToolbar({
  searchPlaceholder,
  filters,
  dateFilter,
}: {
  searchPlaceholder?: string
  filters: ToolbarFilter[]
  dateFilter?: { enabled: boolean; year?: string; month?: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    params.delete('page')
    startTransition(() => {
      router.replace(`${pathname}${params.size ? `?${params}` : ''}`, { scroll: false })
    })
  }

  function onSearchChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParams({ q: value.trim() }), 350)
  }

  const hasActive = Boolean(searchParams.get('q')) || filters.some((f) => searchParams.get(f.name)) || Boolean(dateFilter?.year || dateFilter?.month)

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row md:items-center">
      {searchPlaceholder && (
        <div className="relative flex-1">
          <label htmlFor="resource-search" className="sr-only">
            بحث
          </label>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="resource-search"
            type="search"
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 ps-9"
          />
        </div>
      )}
      {dateFilter?.enabled && (
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-none">
          <div className="md:w-36">
            <label htmlFor="filter-year" className="sr-only">السنة</label>
            <NativeSelect id="filter-year" value={dateFilter.year ?? ''} onChange={(e) => updateParams({ year: e.target.value })}>
              <option value="">كل السنوات</option>
              {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={String(year)}>{year}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="md:w-36">
            <label htmlFor="filter-month" className="sr-only">الشهر</label>
            <NativeSelect id="filter-month" value={dateFilter.month ?? ''} onChange={(e) => updateParams({ month: e.target.value })}>
              <option value="">كل الشهور</option>
              {['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'].map((label, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{label}</option>
              ))}
            </NativeSelect>
          </div>
        </div>
      )}
      {filters.length > 0 && (
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-none">
          {filters.map((filter) => (
            <div key={filter.name} className="md:w-44">
              <label htmlFor={`filter-${filter.name}`} className="sr-only">
                {filter.label}
              </label>
              <NativeSelect
                id={`filter-${filter.name}`}
                value={searchParams.get(filter.name) ?? ''}
                onChange={(e) => updateParams({ [filter.name]: e.target.value })}
              >
                <option value="">{`كل ${filter.label}`}</option>
                {filter.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="جاري التحميل" />}
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('')
              startTransition(() => router.replace(pathname, { scroll: false }))
            }}
          >
            <X className="size-4" aria-hidden="true" />
            مسح الفلاتر
          </Button>
        )}
      </div>
    </div>
  )
}
