# Branch isolation rollout plan

## Safety requirements
- Keep production Supabase project `ymalhqxqvftmhujuamxv` unchanged during development.
- Preserve every current row, relationship, identity value, and audit/deleted record.
- The owner declined the paid Supabase development branch for now; do not create one.
- Do not deploy or merge this feature branch into `main`.

## Confirmed branch mapping
- `فرع مدينة المستقبل`: `7827e787-a18b-4bcd-82ce-1f5987dbfd65`
- `فرع مصر الجديدة` (the user's intended “مدينة نصر” branch): `feffc84a-7f4a-4edf-af50-535c7ee6036a`

## Current data observations
A read-only aggregate query found the following rows grouped by branch:
- Customers: 12 in مدينة المستقبل; 0 in مصر الجديدة; 0 unassigned.
- Employees: 11 in مدينة المستقبل; 0 in مصر الجديدة; 1 unassigned.
- Inventory parts/filters/oils: 21 in مدينة المستقبل; 0 in مصر الجديدة; 4 unassigned.
- Work orders: 11 in مدينة المستقبل; 0 in مصر الجديدة; 0 unassigned.
- Invoices: 10 in مدينة المستقبل; 0 in مصر الجديدة; 0 unassigned.
- Expenses: 20 in مدينة المستقبل; 0 in مصر الجديدة; 0 unassigned.

These counts are not a full backup and do not include all child tables, auth identities, or storage files. The unassigned employee and inventory rows need an explicit owner decision; never infer their destination branch.

## Required technical design
1. Preserve existing central manager access; add branch-manager support only after validating the role constraint and account-creation flow.
2. Use authenticated profile branch assignment as the authority. Never trust a submitted `branch_id`.
3. Enforce access in PostgreSQL RLS and inside RPC functions, including SECURITY DEFINER functions. UI route checks are not the security boundary.
4. Scope child rows through parent ownership (cars/customers, work-order items/inspections, invoice items, attendance/employee, audit and deleted-record endpoints).
5. Deliberately decide which reference data is global (for example vehicle catalog) and whether services are shared.
6. Review the RLS-disabled `audit_logs_archive` table and every exposed SECURITY DEFINER function one by one; do not blindly revoke grants that existing workflows may depend on.

## Validation sequence
1. Review the SELECT-only audit SQL in `supabase/audits/branch_isolation_preflight.sql`.
2. Prepare synthetic test identities and a full test matrix without accessing customer data.
3. In an isolated database when one is available, implement role/RLS/RPC changes and test SELECT/INSERT/UPDATE/DELETE and direct RPC/API access for central manager, both branch managers, reception, accountant, and anonymous users.
4. Confirm a branch manager cannot read or alter the other branch's rows even by tampering with request payloads.
5. Compare row counts, foreign keys, identity sequences, sample invoices/work orders, inventory links, and audit history against a consistent source snapshot.
6. Run the Supabase security advisor and fix findings with regression tests.
7. Prepare a rollback plan and require separate approval before any production migration or cutover.

## Current status
GitHub-only preparation is underway on `feature/branch-isolation-test`. No production schema/data was changed, no paid test database was created, and no deployment was performed. Actual authorization code changes should wait until the schema/RPC policy review and an isolated test target are available.
