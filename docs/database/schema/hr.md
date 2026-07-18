# Schema: HR

Source: `hr.ts`

---

## `employees` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| code | text | NO | | unique |
| name | text | NO | | |
| email | text | YES | | |
| phone | text | YES | | |
| address | text | YES | | |
| nik | text | YES | | citizen ID |
| npwp | text | YES | | tax ID |
| job_title | text | YES | | |
| department | text | YES | | |
| base_salary | numeric(18,2) | NO | 0 | >= 0 |
| bank_account | text | YES | | |
| hire_date | timestamptz | YES | | |
| termination_date | timestamptz | YES | | |
| emergency_contact | text | YES | | |
| user_id | int | YES | | FK→users (set null) |

## `shifts` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| name | text | NO | | |
| start_time | time | NO | | |
| end_time | time | NO | | |
| note | text | YES | | |

## `attendances` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| employee_id | int | NO | | FK→employees (restrict) |
| location_id | int | NO | | FK→locations (restrict) |
| shift_id | int | YES | | FK→shifts (set null) |
| date | timestamptz | NO | now() | |
| clock_in | timestamptz | YES | | |
| clock_out | timestamptz | YES | | |
| status | enum | NO | present | present / absent / late / on_leave |
| note | text | YES | | |

## `payroll_batches` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| name | text | NO | | |
| period_month | int | NO | | check: [1, 12] |
| period_year | int | NO | | |
| status | enum | NO | draft | draft / approved / paid / cancelled |
| total_amount | numeric(18,2) | NO | 0 | >= 0 |
| note | text | YES | | |

## `payroll_items` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| batch_id | int | NO | | FK→payroll_batches (cascade) |
| employee_id | int | NO | | FK→employees (restrict) |
| base_salary | numeric(18,2) | NO | 0 | >= 0 |
| adjustments_amount | numeric(18,2) | NO | 0 | |
| service_charge_amount | numeric(18,2) | NO | 0 | |
| total_amount | numeric(18,2) | NO | 0 | >= 0 |
| note | text | YES | | |

## `payroll_adjustments` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| payroll_item_id | int | NO | | FK→payroll_items (cascade) |
| type | enum | NO | | addition / deduction |
| amount | numeric(18,2) | NO | 0 | |
| reason | text | NO | | |

## `leave_requests` (AF)

| Column | Type | Null | Default | Notes |
|--------|------|------|---------|-------|
| id | serial | NO | | PK |
| employee_id | int | NO | | FK→employees (cascade) |
| type | enum | NO | | annual / sick / unpaid / other |
| status | enum | NO | pending | pending / approved / rejected / cancelled |
| date_start | timestamptz | NO | | |
| date_end | timestamptz | NO | | check: end >= start |
| reason | text | NO | | |
| note | text | YES | | |
