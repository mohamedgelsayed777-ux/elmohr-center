# ELMOHR CENTER – Misr El Gedida

Standalone web-app workspace for the Misr El Gedida branch of ElMohr Center.

## Current stage
- GitHub-only starter scaffold.
- No production deployment.
- No Supabase project or credentials configured.
- No customer or operational data copied from the existing app.
- Data migration is intentionally blocked until the existing data inventory is reviewed and an explicit transfer list is approved.

## Local development
Requires Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

## Planned modules
- Dashboard and daily work-order overview
- Customers and vehicles
- Work orders and services
- Invoices and payment methods
- Separate inventories for spare parts, filters, and oils
- Expenses and daily reports
- Attendance
- User roles and branch-scoped permissions
- Audit log and monthly archiving

## Data and security rules
1. Never point this app at the production Supabase project during development.
2. Do not copy production secrets, credentials, or personal data into GitHub.
3. Review the existing data table-by-table before approving any transfer.
4. Keep the central manager's cross-branch access separate from branch-manager access.
5. Enforce authorization in the database/server layer, not only by hiding UI elements.
