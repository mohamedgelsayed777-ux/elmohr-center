# Data-transfer map — Misr El Gedida

This document is a planning checklist only. It contains no customer records, secrets, or row-level production data.

## Transfer decision register

For every table, the owner must approve one of: **transfer all**, **transfer selected records**, **recreate as clean setup**, or **do not transfer**. Record source count, approved count, imported count, and reconciliation result.

| Area | Candidate tables / records | Review before transfer | Initial decision |
|---|---|---|---|
| Branch configuration | branches | Confirm the exact Misr El Gedida branch identity and display label | Review |
| User accounts | profiles / auth users | Create new branch users; never copy passwords or auth tokens | Recreate accounts |
| Customers | customers | Identify duplicates, consent/retention needs, and branch ownership | Review |
| Vehicles | cars | Preserve customer relationship and verify VIN/plate uniqueness rules | Review |
| Work orders | work_orders and related tables | Include status history, services, parts, vehicle/customer references | Review |
| Invoices | invoices, invoice_items, payments if present | Reconcile totals, discounts, payment methods, numbering, and references | Review |
| Inventory | parts and inventory movements if present | Separate spare parts, filters, and oils; verify units and quantities | Review |
| Services and prices | service catalog / pricing tables if present | Confirm approved service names and prices for this branch | Recreate or review |
| Expenses | expenses | Confirm branch ownership, dates, totals, and attached documents | Review |
| Attendance | attendance / employees | Confirm active employees and dates; do not guess unassigned records | Review |
| Audit trail | audit_logs and archive | Determine retention and privacy needs; avoid importing irrelevant security history | Review separately |
| Files | storage objects / images if present | Inventory references and file ownership before any copy | Review |

## Required safeguards

1. Do not connect this project to the production database.
2. Do not put production exports, personal data, or credentials in GitHub.
3. Take a verified backup through an approved process before any eventual migration.
4. Produce an explicit approved-record manifest before importing selected records.
5. Preserve stable IDs only when relationship integrity has been checked; otherwise use a mapping table.
6. Reconcile counts and financial totals before/after import.
7. Test sign-in and branch isolation with separate test users before any real deployment.
8. Keep the central manager's cross-branch access distinct from the branch manager's branch-only access.
9. Never infer branch ownership for records whose branch is missing or ambiguous.

## Known aggregate snapshot from the earlier read-only review

These are historical aggregate counts and must be re-queried before a migration decision. They are not a backup and do not prove that no branch-specific data exists elsewhere.

| Table | Mostaqbal | Misr El Gedida | Unassigned |
|---|---:|---:|---:|
| customers | 12 | 0 | 0 |
| employees | 11 | 0 | 1 |
| parts | 21 | 0 | 4 |
| work_orders | 11 | 0 | 0 |
| invoices | 10 | 0 | 0 |
| expenses | 20 | 0 | 0 |

No records have been transferred by this scaffold.
