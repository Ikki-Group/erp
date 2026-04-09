# Human Resources & Payroll (HRIS)

The HRIS (Human Resources Information System) module (Layer 1/2) manages the entire employee lifecycle for Ikki Group, from attendance tracking to automated salary calculation. Given the shift-based nature of Baristas and Chefs, this module is highly customized for F&B staff operations.

## 1. Core Objectives

- **Shift & Attendance Management**: Stop relying on manual punch cards or basic fingerprint machines without context.
- **Automated Payroll**: Calculate exact take-home pay including hourly rates, overtime, late penalties, and service charge distribution.
- **Staff-to-Location Mapping**: Tie staff directly to their operational base (Ikki Coffee or Ikki Resto).

## 2. Key Features

### Employee Master Data

- Centralized database of all staff profiles (KTP, Bank Accounts, Contact Info, Join Date).
- **Position & Pay Grades**: Define job roles (Head Chef, Junior Barista, Cashier) and their corresponding base salaries or hourly wages.

### Time & Attendance

- **Shift Scheduling**: Outlet Managers can plan weekly shifts (e.g., Morning Shift: 07:00-15:00, Evening Shift: 15:00-23:00).
- **Clock-In / Clock-Out**: Employees log their attendance. The ERP flags anomalies (e.g., Clocking in 30 minutes late, or forgetting to clock out).
- **Geofencing/IP Lock**: Require staff to be connected to the Outlet's WiFi to successfully clock in via the ERP interface.

### Payroll Engine

- **Salary Computation**: Automatically combines `(Base Salary) + (Overtime) - (Late Penalties) - (Cash Advances/Kasbon)`.
- **Service Charge / Tip Splitting**: Integrates with the `Sales` module to calculate the total monthly service charge pool, and automatically splits it among eligible staff based on their attendance points or role weight.
- **Payslip Generation**: Generate digital PDF payslips for staff.

## 3. Technical Architecture (Proposed)

- **Access Control**: Relies heavily on the `IAM` module. A user logging in receives their HRIS profile, but only users with `HR_Admin` role can view other people's salaries.
- **Finance Integration**: Finalizing a Payroll batch automatically triggers a Journal Entry in the `Finance` module, mapping the exact Labor Cost to the monthly P&L.

## 4. Next Phase Recommendations

- **Self-Service Leave Requests**: A portal for staff to request Annual Leave or Sick Days via the ERP mobile view, routed to the manager for digital approval.
