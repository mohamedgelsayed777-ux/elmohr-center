# Branch access test matrix

Run this only against an isolated development database with synthetic/test accounts. Do not use production to test denied access.

| Test identity | Branch assignment | Expected reads | Expected writes |
|---|---|---|---|
| Central manager | no single branch / central role | both branches and central reports | explicitly permitted central administration |
| Nasr City branch manager | Nasr City branch ID | own branch only | own branch only |
| Mostaqbal branch manager | Mostaqbal branch ID | own branch only | own branch only |
| Reception | assigned branch | permitted operational data for own branch | only reception-allowed actions in own branch |
| Accountant | assigned branch | finance/operational data allowed by current role, own branch | only accountant-allowed actions in own branch |
| Anonymous | none | no private operational data | no writes or privileged RPC calls |

## Required direct database/API checks
For each table and RPC, test both normal app usage and direct API calls:
- SELECT: other branch rows must not be returned.
- INSERT: a submitted foreign branch_id must be rejected or replaced with the caller's branch.
- UPDATE: changing branch_id or editing another branch's row must fail.
- DELETE: deleting another branch's row must fail.
- Child rows: enforce scope through their parent record, including cars, work-order items/inspections, invoice items, attendance, audit logs, deleted records and archived logs.
- RPCs: every SECURITY DEFINER function must authenticate the caller, verify role and branch scope, and have only the minimum required EXECUTE grants.
- Global reference data: decide deliberately whether vehicle_catalog and services are shared across branches; don't assume all tables need branch_id.

## Data preservation checks
Before/after test import, compare counts for every table; verify foreign keys and identity/sequence behavior; inspect representative work orders, invoices, inventory movements and audit records. Keep a read-only export/backup and a written rollback plan before any production cutover.
