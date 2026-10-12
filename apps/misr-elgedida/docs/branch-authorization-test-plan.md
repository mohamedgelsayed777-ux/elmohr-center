# Branch authorization test plan

These are acceptance tests to run only against a separate test database after the schema and policies are reviewed. They do not connect to or modify production.

## Test identities
Create synthetic test accounts only:
- Central manager: role `manager`, no branch_id.
- Misr El Gedida branch manager: role `branch_manager`, branch_id set to Misr El Gedida.
- Misr El Gedida reception: role `reception`, same branch.
- Misr El Gedida accountant: role `accountant`, same branch.
- Other-branch branch manager: role `branch_manager`, branch_id set to the other branch.

## Required tests
| Test | Expected outcome |
|---|---|
| Central manager reads both branches | Allowed |
| Branch manager reads own branch customers/orders/invoices | Allowed |
| Branch manager queries other branch records directly | No rows / denied |
| Branch manager inserts record with another branch_id | Denied |
| Reception creates a work order in assigned branch | Allowed |
| Reception deletes an invoice | Denied |
| Reception edits/deletes an inventory item outside assigned branch | Denied |
| Accountant reads approved financial records in own branch | Allowed |
| Accountant reads operation log if policy forbids it | Denied |
| Accountant reads deleted-record archive if policy forbids it | Denied |
| Inactive user reads any protected table | Denied |
| Unauthenticated user reads protected data | Denied |
| User changes request branch_id to bypass scope | Denied |
| Car/customer/work-order IDs from different branches are combined | Denied by database constraints or trusted server validation |
| Browser cannot access service-role secret | Verified by source/build inspection |
| Invoice totals and payment balance reconcile | Verified |
| Monthly archive preserves audit history and access controls | Verified |

## Exit criteria
Do not connect real data or deploy until every test passes, a build/type-check passes, table-level write permissions have been reviewed, and backup/rollback procedures are documented.
