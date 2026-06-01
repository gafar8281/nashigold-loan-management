# Gold Loan Management System — Project Brief

## What This Project Does
A web application for managing gold-collateral loans at a branch. Customers pledge gold in exchange for a loan. The system tracks loans from creation through repaysal, handles interest and late-fee calculations, manages customer records, and provides reporting for branch staff.

---

## Tech Stack
- **Framework**: React (Vite)
- **UI Library**: shadcn/ui (already installed)
- **Styling**: Tailwind CSS
- **State**: React useState / useContext (no external state lib needed)
- **Data**: Mock/demo data only — no backend or API calls
- **Routing**: React Router DOM

## Run Commands
```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint check
```

---

## Folder Structure
```
src/
  components/       # Reusable UI components (shadcn + custom)
  pages/            # Route-level pages
  data/             # Mock data files (customers, loans)
  hooks/            # Custom React hooks
  lib/              # Utility functions (calculations, formatters)
  context/          # App-wide state (auth, loans, customers)
```

---

## Pages & Routes
| Route | Page | Notes |
|---|---|---|
| `/login` | Login | Email + Password |
| `/signup` | Signup | Email + Branch + Password |
| `/` | Dashboard | Summary cards + stats |
| `/customers` | Customer List | Search, add, view |
| `/customers/:id` | Customer Detail | Profile + loan history |
| `/loans` | Loan List | Filter by status |
| `/loans/new` | New Loan | Form + approval modal |
| `/loans/:id` | Loan Detail | View + update payment |
| `/reports` | Reports | Tabbed report views |

---

## Data Models

### Customer
```js
{
  id: "CUST-0001",          // auto-generated
  fullName: "Ahmed Al-Farsi",
  idNumber: "1234567890",
  idProofUrl: "/mock/id.jpg",
  dateOfBirth: "1985-03-15",
  mobile: "+966501234567",
  createdAt: "2024-01-10"
}
```

### Loan
```js
{
  id: "LOAN-0001",
  customerId: "CUST-0001",
  periodFrom: "2024-01-15",
  periodTo: "2024-07-15",
  termMonths: 6,             // auto-calculated
  loanAmount: 1000,
  goldWeight: 50,            // grams
  interestRate: 5,           // percentage
  lateFee: 0,
  amountPaid: 0,
  interestAmount: 50,        // loanAmount × interestRate / 100
  totalRepayment: 1050,      // loanAmount + interest + lateFee
  remainingBalance: 1050,    // totalRepayment - amountPaid
  status: "Active",          // Pending Approval | Approved | Active | Closed | Overdue
  approvalNotes: "",
  createdAt: "2024-01-15"
}
```

---

## Calculation Logic

### Interest
```js
interestAmount = loanAmount × (interestRate / 100)
```

### Total Repayment
```js
totalRepayment = loanAmount + interestAmount + lateFee
```

### Remaining Balance
```js
remainingBalance = totalRepayment - amountPaid
```

### Term (months)
```js
termMonths = Math.round((periodTo - periodFrom) / (1000 * 60 * 60 * 24 * 30))
```

### Late Fee
```js
// Apply if today > periodTo and loan not Closed
// Late fee = flat amount set per loan, or can be % of remaining balance
// Keep simple: mark status as "Overdue" automatically
```

### Overdue Status (auto)
```js
if (today > periodTo && status !== "Closed") status = "Overdue"
```

---

## Feature Details

### Customer Management
- List page with search by name, ID number, or customer number
- Add Customer form (all fields required except ID proof upload — mock it)
- Edit Customer inline or in modal
- Customer detail page showing profile + full loan history table

### Loan Management
- Create loan form linked to existing customer (search/select customer)
- Before saving → show **Approval Modal** with full summary
- Approval Modal actions: Approve / Reject / Add notes
- Only approved loans proceed to "Active"
- Payment tracking: enter amount paid → recalculate remaining balance
- Auto-detect Overdue based on date comparison

### Approval Modal Contents
- Customer name + ID
- Gold weight
- Loan amount
- Term (months)
- Interest amount
- Total repayment
- Approve / Reject buttons + notes textarea

### Dashboard Cards
- Total Active Loans (count + total SAR amount)
- Total Closed Loans
- Total Overdue Loans
- Pending Approvals
- Total Loan Portfolio (SAR)

### Reports (tabbed)
1. Active Loans — table of all active loans
2. Overdue Loans — with days overdue
3. Closed Loans — with repayment date
4. Customer Transaction History — by customer
5. Branch Summary — aggregate stats

### Authentication (mock)
- Login with any email/password → store in localStorage or context
- Signup stores new user to mock state
- Redirect to dashboard after login
- Protected routes (redirect to /login if not authenticated)

---

## Coding Conventions
- Use shadcn/ui components as the foundation (Button, Card, Dialog, Table, Badge, Input, Select, etc.)
- Keep components small and focused — one responsibility per file
- Use TypeScript-style JSDoc comments for complex functions
- Format currency as SAR with `toLocaleString('en-SA')`
- Format dates as DD/MM/YYYY for display
- Loan status badges: color-coded (Active=green, Overdue=red, Pending=yellow, Closed=gray, Approved=blue)
- No external chart libraries needed — use simple stat cards for dashboard
- Keep all mock data in `src/data/` as JS files, not hardcoded in components

---

## Mock Data Seed
Include at least:
- 5 customers
- 8 loans across different statuses (Active, Overdue, Closed, Pending Approval)
- At least 1 overdue loan (periodTo in the past)
- At least 1 pending approval

---

## Important Notes
- This is demo/mock data only — no API integration needed
- Keep the UI clean, professional, and easy to navigate
- Arabic names and SAR currency are expected in the data
- All amounts in SAR (Saudi Riyal)
- Mobile-responsive layout is a bonus but not required
