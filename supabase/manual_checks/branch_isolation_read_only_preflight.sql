-- READ-ONLY branch isolation preflight for ElMohr Center.
-- Run manually against a development database only. This file contains SELECTs only.
-- It does not alter tables, policies, functions, roles, or user data.

-- 1) Branch assignments and profile role model.
select id, name, city, manager_name, is_active
from public.branches
order by created_at;

select role, branch_id, count(*) as profiles
from public.profiles
group by role, branch_id
order by role, branch_id;

-- 2) Row-level security state for exposed public tables.
select n.nspname as schema_name,
       c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

-- 3) Existing policies. Review policy expressions, not only whether a policy exists.
select schemaname, tablename, policyname, permissive, roles,
       cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 4) SECURITY DEFINER functions exposed in public schema.
-- Review function body and EXECUTE grants before changing any permissions.
select p.oid::regprocedure as function_signature,
       p.prosecdef as security_definer,
       p.proconfig as function_settings,
       pg_get_userbyid(p.proowner) as owner,
       p.proacl as acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by p.oid::regprocedure::text;

-- 5) Unassigned operational rows requiring explicit mapping.
select 'customers' as table_name, count(*) as unassigned
from public.customers where branch_id is null
union all select 'employees', count(*) from public.employees where branch_id is null
union all select 'parts', count(*) from public.parts where branch_id is null
union all select 'work_orders', count(*) from public.work_orders where branch_id is null
union all select 'invoices', count(*) from public.invoices where branch_id is null
union all select 'expenses', count(*) from public.expenses where branch_id is null
union all select 'attendance', count(*) from public.attendance where branch_id is null;

-- 6) Row counts for baseline comparison before/after any test import.
select 'branches' as table_name, count(*) as row_count from public.branches
union all select 'profiles', count(*) from public.profiles
union all select 'customers', count(*) from public.customers
union all select 'cars', count(*) from public.cars
union all select 'employees', count(*) from public.employees
union all select 'services', count(*) from public.services
union all select 'parts', count(*) from public.parts
union all select 'work_orders', count(*) from public.work_orders
union all select 'work_order_items', count(*) from public.work_order_items
union all select 'work_order_inspections', count(*) from public.work_order_inspections
union all select 'invoices', count(*) from public.invoices
union all select 'invoice_items', count(*) from public.invoice_items
union all select 'expenses', count(*) from public.expenses
union all select 'attendance', count(*) from public.attendance
union all select 'audit_logs', count(*) from public.audit_logs
union all select 'audit_logs_archive', count(*) from public.audit_logs_archive
union all select 'deleted_records', count(*) from public.deleted_records
order by table_name;
