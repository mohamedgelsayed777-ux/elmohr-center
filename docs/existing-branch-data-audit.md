# Existing branch data audit (read-only snapshot)

Checked against Supabase project `ymalhqxqvftmhujuamxv` on 2026-10-13. This is an aggregate-only read; no production records were changed.

## Current branches
- `فرع مدينة المستقبل` — `7827e787-a18b-4bcd-82ce-1f5987dbfd65`
- `فرع مصر الجديدة` — `feffc84a-7f4a-4edf-af50-535c7ee6036a`

The user confirmed that “مدينة نصر” in the requested split refers to the existing “مصر الجديدة” branch.

## Records grouped by assigned branch
| Table | مدينة المستقبل | مصر الجديدة | بدون فرع |
|---|---:|---:|---:|
| customers | 12 | 0 | 0 |
| employees | 11 | 0 | 1 |
| parts | 21 | 0 | 4 |
| work_orders | 11 | 0 | 0 |
| invoices | 10 | 0 | 0 |
| expenses | 20 | 0 | 0 |

## Important implications
- Current operational data in these six tables is assigned to مدينة المستقبل; the مصر الجديدة branch currently has no records in these tables.
- One employee and four inventory items have no branch assignment. They must be reviewed and explicitly assigned or intentionally treated as shared before a branch split; do not silently discard them or assign them by guess.
- This snapshot is not a full backup and does not include child tables, auth records, file storage, or full row content.
- Do not import these records into a second live database or switch production routing until a consistent full snapshot, mapping for unassigned records, and branch-level authorization tests are completed.
- A Supabase development branch/database has not been created because the user has not yet approved the estimated hourly cost.
