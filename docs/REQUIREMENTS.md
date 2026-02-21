# Loaner Laptop Management System — Requirements

## 1. Problem Statement

The school IT department manages a fleet of 50-100 loaner laptops issued to students when their personal devices are unavailable — forgotten at home, in for repair, etc. The current process relies on manually creating and closing Freshservice tickets for each checkout and return. This causes:

- **Data entry errors.** Staff must type student names, device asset tags, and loan details into ticket fields by hand. Misspellings, wrong asset tags, and incomplete records are common.
- **Slow throughput during peak periods.** Before first period and after lunch, lines form at the IT window while staff navigate the Freshservice UI to create tickets. Each checkout takes 2-3 minutes.
- **Poor overdue visibility.** There is no dashboard or automated alert for overdue devices. Staff must manually search through open tickets to identify which laptops are late.
- **Clunky reporting.** Generating reports on device utilization, common loan reasons, or repeat borrowers requires exporting and manually filtering Freshservice ticket data.
- **No self-service option.** Every interaction requires an IT staff member, even for straightforward checkouts and returns.

## 2. User Roles

### Student
- Interacts only through the Kiosk (a tablet or dedicated machine in the IT area)
- Checks out a loaner laptop by scanning their student ID and a device
- Returns a loaner laptop by scanning the device
- No account or login required — identity comes from their student ID barcode

### IT Staff
- Logs into Agent Mode with email + PIN
- Views the dashboard (available/checked-out/overdue/maintenance counts)
- Browses and searches active loans, overdue loans, and loan history
- Exports loan data as CSV
- Sends overdue reminder emails to students
- Can process returns from Agent Mode (e.g., when a student drops off a laptop directly)

### IT Admin
- Has all IT Staff capabilities
- Manages the device inventory (add, edit, change status, bulk CSV import)
- Manages loan categories (add, edit, activate/deactivate)
- Manages staff accounts (add, edit, change roles, deactivate)
- Generates asset labels (QR codes) for devices

## 3. Kiosk Mode

Kiosk Mode is a full-screen, touch-friendly interface designed for a tablet or dedicated machine sitting on the IT counter. Physical access to the kiosk is the security boundary — no login is required to use it.

### 3.1 Home Screen

Two large buttons:
- **Check Out** — start the checkout flow
- **Return** — start the return flow

### 3.2 Checkout Flow (Scan-Scan-Done)

1. **Scan student ID.** The kiosk activates the camera and prompts the student to hold their ID badge up. The barcode is read and the student record is looked up. The student's name is displayed for confirmation.
   - If the student is not found, display an error and prompt to try again or see IT staff.
2. **Scan device.** The student picks up a loaner from the shelf and scans its asset tag barcode. The system verifies the device exists and is in AVAILABLE status.
   - If the device is not available (already checked out, in maintenance, or retired), display an error and prompt to pick a different device.
3. **Select category.** The student taps the reason for the loan from a list of active categories (e.g., "Forgot laptop", "Hardware repair", "Software issue"). The due date is computed from the category's default duration.
4. **Confirm.** A summary screen shows: student name, device asset tag, loan reason, and due date. The student taps "Confirm" to complete.
5. **Success.** A confirmation screen displays the loan details and due date. After 10 seconds, the kiosk automatically resets to the home screen.

### 3.3 Return Flow

1. **Scan device.** The student scans the device's asset tag barcode. The system finds the active loan for that device.
   - If no active loan exists for the device, display an error.
2. **Confirm.** A summary shows the student name, device, and loan duration. The student taps "Confirm."
3. **Success.** A confirmation screen. After 10 seconds, auto-reset to home.

### 3.4 Kiosk UX Requirements

- Large touch targets (minimum 48px)
- High-contrast text and clear visual hierarchy
- Auto-reset to home screen after 30 seconds of inactivity during a flow, or 10 seconds on the success screen
- No keyboard input required — all interaction via scanning and tapping
- Camera preview visible during scanning steps
- Clear error messages with guidance on what to do next

## 4. Agent Mode

Agent Mode is a responsive web interface for IT staff and admins. Access requires logging in with an email and PIN.

### 4.1 Authentication

- Staff log in with their email address and a numeric PIN (not a password)
- The server issues a JWT on successful login
- The JWT is included in all subsequent API requests
- Sessions expire after a configurable duration (default: 8 hours)

### 4.2 Dashboard

The landing page after login. Displays:
- **Available devices** count
- **Checked-out devices** count
- **Overdue devices** count (highlighted/red)
- **Devices in maintenance** count

Each count links to the relevant filtered view.

### 4.3 Active Loans

A sortable, filterable table of all currently active loans. Columns:
- Student name
- Student ID
- Device asset tag
- Device make/model
- Category
- Checked out at (date/time)
- Due at (date/time)
- Duration (computed: time since checkout, displayed as "Xd Xh" or similar)
- Status (ACTIVE / OVERDUE)

Features:
- Sort by any column
- Filter by status (active/overdue), category, or search by student name / device asset tag
- **CSV export** of the current filtered view
- Click a row to see loan detail

### 4.4 Overdue Loans

A filtered view of the Active Loans table showing only overdue items. Additional features:
- **Send reminder** button per row — sends an email to the student
- **Send all reminders** button — sends emails to all overdue students
- Visual indicator of how many days overdue

### 4.5 Loan History

A paginated table of all loans (including returned). Additional columns:
- Returned at (date/time)
- Total duration

Supports the same sorting, filtering, and search as Active Loans.

### 4.6 Device Management (Admin Only)

A table of all devices with columns: asset tag, make, model, serial number, status, notes.

Features:
- Add a single device
- Edit device details (make, model, serial number, notes)
- Change device status (available, maintenance, retired)
- **Bulk CSV import** — upload a CSV with columns: asset_tag, make, model, serial_number, notes
- **Generate label** — produce a QR code for the device's asset tag (printable)

### 4.7 Category Management (Admin Only)

A table of loan categories: name, default duration (days), description, active/inactive.

Features:
- Add a category
- Edit category details
- Activate/deactivate a category (inactive categories don't appear in the kiosk)

### 4.8 Staff Management (Admin Only)

A table of staff accounts: name, email, role (STAFF/ADMIN), active/inactive.

Features:
- Add a staff member (name, email, PIN, role)
- Edit staff details
- Change role (STAFF ↔ ADMIN)
- Deactivate/reactivate a staff member (deactivated staff cannot log in)

## 5. Notifications

### 5.1 Overdue Reminders

- IT staff can manually trigger reminder emails for individual students or all overdue students from the Overdue Loans view
- Email includes: student name, device asset tag, checkout date, due date, days overdue, and instructions to return the device to IT
- A background scheduler runs daily and sends automatic reminder emails for loans that are overdue (configurable: enabled/disabled, time of day)

### 5.2 Email Configuration

- SMTP settings configured via environment variables (host, port, user, password, from address)
- Emails sent via Nodemailer

## 6. Non-Functional Requirements

### 6.1 Progressive Web App (PWA)

- The application is installable as a PWA on tablets and desktops
- Service worker caches the app shell for offline-capable loading (the app still requires network for API calls)
- `manifest.json` with app name, icons (192x192, 512x512), theme color, and `display: standalone`
- Kiosk Mode is designed to run full-screen on a dedicated tablet

### 6.2 Docker Deployment

- The entire stack (frontend, backend, database) runs via `docker-compose up`
- MySQL data persists across container restarts via a Docker volume
- The server runs database migrations automatically on startup
- Environment variables configure database credentials, JWT secret, SMTP settings, etc.
- An `.env.example` file documents all required environment variables

### 6.3 Performance

- Kiosk checkout flow completes in under 5 seconds (excluding scan time)
- Barcode scanning initiates within 1 second of camera activation
- Agent Mode tables load within 2 seconds for up to 1,000 loan records

### 6.4 Responsive Design

- Agent Mode is usable on tablets and desktops (minimum 768px width)
- Kiosk Mode is optimized for a 10" tablet in landscape orientation
- Tailwind CSS for consistent styling

### 6.5 Security

- Agent Mode protected by JWT authentication
- Passwords (PINs) stored as bcrypt hashes
- Kiosk endpoints are unauthenticated — physical access to the kiosk device is the trust boundary
- No student PII beyond name, email, grade, and student ID
- Environment variables for all secrets (JWT secret, DB password, SMTP credentials)

## 7. Implementation Phases

### Phase 1: Foundation
1. Initialize monorepo with Vite (client) + Express (server) + TypeScript
2. Set up TypeORM with MySQL, define entities, run initial migration
3. Seed database with sample data (students, devices, categories, staff)
4. Basic API routes: CRUD for students, devices, categories, loans
5. Basic frontend shell with routing (React Router)

### Phase 2: Core Workflow
6. Kiosk checkout flow — scan student ID barcode → scan device → select category → confirm
7. Kiosk return flow — scan device → confirm return
8. Agent login (email + PIN → JWT)
9. Agent dashboard — available/checked-out/overdue/maintenance counts
10. Active loans view with sorting, filtering, and search

### Phase 3: Management & Polish
11. Device management (admin) — CRUD, bulk CSV import, QR label generation
12. Category management (admin) — CRUD, activate/deactivate
13. Staff management (admin) — CRUD, role assignment
14. CSV export of active/overdue loans
15. Overdue loans view with send-reminder functionality
16. Loan history with pagination
17. Responsive design pass — kiosk (tablet), agent (desktop/tablet)

### Phase 4: Notifications & Deployment
18. Email service setup (Nodemailer + SMTP configuration)
19. Manual overdue reminder emails (individual + bulk)
20. Scheduled job for automatic overdue detection and reminders
21. PWA configuration (service worker, manifest, icons)
22. Docker setup (Dockerfiles, docker-compose, nginx)

## 8. Verification Plan

1. **Database:** Run TypeORM migrations, verify all tables created in MySQL
2. **API:** Test all CRUD endpoints with sample requests
3. **Kiosk checkout flow:** Open kiosk on tablet/browser → scan student barcode → scan device → select category → verify loan created and device status updated
4. **Kiosk return flow:** Scan device → confirm → verify loan closed and device available
5. **Agent login:** Log in with email + PIN → verify JWT issued and dashboard loads
6. **Dashboard:** Verify counts update after checkout/return operations
7. **Active/overdue loans:** Verify tables load, sort, filter, and CSV export works
8. **Admin management:** Verify device/category/staff CRUD restricted to admin role
9. **Email:** Verify overdue reminder emails sent via configured SMTP
10. **PWA:** Verify installable on tablet, service worker caches app shell
11. **Docker:** Run `docker-compose up`, verify all services start and app is accessible on port 8080
12. **Responsive:** Test kiosk on tablet (landscape), agent on desktop and tablet

## 9. Future Considerations (Out of Scope for V1)

The following are explicitly **not** included in the initial release but may be considered for future versions:

- **Freshservice integration** — automatically create/close Freshservice tickets when loans are created/returned, preserving existing workflows during transition
- **Active Directory / SSO** — authenticate students against school AD for richer identity, or staff via SSO
- **Student self-service portal** — let students view their own loan history and due dates via a web portal
- **Reservation system** — let students or teachers reserve a loaner in advance
- **Mobile push notifications** — push reminders to students via the PWA
- **Damage reporting** — structured damage/condition reporting at return time
- **Analytics dashboard** — charts and trends for device utilization, peak times, common categories, repeat borrowers
- **Multi-site support** — manage loaner fleets across multiple school buildings
- **Audit log** — track all actions (who checked out, who returned, who modified records) with timestamps
- **Barcode printing integration** — direct integration with label printers for asset tag generation
