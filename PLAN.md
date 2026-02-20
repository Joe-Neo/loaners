# Loaner Laptop Management System — Implementation Plan

## Context

A school IT department needs a system to manage daily loaner laptop checkout and return. Students request loaners via a kiosk (e.g. iPad), IT staff fulfill requests by scanning device QR codes from their phone or desktop, and the system tracks the full lifecycle. This is for a single school with 50-100 loaner devices.

## Requirements Summary

| Requirement | Detail |
|-------------|--------|
| **Student identification** | Barcode scan from student ID card (primary), email lookup (fallback) |
| **Device identification** | QR codes generated from existing device IDs |
| **Loan categories** | Configurable categories (e.g. "Forgot laptop" = 1 day, "Hardware repair" = 1 week) with IT override |
| **Workflow** | Student requests → IT assigns a specific device by scanning → Return by scanning |
| **Dashboard** | Real-time view: checked out, available, overdue |
| **Notifications** | Email reminders for due dates and overdue alerts |
| **Hosting** | Flexible — design for easy deployment anywhere |

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React + TypeScript (Vite) | Modern, lightweight, widely supported |
| **Backend** | Express.js + TypeScript | Simple, industry-standard Node.js framework |
| **Database** | MySQL | Per user preference |
| **ORM** | Prisma | Type-safe, great MySQL support, easy migrations |
| **Barcode/QR scanning** | html5-qrcode library | Works in browser on mobile and desktop, uses device camera |
| **QR code generation** | qrcode npm package | Generate printable QR labels for devices |
| **Email** | Nodemailer | Lightweight, works with any SMTP provider |
| **Styling** | Tailwind CSS | Responsive design for kiosk, mobile, and desktop |

## Project Structure

```
loaners/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Shared UI components
│   │   ├── pages/
│   │   │   ├── Kiosk/       # Student-facing kiosk view
│   │   │   ├── Staff/       # IT staff dashboard & scanning
│   │   │   └── Admin/       # Device/category management
│   │   ├── hooks/           # Custom React hooks (useScanner, etc.)
│   │   ├── api/             # API client functions
│   │   └── App.tsx
│   └── index.html
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/       # Auth, error handling
│   │   ├── email/           # Email templates & sending
│   │   └── index.ts
│   └── prisma/
│       └── schema.prisma    # Database schema
├── package.json             # Root workspace config
└── README.md
```

## Database Schema (Core Tables)

**students** — id, student_id (barcode value), first_name, last_name, email, grade, created_at

**devices** — id, device_id (existing asset ID), status (available | checked_out | maintenance | retired), make, model, notes, created_at

**loan_categories** — id, name, default_duration_days, description, is_active

**loans** — id, student_id (FK), device_id (FK), category_id (FK), checked_out_at, due_at, returned_at, status (pending | active | returned | overdue), notes, checked_out_by (IT staff)

**staff** — id, name, email, pin (simple auth for IT staff), role (staff | admin)

## Key Screens & Workflows

### 1. Student Kiosk (iPad / browser)
- Large, touch-friendly UI
- Student scans their ID barcode or types email to identify themselves
- Selects a loan category (e.g. "Forgot laptop", "Device repair")
- Submits request → sees confirmation "Your request has been submitted, please see IT"
- Request appears in IT staff queue

### 2. IT Staff Dashboard (mobile / desktop)
- Login with email + PIN (simple, no SSO complexity)
- **Pending requests** queue — shows student name, category, time requested
- To fulfill: tap a request → camera opens → scan device QR code → loan is created
- **Active loans** view — all currently checked-out devices with due dates
- **Return flow** — scan any device QR → if checked out, prompts to confirm return → loan closed
- **Overdue** view — highlighted items past due date

### 3. Admin Panel (desktop)
- Manage devices (add, edit, retire, bulk import)
- Manage loan categories (name, default duration)
- Manage staff accounts
- Generate & print QR code labels for devices
- View dashboard stats (available count, checked out, overdue)

### 4. Email Notifications
- Checkout confirmation to student (device info, due date)
- Due date reminder (morning of due date)
- Overdue alert to student and IT staff
- Triggered by a simple scheduled job (cron or setInterval)

## Implementation Phases

### Phase 1: Foundation
1. Initialize monorepo with Vite (client) + Express (server) + TypeScript
2. Set up Prisma with MySQL, define schema, run initial migration
3. Seed database with sample data (students, devices, categories)
4. Basic API routes: CRUD for students, devices, categories, loans
5. Basic frontend shell with routing (React Router)

### Phase 2: Core Workflow
6. Student kiosk page — barcode scanning + email fallback + category selection + request submission
7. IT staff dashboard — pending requests queue
8. Checkout flow — scan device QR to assign to pending request
9. Return flow — scan device QR to close active loan
10. Real-time dashboard stats (available/checked out/overdue counts)

### Phase 3: Management & Polish
11. Admin panel — device management + bulk import
12. Admin panel — loan category management
13. Admin panel — staff management
14. QR code generation & printable labels for devices
15. Responsive design pass — ensure kiosk (iPad), mobile (phone), and desktop all work well

### Phase 4: Notifications & Overdue
16. Email service setup (Nodemailer + templates)
17. Checkout confirmation emails
18. Scheduled job for due-date reminders and overdue detection
19. Overdue status auto-update and alerts

## Verification Plan

1. **Database**: Run Prisma migrations, verify tables created in MySQL
2. **API**: Test all CRUD endpoints with sample requests
3. **Kiosk flow**: Open kiosk page on iPad/mobile browser → scan student barcode → submit request → verify it appears in IT queue
4. **Checkout flow**: From IT dashboard → tap request → scan device QR → verify loan is created and device status updates
5. **Return flow**: Scan device QR → verify loan is closed and device is available again
6. **Dashboard**: Verify counts update in real-time after checkout/return
7. **Email**: Verify checkout confirmation and overdue alert emails are sent
8. **Responsive**: Test on iPad (kiosk), phone (IT staff), and desktop (admin)

## Future Considerations (Out of Scope for V1)
- Condition tracking on checkout/return (damage notes)
- Acceptable Use Policy acknowledgment
- Integration with school SIS (Student Information System)
- SSO authentication for students
- Inventory reporting and analytics
