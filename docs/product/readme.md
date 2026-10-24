# Product Documentation

Index for Ikki ERP product documentation — vision, requirements, workflows, and domain glossary.

## Documents

| #   | File                                                                   | Purpose                                                    |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| 01  | [01-vision.md](./01-vision.md)                                         | Product vision, target users, success metrics              |
| 02  | [02-prd-core.md](./02-prd-core.md)                                     | Core: Location, IAM, Auth, Company Settings                |
| 02b | [02-prd-core-permissions.md](./02-prd-core-permissions.md)             | Permissions: full catalog, role defaults, access control   |
| 02c | [02-prd-core-numbering.md](./02-prd-core-numbering.md)                 | Number generation: format, daily reset, per-location       |
| 02d | [02-prd-core-audit.md](./02-prd-core-audit.md)                         | Audit trail: comprehensive logging, UI, old/new values     |
| 03  | [03-prd-master-data.md](./03-prd-master-data.md)                       | Master data: Material, UoM (chain), Supplier               |
| 03b | [03-prd-master-data-costing.md](./03-prd-master-data-costing.md)       | Costing: weighted avg per-location, transfer cost, HPP     |
| 03c | [03-prd-master-data-production.md](./03-prd-master-data-production.md) | Semi-finished items: production recipes & orders           |
| 04  | [04-prd-menu.md](./04-prd-menu.md)                                     | Menu: Items, Categories, Modifier Groups, Recipes          |
| 05  | [05-prd-pos.md](./05-prd-pos.md)                                       | POS: orders, table, open/close bill, split, payments, void |
| 06  | [06-prd-inventory.md](./06-prd-inventory.md)                           | Inventory: stock balance, movements, transfer, opname      |
| 07  | [07-prd-finance.md](./07-prd-finance.md)                               | Finance: CoA, journals, AP/AR, reports                     |
| 07b | [07-prd-finance-journals.md](./07-prd-finance-journals.md)             | Auto-journal rules: triggers, account mappings, entries    |
| 08  | [08-prd-hr.md](./08-prd-hr.md)                                         | HR: employees, shifts, attendance, payroll                 |
| 09  | [09-prd-crm.md](./09-prd-crm.md)                                       | CRM: customers, loyalty, promotions                        |
| 10  | [10-workflows.md](./10-workflows.md)                                   | Business workflows and state machines                      |
| 11  | [11-glossary.md](./11-glossary.md)                                     | Domain terminology                                         |
| 12  | [12-timeline.md](./12-timeline.md)                                     | Development phases and timeline                            |

## Context

Ikki ERP serves a single F&B business (Ikki Group) operating:

- **2 stores:** Ikki Coffee (cafe), Ikki Resto (restaurant)
- **Multiple warehouses:** Central warehouses for bulk storage and distribution
- **Roles:** Owner, managers, cashiers, warehouse staff, accountants

Each store has its own menu, its own inventory, and its own POS. Materials (bahan baku) are shared globally across all locations for easy transfer.

---

**Next:** [01-vision.md](./01-vision.md) — Product vision.
