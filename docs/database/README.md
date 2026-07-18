# Database Documentation

Index for all database documentation in the Ikki ERP system.

---

## Quick Facts

| Property            | Value                            |
| ------------------- | -------------------------------- |
| Database            | PostgreSQL                       |
| ORM                 | Drizzle ORM (bun-sql driver)     |
| Schema source       | `apps/server/src/db/schema/`     |
| Migrations          | `apps/server/src/db/migrations/` |
| Config              | `apps/server/drizzle.config.ts`  |
| Tables              | 49                               |
| Primary keys        | Serial integer                   |
| Financial precision | `numeric(18,2)`                  |
| Quantity precision  | `numeric(18,6)`                  |

## Documentation Structure

```
docs/database/
├── readme.md              ← you are here
├── domain-guide.md        ← ownership, data flow, access rules
├── erd/                   ← ASCII entity-relationship diagrams
│   ├── readme.md          ← notation + cross-domain FK map
│   ├── core.md            ← IAM, sessions, audit
│   ├── materials.md
│   ├── products.md
│   ├── sales.md
│   ├── purchasing.md
│   ├── inventory.md
│   ├── finance.md
│   ├── hr.md
│   ├── crm.md
│   └── integrations.md
├── standards/             ← design conventions & rules
│   ├── readme.md          ← quick rules + anti-patterns
│   ├── naming.md          ← tables, columns, files
│   ├── columns.md         ← PK, audit, numerics, booleans, JSONB
│   ├── constraints.md     ← FK strategy, checks, soft-delete, enums
│   └── indexes.md         ← index strategy, partials, composites
└── schema/                ← column-level reference per domain
    ├── readme.md          ← shared columns + enum reference
    ├── core.md
    ├── master-data.md
    ├── materials.md
    ├── products.md
    ├── crm.md
    ├── sales.md
    ├── purchasing.md
    ├── inventory.md
    ├── finance.md
    ├── hr.md
    └── integrations.md
```

## Where to Start

| Goal                                     | Read                                                       |
| ---------------------------------------- | ---------------------------------------------------------- |
| Understand relationships between tables  | [erd/readme.md](./erd/readme.md) → pick a domain           |
| Learn naming/design rules                | [standards/readme.md](./standards/readme.md)               |
| Look up column types for a table         | [schema/readme.md](./schema/readme.md) → pick a domain     |
| Understand module boundaries & data flow | [domain-guide.md](./domain-guide.md)                       |
| Find which module owns a table           | [domain-guide.md](./domain-guide.md) § Ownership           |
| Add a new domain                         | [domain-guide.md](./domain-guide.md) § Adding a New Domain |

## Domain Map

```
CORE            MASTER DATA       OPERATIONS        INTEGRATIONS
-----------     -------------     -------------     ------------
roles           locations         customers         moka_config
users           uoms              employees         moka_scrap
sessions        taxes             accounts          moka_cursors
audit_logs      suppliers         sales_orders
user_assigns    company_settings  purchase_orders
                sales_types       stock_txn
                materials (+4)    work_orders
                products (+4)     payments
                recipes (+1)      expenditures
```
