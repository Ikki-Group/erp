# Agentic Prompt – ERP Sales Module Database Design

You are designing the **Sales module database** for a modern ERP system.

The system currently **ingests sales transactions from external applications via scraping**, but in the future we will also implement **our own POS system**.

Your task is to design a **PostgreSQL-optimized relational schema** that supports both use cases.

The design must prioritize:

* **SQL performance**
* **data consistency**
* **auditability**
* **future extensibility**

Tech stack context:

```
Backend: TypeScript
Runtime: Bun
Framework: Elysia
ORM: Drizzle
Database: PostgreSQL
```

Follow **ERP-grade data modeling practices**.

---

# Core Functional Requirements

The sales system must support:

### 1. Bill Lifecycle

Sales transactions behave like **bills**.

A bill must support:

```
open -> add items -> close
```

State transitions:

```
OPEN
CLOSED
VOID
```

Requirements:

* a bill can remain **open**
* items can be added while open
* a bill is **finalized when closed**
* voiding must be **auditable**

---

### 2. Batch Item Ordering

Customers may add items to an order in **multiple batches**.

Example:

```
Open Bill

Batch 1
- Coffee
- Sandwich

Batch 2
- Dessert

Batch 3
- Tea
```

This is common in:

* restaurant POS
* table service
* incremental ordering

The database must explicitly support **batch grouping of items**.

---

### 3. Custom Items

The system must allow items that **do not exist in the product master**.

Examples:

```
Special request
Manual charge
Custom discount
```

Requirements:

```
productId = nullable
variantId = nullable
itemName must always be stored
```

Sales history must **never depend on product master records**.

---

### 4. Product Variants

Products may have variants.

Example:

```
Coffee
  - Small
  - Medium
  - Large
```

Sales items must optionally reference:

```
productId
variantId
```

But must still work when selling **custom items**.

---

### 5. External Source Ingestion

Currently sales come from **external platforms**.

Examples:

```
Grab
Shopee
Marketplace
POS from another system
```

The schema must support:

```
externalSource
externalOrderId
rawPayload
```

This ensures:

* deduplication
* traceability
* replay ability

---

### 6. Void Transactions

The system must support:

```
void item
void order
```

Void operations must be **audited**, meaning:

```
who voided
when
reason
```

Avoid destructive deletes.

Use **immutable audit records**.

---

### 7. Sales Type

Sales must support different types.

Examples:

```
POS
DINE_IN
TAKEAWAY
ONLINE
MARKETPLACE
EXTERNAL
```

This should be stored on the **order level**.

---

### 8. Auditability

The system must support a **strong audit trail**.

Important requirements:

* no historical mutation
* void must be tracked
* item names must be stored even if product changes

Use the project helper:

```
...metadata
```

Which provides standard audit columns.

---

### 9. Analytics

The schema must be optimized for SQL analytics.

Common queries:

```
revenue per product
revenue per location
top selling variant
sales by sales type
daily revenue
```

Avoid designs that require complex joins or heavy reconstruction.

---

### 10. CRM Integration (Future)

Future integration with CRM will require linking sales to:

```
customerId
```

Do not implement CRM tables yet, but the design should allow **easy future extension**.

---

# Expected Entities

You should design the following tables:

```
sales_orders
sales_order_batches
sales_order_items
sales_voids
sales_external_refs
```

Each entity must have:

```
primary key
timestamps
indexes for common queries
```

---

# Important Data Consistency Rules

The schema must enforce:

### Order Integrity

```
items must belong to a valid order
batches must belong to a valid order
```

---

### Batch Integrity

```
items may optionally belong to a batch
```

---

### Historical Safety

Sales items must store:

```
itemName
unitPrice
taxAmount
discountAmount
```

Even if the product master changes.

---

### Immutable Financial History

Never derive financial totals dynamically from product tables.

All financial numbers must be stored directly in:

```
sales_order_items
sales_orders
```

---

# SQL Performance Requirements

Design indexes for:

```
order lookup by location
order lookup by status
analytics by product
analytics by variant
external ingestion deduplication
```

Use PostgreSQL best practices.

---

# Implementation Requirements

Generate schema using **Drizzle ORM**.

Rules:

```
camelCase column naming
explicit foreign keys
explicit indexes
avoid unnecessary joins
```

Avoid premature abstraction.

Focus on **clean relational modeling**.

---

# Output Format

The response must include:

### 1. Schema Design

Full Drizzle schema for all tables.

---

### 2. Explanation

Explain:

```
why each table exists
how the lifecycle works
how analytics works
```

---

### 3. Data Flow

Explain:

```
open bill
add batch
add items
close bill
void
external ingestion
```

---

# Additional Notes

The schema must work well for:

```
ERP
POS
external ingestion
future CRM integration
sales analytics
```

Prioritize:

```
clarity
consistency
SQL performance
```

Avoid unnecessary complexity.

