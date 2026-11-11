# PRD: Human Resources

Specifications for Employee management, Shift scheduling, Attendance, Payroll, and Leave.

## Employee

### Fields

| Field             | Type    | Description                                |
| ----------------- | ------- | ------------------------------------------ |
| employeeNo        | string  | Unique employee number                     |
| userId            | FK?     | Linked system user (null if no app access) |
| name              | string  | Full name                                  |
| phone             | string? | Phone                                      |
| email             | string? | Email                                      |
| position          | string  | Job title (Barista, Chef, Kasir)           |
| primaryLocationId | FK      | Primary work location                      |
| employmentType    | enum    | `full_time`, `part_time`, `contract`       |
| joinDate          | date    | Start date                                 |
| endDate           | date?   | End date (null if active)                  |
| baseSalary        | decimal | Monthly base salary                        |
| bankName          | string? | For payroll transfer                       |
| bankAccount       | string? | Account number                             |
| status            | enum    | `active`, `inactive`, `terminated`         |

### Business Rules

- `employeeNo` is unique and immutable.
- Not all employees need system access (kitchen staff may not log in).
- An employee can work at multiple locations (assigned per shift).
- `primaryLocationId` is the default, but shifts can be at other locations.
- Termination preserves the record for payroll history.

## Shift Schedule

### Shift Template

| Field      | Type    | Description                           |
| ---------- | ------- | ------------------------------------- |
| name       | string  | Shift name ("Pagi", "Siang", "Malam") |
| locationId | FK      | Which location                        |
| startTime  | time    | e.g. 07:00                            |
| endTime    | time    | e.g. 15:00                            |
| isActive   | boolean | Active toggle                         |

### Shift Assignment

| Field           | Type | Description                                   |
| --------------- | ---- | --------------------------------------------- |
| employeeId      | FK   | Assigned employee                             |
| shiftTemplateId | FK   | Which shift                                   |
| date            | date | Specific date                                 |
| status          | enum | `scheduled`, `completed`, `absent`, `swapped` |

### Business Rules

- An employee can be assigned to shifts at any location (not just primary).
- No double-booking: one employee cannot have overlapping shifts on the same date.
- Shift assignments generate expected attendance records.

## Attendance

### Fields

| Field             | Type       | Description                                  |
| ----------------- | ---------- | -------------------------------------------- |
| employeeId        | FK         | Employee                                     |
| date              | date       | Attendance date                              |
| clockIn           | timestamp? | Actual clock in                              |
| clockOut          | timestamp? | Actual clock out                             |
| status            | enum       | `present`, `late`, `absent`, `leave`, `sick` |
| locationId        | FK         | Where they worked                            |
| notes             | string?    | Reason for absence/late                      |
| shiftAssignmentId | FK?        | Linked shift                                 |

### Business Rules

- `late` = clocked in after shift start + grace period (configurable, default 15 min).
- `absent` = no clock-in by end of shift.
- One attendance record per employee per date.
- Can be entered manually by manager (for staff without app access).
- Monthly summary drives payroll calculations.

## Payroll

### Payroll Run

| Field        | Type       | Description                               |
| ------------ | ---------- | ----------------------------------------- |
| period       | string     | YYYY-MM                                   |
| locationId   | FK?        | Per-location or all (null = company-wide) |
| status       | enum       | `draft`, `calculated`, `approved`, `paid` |
| calculatedBy | FK         | User who ran calculation                  |
| approvedBy   | FK?        | Approver                                  |
| paidAt       | timestamp? | When paid                                 |
| totalAmount  | decimal    | Sum of all payslips                       |

### Payslip

| Field          | Type    | Description                  |
| -------------- | ------- | ---------------------------- |
| payrollRunId   | FK      | Parent run                   |
| employeeId     | FK      | Employee                     |
| baseSalary     | decimal | Monthly base (frozen)        |
| workingDays    | integer | Total working days in period |
| attendanceDays | integer | Days present                 |
| lateDays       | integer | Days late                    |
| absentDays     | integer | Days absent                  |
| deductions     | decimal | Absence + late deductions    |
| overtime       | decimal | Overtime pay                 |
| allowances     | decimal | Additional allowances        |
| bonus          | decimal | Performance/other bonus      |
| netSalary      | decimal | Final amount                 |

### Calculation Logic

```
netSalary = baseSalary
  - (baseSalary / workingDays × absentDays)
  - lateDeductions
  + overtime
  + allowances
  + bonus
```

### Business Rules

- Payroll runs monthly.
- `calculated` = computed but editable.
- `approved` = frozen, requires owner/manager.
- `paid` = disbursed → journal entry created (debit Beban Gaji, credit Kas/Bank).
- Payslip amounts frozen after approval — attendance edits don't retroactively change.

## Leave

### Fields

| Field      | Type    | Description                         |
| ---------- | ------- | ----------------------------------- |
| employeeId | FK      | Employee                            |
| type       | enum    | `annual`, `sick`, `unpaid`, `other` |
| startDate  | date    | First day                           |
| endDate    | date    | Last day                            |
| status     | enum    | `pending`, `approved`, `rejected`   |
| approvedBy | FK?     | Approver                            |
| reason     | string? | Reason                              |

### Business Rules

- Approved leave auto-creates attendance records with `leave` or `sick` status.
- Annual leave balance: configurable per employment type (default 12 days/year).
- Leave approval requires manager or owner role.

---

**Next:** [09-prd-crm.md](./09-prd-crm.md) — CRM module.
