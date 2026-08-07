# PRD: Permission Structure

Complete permission catalog, role defaults, and access control rules.

## Access Control Model

- **RBAC** — Role-Based Access Control.
- Permissions are granular strings: `{module}:{entity}:{action}`.
- Roles bundle permissions. Users get permissions via role assignments.
- Custom roles can be created with any permission combination.
- Role assignments are scoped to a location (or global for owner/accountant).
- No threshold-based permissions — if you have the permission, you can do it on any record.

## Permission Format

```
{module}:{entity}:{action}

Examples:
  pos:order:create
  inventory:transfer:ship
  finance:journal:post
```

## Actions

| Action | Meaning |
|--------|---------|
| `read` | View list and detail |
| `create` | Create new record |
| `update` | Edit existing record |
| `delete` | Deactivate / soft-delete |
| `manage` | Full CRUD (shorthand for read+create+update+delete) |
| domain-specific | `void`, `approve`, `ship`, `receive`, `close`, `post`, `pay`, `adjust` |

## Full Permission Catalog

### Core

| Permission | Description |
|------------|-------------|
| `core:location:read` | View locations |
| `core:location:create` | Create location |
| `core:location:update` | Edit location |
| `core:location:delete` | Deactivate location |
| `core:company:read` | View company settings |
| `core:company:update` | Edit company settings |

### IAM

| Permission | Description |
|------------|-------------|
| `iam:user:read` | View users |
| `iam:user:create` | Create user |
| `iam:user:update` | Edit user |
| `iam:user:delete` | Deactivate user |
| `iam:role:read` | View roles |
| `iam:role:create` | Create custom role |
| `iam:role:update` | Edit role permissions |
| `iam:role:delete` | Delete custom role |
| `iam:assignment:read` | View user-role-location assignments |
| `iam:assignment:manage` | Assign/unassign users to roles and locations |

### Menu

| Permission | Description |
|------------|-------------|
| `menu:item:read` | View menu items |
| `menu:item:create` | Create menu item |
| `menu:item:update` | Edit menu item (name, price, status) |
| `menu:item:delete` | Deactivate menu item |
| `menu:category:manage` | CRUD menu categories |
| `menu:modifier:manage` | CRUD modifier groups + options |
| `menu:recipe:read` | View recipes and HPP |
| `menu:recipe:manage` | CRUD recipes + ingredient lines |

### POS

| Permission | Description |
|------------|-------------|
| `pos:order:read` | View orders |
| `pos:order:create` | Create new order |
| `pos:order:update` | Add items to open order |
| `pos:order:void` | Void entire order |
| `pos:order:void-line` | Void single line item |
| `pos:payment:create` | Record payment on order |
| `pos:shift:open` | Open cashier shift |
| `pos:shift:close` | Close own shift |
| `pos:shift:close-other` | Close another user's shift |
| `pos:table:manage` | CRUD tables |
| `pos:discount:apply` | Apply discount to order/line |
| `pos:voucher:manage` | CRUD voucher codes |

### Inventory

| Permission | Description |
|------------|-------------|
| `inventory:stock:read` | View stock balances and movements |
| `inventory:stock:adjust` | Manual stock adjustment (in/out) |
| `inventory:transfer:read` | View transfer requests |
| `inventory:transfer:create` | Create transfer request |
| `inventory:transfer:ship` | Confirm shipment from source |
| `inventory:transfer:receive` | Confirm receipt at destination |
| `inventory:transfer:cancel` | Cancel transfer request |
| `inventory:opname:read` | View stock opname records |
| `inventory:opname:create` | Start new opname |
| `inventory:opname:complete` | Finalize opname (generates adjustments) |
| `inventory:receiving:create` | Record goods received from supplier |

### Master Data

| Permission | Description |
|------------|-------------|
| `master:material:read` | View materials |
| `master:material:create` | Create material |
| `master:material:update` | Edit material |
| `master:material:delete` | Deactivate material |
| `master:uom:manage` | CRUD units of measure + conversions |
| `master:supplier:read` | View suppliers |
| `master:supplier:manage` | CRUD suppliers + material pricing |

### Finance

| Permission | Description |
|------------|-------------|
| `finance:account:read` | View Chart of Accounts |
| `finance:account:manage` | CRUD accounts |
| `finance:journal:read` | View journal entries |
| `finance:journal:create` | Create manual journal entry |
| `finance:journal:post` | Post draft journal |
| `finance:journal:void` | Void posted journal (creates reversal) |
| `finance:report:read` | View financial reports (P&L, BS, cash flow) |
| `finance:fiscal:close` | Close fiscal period |
| `finance:ap:read` | View accounts payable |
| `finance:ap:pay` | Record supplier payment |
| `finance:expense:create` | Record operational expense |

### HR

| Permission | Description |
|------------|-------------|
| `hr:employee:read` | View employee data |
| `hr:employee:manage` | CRUD employees |
| `hr:schedule:read` | View shift schedules |
| `hr:schedule:manage` | CRUD shift templates + assignments |
| `hr:attendance:read` | View attendance records |
| `hr:attendance:manage` | Input/edit attendance manually |
| `hr:payroll:read` | View payroll runs and payslips |
| `hr:payroll:calculate` | Run payroll calculation |
| `hr:payroll:approve` | Approve payroll run |
| `hr:payroll:pay` | Mark payroll as paid |
| `hr:leave:read` | View leave requests |
| `hr:leave:request` | Submit own leave request |
| `hr:leave:approve` | Approve/reject leave requests |

### CRM

| Permission | Description |
|------------|-------------|
| `crm:customer:read` | View customers |
| `crm:customer:manage` | CRUD customers |
| `crm:loyalty:read` | View points history |
| `crm:loyalty:adjust` | Manual point adjustment |
| `crm:promotion:read` | View promotions |
| `crm:promotion:manage` | CRUD promotions |

## Default Roles

Five system roles shipped with the app. These are defaults — owner can create custom roles with any permission combination.

### Owner

All permissions. Cannot be restricted. At least one user must have this role.

### Manager (per-location)

| Module | Permissions |
|--------|-------------|
| Core | `location:read` |
| Menu | All (`item:*`, `category:manage`, `modifier:manage`, `recipe:*`) |
| POS | All (`order:*`, `payment:*`, `shift:*`, `table:manage`, `discount:apply`, `voucher:manage`) |
| Inventory | All (`stock:*`, `transfer:*`, `opname:*`, `receiving:create`) |
| Master Data | `material:read`, `material:create`, `supplier:read` |
| Finance | `journal:read`, `report:read`, `expense:create` |
| HR | `employee:read`, `schedule:manage`, `attendance:manage`, `payroll:read`, `leave:approve` |
| CRM | All (`customer:manage`, `loyalty:manage`, `promotion:manage`) |

### Cashier (per-location)

| Module | Permissions |
|--------|-------------|
| POS | `order:create`, `order:update`, `order:read`, `order:void`, `order:void-line`, `payment:create`, `shift:open`, `shift:close`, `discount:apply` |
| Menu | `item:read` |
| CRM | `customer:read` |
| HR | `leave:request` |

### Warehouse Staff (per-location)

| Module | Permissions |
|--------|-------------|
| Inventory | All (`stock:*`, `transfer:*`, `opname:*`, `receiving:create`) |
| Master Data | `material:read`, `supplier:read` |
| Core | `location:read` |
| HR | `leave:request` |

### Accountant (global)

| Module | Permissions |
|--------|-------------|
| Finance | All (`account:*`, `journal:*`, `report:read`, `fiscal:close`, `ap:*`, `expense:create`) |
| POS | `order:read` |
| Core | `location:read`, `company:read` |
| Master Data | `supplier:read` |
| HR | `payroll:read`, `leave:request` |

## Custom Roles

- Owner can create custom roles (e.g. "Supervisor", "Head Chef", "Senior Barista").
- Pick any combination of permissions from the catalog above.
- Custom roles are assigned per-location (like manager/cashier) or global.
- System roles (owner) cannot be deleted or have permissions removed.
- Custom roles can be deleted if no users are assigned.

## Authorization Logic

```
On every API request:
  1. Get user from session
  2. Get active location from session
  3. Find user_assignments WHERE user_id AND (location_id = active OR location_id IS NULL)
  4. Collect all permissions from matched roles
  5. Check if required permission is in the set
  6. If yes → proceed. If no → 403 Forbidden.
```

## Special Rules

- `owner` bypasses all permission checks (implicit all permissions).
- System roles cannot be modified.
- A permission grants access across the entire active location context (no record-level restrictions).
- Location-scoped roles only apply at assigned locations. Switching to an unassigned location shows no data.

---

**Next:** [03-prd-master-data.md](./03-prd-master-data.md) — Materials, UoM, Suppliers.
