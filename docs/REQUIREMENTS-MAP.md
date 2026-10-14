# Requirements map

| Requirement | Implementation |
|---|---|
| Admin + Branch roles | JWT auth + role middleware |
| Branch onboarding | Admin branch CRUD + generated credentials |
| Independent branch login/data | `branchId` ownership and query scoping |
| Categories | Admin CRUD, active/inactive |
| Shifts | Admin CRUD; bill captures active shift |
| Food items | Admin CRUD with category, image URL, base rate |
| Branch rate override | `BranchFoodRate` with fallback to base rate |
| Billing | Order + order items + payment method |
| Today's collection | branch dashboard endpoint |
| Reports | food/shift/day/GST/branch/comparison/expense/outstanding |
| Expenses | branch-scoped expense CRUD |
| Outstanding | today's sales - today's expenses |
