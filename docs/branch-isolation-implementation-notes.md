# Branch isolation implementation notes

This branch intentionally contains planning and read-only audit tooling only. No production SQL has been applied, no deployment was made, and no account/data was changed.

## Why the application code is not yet changed
The existing schema currently models profile roles as `manager`, `reception`, and `accountant`; there is no confirmed `branch_manager` role in the role constraint. The current route guard reads only `role`, so it cannot reliably distinguish the central manager from a branch manager. Merely hiding branch selectors in the UI would not enforce data isolation.

Before editing the live application logic, the implementation must align these layers:
1. Role model and profile branch assignment.
2. PostgreSQL RLS policies for every branch-owned table.
3. Parent-derived policies for child tables (cars, work-order items/inspections, invoice items, attendance).
4. Server actions and RPC functions, especially SECURITY DEFINER functions.
5. Route-level visibility as a user-experience layer only; never as the security boundary.

## Required design decisions
- Preserve current `manager` semantics for the central manager unless the owner explicitly approves a role migration.
- Introduce branch-manager semantics only after checking the role CHECK constraint, profile creation flow, existing manager account, and user invitation/admin workflow.
- Keep shared reference data such as the vehicle catalogue global if appropriate. Decide whether services are global or branch-specific before adding branch filters.
- Derive the branch scope from the authenticated profile; never trust a submitted `branch_id` by itself.
- For rows with no branch assignment, require an explicit mapping decision. Do not infer the destination branch from the table name or current counts.
- Archive/audit endpoints must authenticate and authorize callers inside the RPC itself, not just in the page.

## Suggested rollout on a future isolated database
1. Apply schema migration to the isolated database only.
2. Create test identities for central manager, each branch manager, reception, accountant, and anonymous user.
3. Test read/write/delete and RPC access for own branch, other branch, and unassigned rows.
4. Verify denied requests fail through direct PostgREST/RPC requests as well as the UI.
5. Compare row counts and key relationships against a consistent source snapshot.
6. Run the security advisor and resolve any new RLS findings.
7. Review migration and test evidence before a separately approved production change.

## Files in this branch
- `docs/branch-isolation-plan.md`: rollout and data-preservation plan.
- `docs/branch-isolation-test-matrix.md`: role/action test matrix.
- `docs/existing-branch-data-audit.md`: read-only aggregate counts from the current database.
- `supabase/manual_checks/branch_isolation_read_only_preflight.sql`: SELECT-only queries to inspect policies, RLS, SECURITY DEFINER functions, unassigned records, and baseline counts.

## Known blockers
- No isolated Supabase database has been created because the owner has not approved its hourly cost.
- Current live data has one employee and four inventory items without a branch assignment; mapping remains unresolved.
- Current schema and RPC permissions need detailed review before safe implementation. Do not use production as a test environment.
