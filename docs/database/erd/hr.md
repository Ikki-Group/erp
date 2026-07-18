# ERD: HR

```
[employees]                    [shifts]
+---------------------+        +------------------+
| PK id               |        | PK id            |
| * code (unique)     |        | * name           |
| * name              |        | * start/end_time |
|   email, phone      |        +------------------+
|   nik, npwp         |                |
|   job_title, dept   |                |
| * base_salary >= 0  |    [attendances]
|   FK user_id        |    +---------------------+
+---------------------+    | * FK employee_id    |
    |       |              | * FK location_id    |
    |       |              |   FK shift_id       |
    |       |              | * date              |
    |       |              |   clock_in/out      |
    |       |              | * status (present/absent/late/on_leave) |
    |       |              +---------------------+
    |       |
    |  [leave_requests]         [payroll_batches]
    |  +------------------+     +---------------------+
    +--| * FK employee_id |     | * name              |
    |  | * type (annual/  |     | * period_month [1-12]|
    |  |   sick/unpaid)   |     | * period_year       |
    |  | * status         |     | * status            |
    |  | * date_start/end |     | * total_amount >= 0 |
    |  |  (end >= start)  |     +---------------------+
    |  +------------------+             |
    |                          [payroll_items]
    |                          +---------------------+
    +--------------------------| * FK batch_id       |
                               | * FK employee_id    |
                               | * base_salary >= 0  |
                               | * adjustments_amt   |
                               | * total_amount >= 0 |
                               +---------------------+
                                       |
                               [payroll_adjustments]
                               +---------------------+
                               | * FK payroll_item   |
                               | * type (add/deduct) |
                               | * amount, reason    |
                               +---------------------+
```

## Key Rules

- `employees.user_id` links to IAM user (optional, set null on delete).
- Leave: `date_end >= date_start` (DB check constraint).
- Payroll: `period_month` must be 1-12 (DB check constraint).
