# ELMOHR CENTER – Misr El Gedida

This standalone workspace is being prepared from the existing ElMohr Center Next.js application.

## Safety rules
- Work only on branch `standalone/misr-elgedida`.
- Never connect this app to the production Supabase project.
- Do not add real credentials, customer records, employee data, invoices, or exports to Git.
- No deployment or production changes until the owner explicitly approves a separate database and testing.

## What must match the original app
The standalone copy must preserve the original Arabic RTL interface, responsive navigation, dashboard, work orders, customers, cars, services, parts/filters/oils inventory, invoices, expenses, reports, employees, attendance, audit logs, deleted records, profile, search, and role-based UI.

## Database readiness
The app requires a separate Supabase project to make authenticated CRUD workflows work. Until one is approved, use only a safe local/demo configuration and synthetic test records. A visual copy alone must not be described as fully functional.

## Data review before migration
Review every table and relationship, including invoice items, work-order children, employee/attendance records, audit/deleted records, storage objects, and auth identities. Confirm the destination of unassigned rows with the owner. Preserve source data and take a verifiable backup before any migration.

## Verification checklist
- [ ] No production Supabase URL/key in this workspace
- [ ] Build passes
- [ ] Every original route opens
- [ ] Forms and actions work against an isolated test database
- [ ] Branch-level authorization is enforced server-side and by database RLS
- [ ] Manager and branch users tested with synthetic accounts
- [ ] Print, mobile layout, inventory types, and invoice totals verified
- [ ] No migration/deployment until explicit approval
