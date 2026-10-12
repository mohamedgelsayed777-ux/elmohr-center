# Architecture and permissions plan

## Isolation model
- The standalone app lives under `apps/misr-elgedida`.
- It must not import the production app's Supabase client or production environment variables.
- No production URL, anon key, service-role key, exported customer data, or passwords belong in this directory.
- Local UI work may use clearly labeled mock/demo data only. Do not represent it as live branch data.

## Roles to support
| Role | Intended access |
|---|---|
| Central manager | Can view both branches through an explicit branch selector; all writes must be scoped to the selected branch |
| Branch manager | Can view and manage only the assigned branch |
| Reception | Create/update permitted customer and work-order fields; no invoice deletion; no unrestricted editing/deletion |
| Accountant | Financial and reporting permissions as approved; no access to operation/deleted-record logs unless explicitly authorized |

The current production profile role constraint does not yet include a branch-manager role. That must be designed and tested in the standalone schema; do not alter production to add it.

## Proposed data domains
- Branches and user profiles
- Customers and cars
- Work orders, work-order services, and work-order parts
- Service catalog and branch pricing
- Invoices, invoice items, and payments
- Three independent inventory categories: spare parts, filters, and oils
- Expenses and expense documents
- Employees and attendance
- Audit events and archived audit events

## Authorization requirements
1. Determine the user's role and assigned branch on the server for every protected operation.
2. Enforce branch ownership in database policies and server actions; hiding buttons is not authorization.
3. Use a separate test environment before connecting any database.
4. Verify that changing request parameters cannot reveal another branch's records.
5. Treat server-only keys as server-only secrets and never expose them to the browser.
6. Protect audit/archive tables with explicit access policies.
7. Review SECURITY DEFINER functions and their search_path/execute grants before any real database setup.

## Ready-to-build gates
- [ ] Approved table and relationship design
- [ ] Approved branch transfer manifest
- [ ] Separate development database and credentials (only if/when approved)
- [ ] Role and branch authorization tests
- [ ] Build/type-check and manual UI tests
- [ ] Backup/rollback plan before any production connection
