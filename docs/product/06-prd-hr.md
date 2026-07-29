# PRD: HR

Specifications for the Human Resources module — employee management, attendance, and basic payroll.

## Purpose

Track employees, work schedules, attendance, and calculate payroll. Integrates with Finance for salary journal entries.

## Employee

### Entity fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| code | string | Employee ID |
| name | string | Full name |
| email | string? | Email |
| phone | string? | Phone |
| position | string | Job title |
| department | enum | `kitchen`, `service`, `management`, `finance`, `logistics` |
| locationId | FK | Primary work location |
| joinDate | date | Start date |
| status | enum | `active`, `resigned`, `terminated` |
| bankName | string? | For salary transfer |
| bankAccount | string? | Account number |
| salaryType | enum | `monthly`, `daily`, `hourly` |
| baseSalary | decimal | Base compensation |

### Business rules

- Employee code is unique and immutable.
- Resigned/terminated employees are soft-deleted (preserves payroll history).
- An employee must be linked to a user account for system access (optional — not all employees are users).

## Attendance

### Entity fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| employeeId | FK | Which employee |
| date | date | Work date |
| clockIn | timestamp? | Check-in time |
| clockOut | timestamp? | Check-out time |
| status | enum | `present`, `absent`, `late`, `leave`, `holiday` |
| overtimeHours | decimal | Extra hours worked |
| notes | string? | Reason for absence/leave |

### Key features

- Manual entry by manager or self-service clock-in (future: biometric).
- Automatic late detection based on configurable shift start time.
- Leave tracking: annual, sick, unpaid.
- Overtime calculation based on hours beyond standard shift.

### Business rules

- One attendance record per employee per date.
- Clock-out must be after clock-in.
- Overtime requires manager approval (future).

## Payroll

### Entity fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| employeeId | FK | Which employee |
| periodMonth | integer | Payroll month |
| periodYear | integer | Payroll year |
| workDays | integer | Days worked |
| overtimeHours | decimal | Total overtime in period |
| baseSalary | decimal | Gross base |
| overtimePay | decimal | Overtime compensation |
| allowances | decimal | Meal, transport, etc. |
| deductions | decimal | Absences, advances, etc. |
| netSalary | decimal | Final amount to pay |
| status | enum | `draft`, `approved`, `paid` |

### Key features

- Monthly payroll run: auto-calculate from attendance data.
- Configurable allowance and deduction components.
- Payroll approval workflow (draft → approved → paid).
- Payment creates journal entry (debit: salary expense, credit: cash/bank).
- Payslip generation (PDF — future).

### Business rules

- Cannot run payroll for a month before the month ends.
- Approved payroll cannot be modified (void and re-create).
- Payroll respects employee salary type (monthly = fixed, daily/hourly = based on attendance).

## Salary components

| Component | Type | Calculation |
| --------- | ---- | ----------- |
| Base salary | Earning | Fixed or (rate × days/hours) |
| Overtime | Earning | overtimeHours × overtimeRate |
| Meal allowance | Earning | workDays × dailyMealRate |
| Transport | Earning | workDays × dailyTransportRate |
| Absence deduction | Deduction | absentDays × dailyRate |
| Advance | Deduction | Manual entry (salary advance) |

---

**Next:** [07-prd-integrations.md](./07-prd-integrations.md) — External integrations.
