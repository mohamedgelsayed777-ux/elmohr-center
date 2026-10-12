'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ResourceToolbar } from '@/components/resource/resource-toolbar'

type AuditRow={id:string;log_number:number;user_id:string|null;action:'INSERT'|'UPDATE'|'DELETE';table_name:string;record_id:string|null;occurred_at:string;full_name:string;role:string|null;employee_code:string|null}

const TABLE_LABELS:Record<string,string>={customers:'العملاء',cars:'السيارات',work_orders:'أوامر العمل',invoices:'الفواتير',invoice_items:'بنود الفواتير',parts:'المخزون',services:'الخدمات',expenses:'المصروفات',attendance:'الحضور',employees:'الموظفون',branches:'الفروع'}
const ACTION_LABELS={INSERT:'إضافة',UPDATE:'تعديل',DELETE:'حذف'} as const
const roleLabel=(role?:string|null)=>role==='manager'?'المدير':role==='accountant'?'المحاسب':'الاستقبال'
const splitRecord=(value:string|null)=>{const v=value??'';const [record,...rest]=v.split(' — ');return {record:record||'—',details:rest.join(' — ')||'—'}}

export default function AuditLogsPage(){
 const searchParams=useSearchParams()
 const [logs,setLogs]=useState<AuditRow[]>([])
 const [archiveLogs,setArchiveLogs]=useState<any[]>([])
 const [recordLabels,setRecordLabels]=useState<Record<string,string>>({})
 const [loading,setLoading]=useState(true)
 const [archiveLoading,setArchiveLoading]=useState(false)
 const [error,setError]=useState('')
 const year=searchParams.get('year')??'';const month=searchParams.get('month')??'';const day=searchParams.get('day')??''
 const tab=searchParams.get('tab')??'active'

 useEffect(()=>{(async()=>{
  setLoading(true);setError('')
  const supabase=createClient()
  const{data,error}=await supabase.rpc('get_audit_logs',{limit_count:500,filter_year:year?Number(year):null,filter_month:month?Number(month):null,filter_day:day?Number(day):null})
  if(error){setError(error.message);setLoading(false);return}
  const rows=(data??[])as AuditRow[]
  setLogs(rows)

  const idsByTable:Record<string,string[]>={}
  for(const row of rows){const id=splitRecord(row.record_id).record;if(!id||id==='—')continue;(idsByTable[row.table_name]??=[]).push(id)}
  const labels:Record<string,string>={}
  const unique=(xs:string[])=>[...new Set(xs)]
  const workOrderIds=unique(idsByTable.work_orders??[]),invoiceIds=unique(idsByTable.invoices??[]),invoiceItemIds=unique(idsByTable.invoice_items??[]),customerIds=unique(idsByTable.customers??[]),carIds=unique(idsByTable.cars??[]),partIds=unique(idsByTable.parts??[]),serviceIds=unique(idsByTable.services??[]),expenseIds=unique(idsByTable.expenses??[]),attendanceIds=unique(idsByTable.attendance??[]),employeeIds=unique(idsByTable.employees??[]),branchIds=unique(idsByTable.branches??[])
  const [workOrders,invoices,invoiceItems,customers,cars,parts,services,expenses,attendance,employees,branches]=await Promise.all([
   workOrderIds.length?supabase.from('work_orders').select('id,order_number').in('id',workOrderIds):Promise.resolve({data:[]}),
   invoiceIds.length?supabase.from('invoices').select('id,invoice_number').in('id',invoiceIds):Promise.resolve({data:[]}),
   invoiceItemIds.length?supabase.from('invoice_items').select('id,invoice_id').in('id',invoiceItemIds):Promise.resolve({data:[]}),
   customerIds.length?supabase.from('customers').select('id,customer_number').in('id',customerIds):Promise.resolve({data:[]}),
   carIds.length?supabase.from('cars').select('id,car_number').in('id',carIds):Promise.resolve({data:[]}),
   partIds.length?supabase.from('parts').select('id,part_number').in('id',partIds):Promise.resolve({data:[]}),
   serviceIds.length?supabase.from('services').select('id,name').in('id',serviceIds):Promise.resolve({data:[]}),
   expenseIds.length?supabase.from('expenses').select('id,expense_number').in('id',expenseIds):Promise.resolve({data:[]}),
   attendanceIds.length?supabase.from('attendance').select('id,attendance_number').in('id',attendanceIds):Promise.resolve({data:[]}),
   employeeIds.length?supabase.from('employees').select('id,full_name').in('id',employeeIds):Promise.resolve({data:[]}),
   branchIds.length?supabase.from('branches').select('id,name').in('id',branchIds):Promise.resolve({data:[]}),
  ])
  for(const x of workOrders.data??[])labels[`work_orders:${x.id}`]=String(x.order_number)
  for(const x of invoices.data??[])labels[`invoices:${x.id}`]=String(x.invoice_number)
  const invoiceNumberById:Record<string,string>={};for(const x of invoices.data??[])invoiceNumberById[x.id]=String(x.invoice_number)
  for(const x of invoiceItems.data??[]){if(x.invoice_id&&invoiceNumberById[x.invoice_id])labels[`invoice_items:${x.id}`]=invoiceNumberById[x.invoice_id]}
  for(const x of customers.data??[])labels[`customers:${x.id}`]=String(x.customer_number)
  for(const x of cars.data??[])labels[`cars:${x.id}`]=String(x.car_number)
  for(const x of parts.data??[])labels[`parts:${x.id}`]=String(x.part_number)
  for(const x of services.data??[])labels[`services:${x.id}`]=x.name
  for(const x of expenses.data??[])labels[`expenses:${x.id}`]=String(x.expense_number)
  for(const x of attendance.data??[])labels[`attendance:${x.id}`]=String(x.attendance_number)
  for(const x of employees.data??[])labels[`employees:${x.id}`]=x.full_name
  for(const x of branches.data??[])labels[`branches:${x.id}`]=x.name
  setRecordLabels(labels);setLoading(false)
 })()},[year,month,day])

 useEffect(()=>{if(tab==='active')return;(async()=>{setArchiveLoading(true);const{data,error}=await createClient().from('audit_logs_archive').select('id,log_number,user_id,action,table_name,record_id,occurred_at,old_data,new_data').order('occurred_at',{ascending:false}).limit(500);if(error)setError(error.message);else setArchiveLogs(data??[]);setArchiveLoading(false)})()},[tab])

 const getRecordLabel=(log:AuditRow)=>{
  const s=splitRecord(log.record_id);const value=recordLabels[`${log.table_name}:${s.record}`]??s.record
  if(['invoices','invoice_items'].includes(log.table_name))return `فاتورة #${value}`
  if(log.table_name==='work_orders')return `أمر عمل #${value}`
  if(log.table_name==='parts')return `صنف #${value}`
  if(log.table_name==='services')return `خدمة: ${value}`
  if(log.table_name==='expenses')return `مصروف #${value}`
  if(log.table_name==='attendance')return `حضور #${value}`
  if(log.table_name==='customers')return `عميل #${value}`
  if(log.table_name==='cars')return `سيارة #${value}`
  if(log.table_name==='employees')return `موظف: ${value}`
  if(log.table_name==='branches')return `فرع: ${value}`
  return value
 }
 const archiveRows=archiveLogs.filter(x=>x.action!=='DELETE')
 const go=(next:string)=>{const p=new URLSearchParams(searchParams.toString());if(next==='active')p.delete('tab');else p.set('tab',next);window.history.pushState({},'',`?${p.toString()}`);window.dispatchEvent(new PopStateEvent('popstate'))}
 return <div className="mx-auto flex max-w-7xl flex-col">
  <div className="mb-5"><h1 className="text-2xl font-bold">سجل العمليات</h1><p className="mt-1 text-muted-foreground">كل إضافة أو تعديل أو حذف ومن قام بها ووقت تنفيذها</p></div>
  <div className="mb-5 flex flex-wrap gap-2">
   <button onClick={()=>go('active')} className={`rounded-lg border px-4 py-2 text-sm font-medium ${tab==='active'?'bg-primary text-primary-foreground':'bg-card'}`}>سجل العمليات الحالي</button>
   <button onClick={()=>go('archive')} className={`rounded-lg border px-4 py-2 text-sm font-medium ${tab==='archive'?'bg-primary text-primary-foreground':'bg-card'}`}>📋 العمليات المؤرشفة</button>
  </div>
  {tab==='active'?<><ResourceToolbar filters={[]} dateFilter={{enabled:true,year,month,day}} />{loading?<div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">جاري تحميل سجل العمليات...</div>:error?<div className="rounded-lg border border-destructive/40 bg-card p-8 text-center text-destructive">تعذر تحميل سجل العمليات: {error}</div>:logs.length===0?<div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">لا توجد عمليات مسجلة في الفترة المحددة</div>:<div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="border-b bg-muted/50"><tr><th className="px-4 py-3 text-start">التاريخ والوقت</th><th className="px-4 py-3 text-start">الموظف</th><th className="px-4 py-3 text-start">العملية</th><th className="px-4 py-3 text-start">القسم</th><th className="px-4 py-3 text-start">رقم السجل</th><th className="min-w-[360px] px-4 py-3 text-start">التفاصيل</th></tr></thead><tbody className="divide-y">{logs.map(log=>{const s=splitRecord(log.record_id);return <tr key={log.id} className="hover:bg-muted/40"><td className="whitespace-nowrap px-4 py-3">{new Intl.DateTimeFormat('ar-EG-u-nu-latn',{dateStyle:'short',timeStyle:'short'}).format(new Date(log.occurred_at))}</td><td className="px-4 py-3 font-medium"><div>{log.employee_code??'بدون كود'}</div><div className="text-xs text-muted-foreground">{roleLabel(log.role)}</div></td><td className="px-4 py-3">{ACTION_LABELS[log.action]}</td><td className="px-4 py-3">{TABLE_LABELS[log.table_name]??log.table_name}</td><td className="px-4 py-3 font-mono text-xs">{getRecordLabel(log)}</td><td className="min-w-[360px] px-4 py-3 font-medium whitespace-normal">{s.details}</td></tr>})}</tbody></table></div>}</>:<div><div className="mb-4 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">السجلات الأقدم من شهر تُنقل تلقائيًا إلى أرشيف سجل العمليات. المحذوفات المؤرشفة تظهر في سجل المحذوفات.</div>{archiveLoading?<div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">جاري تحميل الأرشيف...</div>:error?<div className="rounded-lg border border-destructive/40 bg-card p-8 text-center text-destructive">تعذر تحميل الأرشيف: {error}</div>:archiveRows.length===0?<div className="rounded-lg border border-dashed bg-card p-10 text-center text-muted-foreground">لا توجد سجلات مؤرشفة حتى الآن</div>:<div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-sm"><thead className="border-b bg-muted/50"><tr><th className="px-4 py-3 text-start">التاريخ والوقت</th><th className="px-4 py-3 text-start">العملية</th><th className="px-4 py-3 text-start">القسم</th><th className="px-4 py-3 text-start">السجل</th><th className="min-w-[420px] px-4 py-3 text-start">التفاصيل</th></tr></thead><tbody className="divide-y">{archiveRows.map(row=>{const s=splitRecord(row.record_id);const detail=s.details!=='—'?s.details:(row.new_data?JSON.stringify(row.new_data):row.old_data?JSON.stringify(row.old_data):'—');return <tr key={row.id} className="hover:bg-muted/40"><td className="whitespace-nowrap px-4 py-3">{new Intl.DateTimeFormat('ar-EG-u-nu-latn',{dateStyle:'short',timeStyle:'short'}).format(new Date(row.occurred_at))}</td><td className="px-4 py-3">{ACTION_LABELS[row.action as keyof typeof ACTION_LABELS]??row.action}</td><td className="px-4 py-3">{TABLE_LABELS[row.table_name]??row.table_name}</td><td className="px-4 py-3 font-mono text-xs">{s.record||'—'}</td><td className="min-w-[420px] px-4 py-3 whitespace-normal">{detail}</td></tr>})}</tbody></table></div>}</div>}
 </div>
}
