# Dayflow HRMS — BE-2 Module

This repository contains the backend implementation for **BE-2** of the **Dayflow HRMS** system.

---

## 1. Overview & Modules Owned

The BE-2 slice owns:
- **Attendance Module**: 4-state computed status (`PRESENT`, `HALF_DAY`, `ON_LEAVE`, `ABSENT`), check-in, check-out, and daily/weekly/monthly uniform views.
- **Leave / Time-Off Module**: Request creation with employee remarks, atomic approval workflow (decrementing allocations in a DB transaction), rejection validation requiring decision comments, attachment validation, and overlap checks.
- **Leave Allocation Module**: Per-employee, per-leave-type balance editor.
- **Salary Engine & Deductions**: Single pure calculation engine deriving Yearly Wage, Basic, HRA, Bonus/LTA, Fixed Allowance remainder, Employee & Employer PF (12%), Professional Tax (₹200), Gross, Net, and Payable Salary.
- **Payroll & Admin Dashboard**: Aggregated monthly payroll reporting (`GET /payroll`, `GET /payroll/:employeeId`) driven by the shared salary engine and attendance-to-payroll feed.
- **Role-Based Access Control & Security**: Strict JWT and role verification (`ADMIN_HR` vs `EMPLOYEE`), self read-only salary access, XSS sanitization, and MIME-validated file uploads.

---

## 2. Key Policies & Architectural Decisions

### Half-Day Payable-Day Policy
- **Policy**: Each half-day worked counts as **0.5 payable day** in monthly payroll calculation (`payableDays = presentDays + (halfDays * 0.5) + approvedPaidLeaveDays`).
- **Payable Salary Formula**:
  $$\text{Payable Salary} = \text{Net Salary} \times \left( \frac{\text{Payable Days}}{\text{Total Working Days}} \right)$$

### Half-Day Threshold
- **Default `halfDayThresholdHours`**: **4.0 hours** (configurable per employee on the `Salary` model).
- **Attendance Status Priority** (computed dynamically on every read, never stored statically):
  1. Approved `LeaveRequest` covering the date $\rightarrow$ `ON_LEAVE`
  2. No check-in for the date $\rightarrow$ `ABSENT`
  3. Work hours (or elapsed time if active) below `halfDayThresholdHours` $\rightarrow$ `HALF_DAY`
  4. Work hours $\ge$ `halfDayThresholdHours` $\rightarrow$ `PRESENT`

### Single Unified Calculation Engine (Zero Drift)
- Per-employee salary views (`GET /employees/:id/salary`), salary updates (`PUT /employees/:id/salary`), and Admin Payroll reports (`GET /payroll`, `GET /payroll/:employeeId`) all utilize the exact same calculation function in [`src/services/salaryEngine.service.ts`](file:///c:/Users/aakas/OneDrive/Desktop/Hackather/src/services/salaryEngine.service.ts).
- No secondary calculation paths exist, guaranteeing zero drift between individual salary sheets and company-wide payroll reporting.

---

## 3. Setup & Running Instructions

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Synchronize database schema (SQLite by default, or PostgreSQL via DATABASE_URL)
npx prisma db push

# 4. Seed database with Admin, Employees, Attendance, Leaves, and Salary configs
npm run db:seed

# 5. Start development server
npm run dev
```

The server starts at `http://localhost:5000`.

### Running Acceptance Tests
To run the automated acceptance test suite covering all 19 functional and security scenarios:
```bash
npm test
```

---

## 4. Seed / Demo Accounts

| Role | Email | Password | Employee Code | Department | Monthly Wage |
|---|---|---|---|---|---|
| **Admin/HR** | `admin@dayflow.com` | `Password123!` | `ADM001` | HR | — |
| **Employee** | `john.doe@dayflow.com` | `Password123!` | `EMP001` | Engineering | ₹80,000 |
| **Employee** | `jane.smith@dayflow.com` | `Password123!` | `EMP002` | Product Design | ₹65,000 |
| **Employee** | `alex.kumar@dayflow.com` | `Password123!` | `EMP003` | Sales | ₹50,000 |

---

## 5. API Reference

### Attendance (`/attendance`)
- `POST /attendance/check-in` — Authenticated (self). Rejects duplicates on the same date.
- `POST /attendance/check-out` — Authenticated (self). Computes `workHours` and `extraHours`.
- `GET /attendance/my?view=daily|weekly|monthly` — Authenticated (self). Returns uniform row schema.
- `GET /attendance?view=daily|weekly|monthly` — Admin/HR only. Supports search, department, and date filters.

### Time-Off / Leaves (`/time-off`)
- `POST /time-off` — Authenticated (self). Accepts `leaveTypeId`, `startDate`, `endDate`, `remarks`, `attachment`. Computes duration server-side, validates against overlap and available allocation.
- `GET /time-off/my` — Authenticated (self). Returns personal requests and leave allocations.
- `GET /time-off` — Admin/HR only. Lists all requests with optional status/department filters.
- `PUT /time-off/:id/approve` — Admin/HR only. Optional `decisionComment`. Atomically decrements allocation and sets status to `APPROVED`.
- `PUT /time-off/:id/reject` — Admin/HR only. **Requires** `decisionComment`. Returns `400` with `"A rejection comment is required."` if omitted.

### Leave Allocations (`/leave-allocation`)
- `GET /leave-allocation` — Admin/HR only. Lists allocations across employees.
- `PUT /leave-allocation` — Admin/HR only. Updates employee leave balance.

### Salary (`/employees/:id/salary`)
- `GET /employees/:id/salary` — Read-only for self (Employee) or full for Admin/HR.
- `PUT /employees/:id/salary` — Admin/HR only. Rejects Employee attempts with `403`. Validates components $\le$ `monthlyWage`.

### Payroll Dashboard (`/payroll`)
- `GET /payroll` — Admin/HR only. Query params: `month`, `year`, `department`, `employee`. Returns summary metrics and employee breakdown rows.
- `GET /payroll/:employeeId` — Admin/HR only. Query params: `month`, `year`. Returns granular payroll calculation drill-down.

### Leave Attachment Upload (`/upload`)
- `POST /upload/leave-attachment` — Authenticated. Validates MIME type (PDF, JPEG, PNG) and file size ($\le 5\text{MB}$).

---

## 6. Exact Error Strings Enforced

- **Overlapping leave**: `Selected dates overlap with an existing leave request.`
- **Insufficient leave**: `You do not have enough leave allocation.`
- **Unauthorized action**: `You do not have permission to perform this action.`
- **Salary exceeds wage**: `Salary components cannot exceed the configured wage.`
- **Rejection missing comment**: `A rejection comment is required.`
- **Invalid document/attachment**: `Unsupported file type or file too large.`

---

## 7. Deviations

- **BE-1 Stubs**: To allow standalone execution without BE-1's codebase, minimal stubs for `User` and `Employee` models along with a minimal `POST /auth/login` endpoint were included in [`src/controllers/auth.controller.ts`](file:///c:/Users/aakas/OneDrive/Desktop/Hackather/src/controllers/auth.controller.ts) marked with `// STUB: replace with BE-1's real implementation`.
- **Zero Schema or Formula Deviations**: All field names (`remarks`, `decisionComment`, `halfDayThresholdHours`), exact error copy, and calculation equations adhere strictly to the BE-2 specification without deviation.
