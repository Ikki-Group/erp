# ERD: HR

Employees, Shift Scheduling, Attendance, Payroll, Leave.

## Mermaid

```mermaid
erDiagram
    EMPLOYEES {
        int id PK
        string employee_no UK
        int user_id FK
        string name
        string position
        int primary_location_id FK
        string employment_type
        decimal base_salary
        string status "active | terminated"
    }
    SHIFT_TEMPLATES {
        int id PK
        string name
        int location_id FK
        time start_time
        time end_time
    }
    SHIFT_ASSIGNMENTS {
        int id PK
        int employee_id FK
        int shift_template_id FK
        date date
        string status "scheduled | completed | absent"
    }
    ATTENDANCES {
        int id PK
        int employee_id FK
        date date
        timestamp clock_in
        timestamp clock_out
        string status "present | late | absent | leave"
        int location_id FK
    }
    PAYROLL_RUNS {
        int id PK
        string period
        int location_id FK
        string status "draft | calculated | approved | paid"
        decimal total_amount
    }
    PAYSLIPS {
        int id PK
        int payroll_run_id FK
        int employee_id FK
        decimal base_salary
        decimal deductions
        decimal overtime
        decimal bonus
        decimal net_salary
    }
    LEAVES {
        int id PK
        int employee_id FK
        string type "annual | sick | unpaid"
        date start_date
        date end_date
        string status "pending | approved | rejected"
    }

    LOCATIONS ||--o{ EMPLOYEES : "primary"
    LOCATIONS ||--o{ SHIFT_TEMPLATES : "defines"
    EMPLOYEES ||--o{ SHIFT_ASSIGNMENTS : "assigned"
    SHIFT_TEMPLATES ||--o{ SHIFT_ASSIGNMENTS : "scheduled"
    EMPLOYEES ||--o{ ATTENDANCES : "records"
    PAYROLL_RUNS ||--|{ PAYSLIPS : "contains"
    EMPLOYEES ||--o{ PAYSLIPS : "receives"
    EMPLOYEES ||--o{ LEAVES : "requests"
```

[Open/Edit diagram](https://l.mermaid.ai/9aFv2W)

## Diagram

```
[employees]
  PK id
  UK employee_no
  FK user_id - - → users (nullable)
  -- name, phone, email
  -- position
  FK primary_location_id ── locations
  -- employment_type (full_time/part_time/contract)
  -- join_date, end_date
  -- base_salary numeric(18,2)
  -- bank_name, bank_account
  -- status (active/inactive/terminated)
  -- audit stamps


[shift_templates]
  PK id
  -- name
  FK location_id ────── locations
  -- start_time, end_time
  -- is_active


[shift_assignments]
  PK id
  FK employee_id ────── employees
  FK shift_template_id ── shift_templates
  -- date
  -- status (scheduled/completed/absent/swapped)
  UK (employee_id, date)


[attendances]
  PK id
  FK employee_id ────── employees
  -- date
  -- clock_in, clock_out
  -- status (present/late/absent/leave/sick)
  FK location_id ────── locations
  -- notes
  FK shift_assignment_id - - → shift_assignments
  UK (employee_id, date)


[payroll_runs]                   [payslips]
  PK id                            PK id
  -- period (YYYY-MM)              FK payroll_run_id ── payroll_runs (CASCADE)
  FK location_id - - → locations   FK employee_id ────── employees
  -- status (draft/calculated/     -- base_salary, working_days,
       approved/paid)                 attendance_days, late_days,
  FK calculated_by ── users           absent_days, deductions,
  FK approved_by - - → users         overtime, allowances, bonus,
  -- paid_at, total_amount            net_salary numeric(18,2)
  -- audit stamps


[leaves]
  PK id
  FK employee_id ────── employees
  -- type (annual/sick/unpaid/other)
  -- start_date, end_date
  -- status (pending/approved/rejected)
  FK approved_by - - → users
  -- reason
  -- audit stamps
```

## Notes

- `employees.user_id` nullable — not all staff need system access.
- `shift_assignments` unique on (employee_id, date) prevents double-booking.
- Shift assignments can be at any location (not just primary).
- Payslip amounts frozen after approval.
- Approved leave auto-creates attendance records.

---

**Next:** [crm.md](./crm.md) — Customers, Loyalty.
