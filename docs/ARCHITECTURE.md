# Loaner Laptop Management System — Architecture

## 1. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React + TypeScript (Vite) | Fast build tooling, strong typing, large ecosystem. Vite provides instant HMR during development and optimized production builds. |
| **PWA** | vite-plugin-pwa | Zero-config PWA support integrated into the Vite build pipeline. Generates service worker, manifest, and handles caching strategies. |
| **Backend** | Express.js + TypeScript | Lightweight, flexible HTTP framework. TypeScript provides type safety across the full stack. |
| **Database** | MySQL 8 | Reliable relational database, well-suited for structured loan/device/student data. Runs easily in Docker. |
| **ORM** | TypeORM | Chosen over Prisma for this project because: (1) decorators align naturally with class-based entity definitions, (2) migration workflow is straightforward for a Docker deployment where migrations run on container startup, (3) no separate schema file to keep in sync — entities are the source of truth, (4) mature MySQL support including enums and column naming. |
| **Scanning** | html5-qrcode | Browser-based barcode and QR code scanning via the device camera. Supports Code 128, Code 39, QR, and other common formats. No native app required. |
| **Label Generation** | qrcode (npm) | Server-side QR code generation for printable asset labels. |
| **Email** | Nodemailer | Standard Node.js email library. Connects to any SMTP server via environment configuration. |
| **Styling** | Tailwind CSS | Utility-first CSS framework. Enables rapid UI development with consistent design tokens. Purges unused styles in production. |
| **Containerization** | Docker + docker-compose | Single-command deployment of the full stack. Consistent environments across development and production. |

## 2. Project Structure

```
loaners/
├── docs/
│   ├── REQUIREMENTS.md              # What: requirements, workflows, user stories
│   └── ARCHITECTURE.md              # How: tech stack, schema, API, Docker, PWA
├── client/                          # React frontend (Vite + PWA)
│   ├── public/
│   │   └── icons/                   # PWA icons (192x192, 512x512)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Scanner.tsx          # Barcode/QR scanner (html5-qrcode wrapper)
│   │   │   ├── ConfirmationModal.tsx
│   │   │   └── Layout.tsx           # Shell layout with navigation
│   │   ├── pages/
│   │   │   ├── kiosk/
│   │   │   │   ├── KioskHome.tsx    # "Check Out" / "Return" choice
│   │   │   │   ├── KioskCheckout.tsx # Scan student → scan device → category → done
│   │   │   │   ├── KioskReturn.tsx  # Scan device → confirm → done
│   │   │   │   └── KioskSuccess.tsx # Confirmation with auto-reset timer
│   │   │   └── agent/
│   │   │       ├── AgentLogin.tsx
│   │   │       ├── AgentDashboard.tsx
│   │   │       ├── ActiveLoans.tsx  # Sort/filter/CSV export
│   │   │       ├── OverdueLoans.tsx # Filtered view + send reminders
│   │   │       ├── DeviceManagement.tsx  # Admin role only
│   │   │       ├── CategoryManagement.tsx # Admin role only
│   │   │       ├── StaffManagement.tsx   # Admin role only
│   │   │       └── LoanHistory.tsx
│   │   ├── hooks/
│   │   │   ├── useScanner.ts        # html5-qrcode lifecycle management
│   │   │   ├── useLoans.ts          # Loan data fetching and mutations
│   │   │   └── useAuth.ts           # JWT storage, login/logout, auth state
│   │   ├── api/                     # API client functions (fetch wrappers)
│   │   ├── types/index.ts           # Shared TypeScript interfaces
│   │   ├── App.tsx                  # Router and top-level providers
│   │   └── main.tsx                 # Entry point
│   ├── nginx.conf                   # SPA routing + /api reverse proxy
│   ├── vite.config.ts               # Includes vite-plugin-pwa configuration
│   ├── Dockerfile                   # Multi-stage: node build → nginx serve
│   └── package.json
├── server/
│   ├── src/
│   │   ├── entities/                # TypeORM entity classes
│   │   │   ├── Student.ts
│   │   │   ├── Device.ts
│   │   │   ├── LoanCategory.ts
│   │   │   ├── Loan.ts
│   │   │   └── Staff.ts
│   │   ├── migrations/              # TypeORM migration files
│   │   ├── routes/
│   │   │   ├── loans.ts             # checkout, return, active, overdue, csv, remind
│   │   │   ├── devices.ts           # CRUD + bulk import + label generation
│   │   │   ├── students.ts          # Lookup by barcode
│   │   │   ├── categories.ts        # CRUD
│   │   │   ├── staff.ts             # CRUD
│   │   │   ├── auth.ts              # login / me
│   │   │   └── dashboard.ts         # Aggregate stats
│   │   ├── services/
│   │   │   ├── loanService.ts       # Core checkout/return/query business logic
│   │   │   ├── emailService.ts      # Nodemailer wrapper
│   │   │   ├── csvService.ts        # CSV export generation
│   │   │   └── schedulerService.ts  # Cron job: overdue detection + auto-reminders
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verification middleware
│   │   │   ├── roleGuard.ts         # STAFF vs ADMIN role enforcement
│   │   │   └── errorHandler.ts      # Global error handling
│   │   ├── data-source.ts           # TypeORM DataSource configuration
│   │   └── index.ts                 # Express app bootstrap
│   ├── Dockerfile                   # Multi-stage: node build → node slim run
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml               # client + server + mysql services
├── .env.example                     # All required environment variables
├── .gitignore
└── package.json                     # Root: npm workspaces (client, server)
```

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│   students   │       │   devices    │       │ loan_categories  │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)          │
│ student_id   │◄──┐   │ asset_tag    │◄──┐   │ name             │
│ first_name   │   │   │ status       │   │   │ default_duration │◄──┐
│ last_name    │   │   │ make         │   │   │ description      │   │
│ email        │   │   │ model        │   │   │ is_active        │   │
│ grade        │   │   │ serial_number│   │   │ created_at       │   │
│ created_at   │   │   │ notes        │   │   └──────────────────┘   │
│ updated_at   │   │   │ created_at   │   │                          │
└──────────────┘   │   │ updated_at   │   │                          │
                   │   └──────────────┘   │                          │
                   │                      │                          │
                   │   ┌──────────────┐   │                          │
                   │   │    loans     │   │                          │
                   │   ├──────────────┤   │                          │
                   │   │ id (PK)      │   │                          │
                   └───│ student_id   │   │                          │
                       │ device_id    │───┘                          │
                       │ category_id  │──────────────────────────────┘
                       │ checked_out_at│
                       │ due_at       │
                       │ returned_at  │       ┌──────────────┐
                       │ status       │       │    staff     │
                       │ notes        │       ├──────────────┤
                       │ issued_via   │       │ id (PK)      │
                       │ created_at   │       │ name         │
                       │ updated_at   │       │ email        │
                       └──────────────┘       │ pin (hashed) │
                                              │ role         │
                                              │ is_active    │
                                              │ created_at   │
                                              │ updated_at   │
                                              └──────────────┘
```

### 3.2 Entities

#### Student

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | int | PK, auto-increment | Internal ID |
| student_id | varchar | unique, not null | Barcode value from student ID card |
| first_name | varchar | not null | |
| last_name | varchar | not null | |
| email | varchar | not null | School email for notifications |
| grade | varchar | nullable | Grade level |
| created_at | timestamp | auto | |
| updated_at | timestamp | auto | |

**Relations:** One-to-many with loans.

#### Device

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | int | PK, auto-increment | Internal ID |
| asset_tag | varchar | unique, not null | Barcode/asset tag printed on the device |
| status | enum | not null, default AVAILABLE | One of: `available`, `checked_out`, `maintenance`, `retired` |
| make | varchar | nullable | e.g., "Dell", "HP" |
| model | varchar | nullable | e.g., "Latitude 5520" |
| serial_number | varchar | nullable | Manufacturer serial number |
| notes | text | nullable | Free-text notes |
| created_at | timestamp | auto | |
| updated_at | timestamp | auto | |

**Relations:** One-to-many with loans.

**Status values:**
- `available` — on the shelf, ready to lend
- `checked_out` — currently assigned to a student via an active loan
- `maintenance` — pulled for repair, not available for checkout
- `retired` — decommissioned, no longer in the fleet

#### LoanCategory

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | int | PK, auto-increment | Internal ID |
| name | varchar | not null | e.g., "Forgot laptop", "Hardware repair" |
| default_duration_days | int | not null | How many days the loan lasts by default |
| description | varchar | nullable | Explanation shown to staff |
| is_active | boolean | not null, default true | Inactive categories hidden from kiosk |
| created_at | timestamp | auto | |

**Relations:** One-to-many with loans.

#### Loan

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | int | PK, auto-increment | Internal ID |
| student_id | int | FK → students.id, not null | |
| device_id | int | FK → devices.id, not null | |
| category_id | int | FK → loan_categories.id, not null | |
| checked_out_at | timestamp | not null, default NOW() | When the device was issued |
| due_at | timestamp | not null | Computed: checked_out_at + category.default_duration_days |
| returned_at | timestamp | nullable | Null while active, set on return |
| status | enum | not null, default ACTIVE | One of: `active`, `returned`, `overdue` |
| notes | text | nullable | |
| issued_via | varchar | not null, default "kiosk" | `kiosk` or `agent` |
| created_at | timestamp | auto | |
| updated_at | timestamp | auto | |

**Relations:** Many-to-one with student, device, and category.

**Status values:**
- `active` — device is currently checked out
- `returned` — device has been returned (returned_at is set)
- `overdue` — active loan past its due date (set by scheduler or query-time logic)

**Duration tracking:** The "how long has this been checked out" value is computed at query time as `NOW() - checked_out_at` for active loans, or `returned_at - checked_out_at` for returned loans. It is not stored.

#### Staff

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | int | PK, auto-increment | Internal ID |
| name | varchar | not null | Display name |
| email | varchar | unique, not null | Login identifier |
| pin | varchar | not null | bcrypt-hashed numeric PIN |
| role | enum | not null, default STAFF | One of: `staff`, `admin` |
| is_active | boolean | not null, default true | Inactive staff cannot log in |
| created_at | timestamp | auto | |
| updated_at | timestamp | auto | |

### 3.3 Design Decisions

- **No PENDING loan status.** Loans are created directly as ACTIVE when the student completes the kiosk checkout flow. There is no approval queue.
- **Duration is computed, not stored.** Avoids stale data and simplifies the schema. The API computes duration in responses.
- **Soft deletes via status flags.** Devices use `retired` status, categories and staff use `is_active` flags. No rows are deleted.
- **TypeORM synchronize: false.** All schema changes go through migrations. The `synchronize` option is disabled to prevent accidental schema drift.

## 4. API Design

### 4.1 Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| `POST` | `/api/auth/login` | No | — | Staff login (email + PIN → JWT) |
| `GET` | `/api/auth/me` | JWT | any | Current staff profile |
| `GET` | `/api/students/:barcode` | No | — | Lookup student by barcode (kiosk use) |
| `POST` | `/api/loans/checkout` | No | — | Create loan: `{ studentBarcode, deviceBarcode, categoryId }` |
| `POST` | `/api/loans/return` | No | — | Return device: `{ deviceBarcode }` |
| `GET` | `/api/loans/active` | JWT | any | Active loans with computed duration |
| `GET` | `/api/loans/overdue` | JWT | any | Overdue loans |
| `GET` | `/api/loans/history` | JWT | any | All loans, paginated: `?page=1&limit=25` |
| `GET` | `/api/loans/export/csv` | JWT | any | CSV download of current loans |
| `POST` | `/api/loans/:id/remind` | JWT | any | Send reminder email for one loan |
| `POST` | `/api/loans/remind-all` | JWT | any | Send reminders for all overdue loans |
| `GET` | `/api/dashboard/stats` | JWT | any | `{ available, checkedOut, overdue, maintenance }` |
| `GET` | `/api/devices` | JWT | admin | List all devices |
| `POST` | `/api/devices` | JWT | admin | Create a device |
| `PUT` | `/api/devices/:id` | JWT | admin | Update a device |
| `POST` | `/api/devices/import` | JWT | admin | Bulk CSV import |
| `GET` | `/api/devices/:id/label` | JWT | admin | Generate QR code label (PNG) |
| `GET` | `/api/categories` | No | — | List active categories (kiosk use) |
| `POST` | `/api/categories` | JWT | admin | Create a category |
| `PUT` | `/api/categories/:id` | JWT | admin | Update a category |
| `GET` | `/api/staff` | JWT | admin | List all staff |
| `POST` | `/api/staff` | JWT | admin | Create a staff member |
| `PUT` | `/api/staff/:id` | JWT | admin | Update a staff member |

### 4.2 Authentication Model

- **Kiosk endpoints** (`/api/students/:barcode`, `/api/loans/checkout`, `/api/loans/return`, `GET /api/categories`) are unauthenticated. The physical location of the kiosk in the IT area is the security boundary.
- **Agent endpoints** require a valid JWT in the `Authorization: Bearer <token>` header.
- **Admin endpoints** additionally check that the JWT payload's `role` field is `admin`.

### 4.3 Request/Response Conventions

- All responses return JSON with the shape `{ data: T }` for success or `{ error: string }` for errors.
- HTTP status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error).
- Pagination uses `?page=N&limit=N` query parameters. Paginated responses include `{ data: T[], total: number, page: number, limit: number }`.
- CSV export returns `Content-Type: text/csv` with a `Content-Disposition: attachment` header.

## 5. Docker Infrastructure

### 5.1 Compose Topology

```yaml
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "3306:3306"

  server:
    build: ./server
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      EMAIL_FROM: ${EMAIL_FROM}
    depends_on:
      mysql:
        condition: service_healthy
    ports:
      - "3000:3000"

  client:
    build: ./client
    depends_on:
      - server
    ports:
      - "8080:80"

volumes:
  mysql_data:
```

### 5.2 Client Dockerfile

Multi-stage build:

1. **Build stage** (Node 20 Alpine): Install dependencies, run `npm run build` (Vite), producing static files in `dist/`.
2. **Serve stage** (nginx Alpine): Copy `dist/` to nginx html directory, copy `nginx.conf` for SPA routing and API proxying.

### 5.3 Server Dockerfile

Multi-stage build:

1. **Build stage** (Node 20 Alpine): Install dependencies, run `npx tsc` to compile TypeScript to `dist/`.
2. **Run stage** (Node 20 Alpine slim): Copy `dist/` and `node_modules` (production only), run migrations then start the server.

Startup command:
```
npx typeorm migration:run -d dist/data-source.js && node dist/index.js
```

### 5.4 nginx Configuration

```nginx
server {
    listen 80;

    location /api {
        proxy_pass http://server:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

- `/api` requests are proxied to the Express server container
- All other requests serve the SPA (`/index.html` fallback for client-side routing)

## 6. PWA Configuration

### 6.1 vite-plugin-pwa Setup

```typescript
// vite.config.ts
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Loaner Laptop Manager",
        short_name: "Loaners",
        description: "School loaner laptop checkout and tracking",
        theme_color: "#1e40af",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
});
```

### 6.2 Service Worker Strategy

- **App shell caching:** HTML, CSS, JS, and icons are precached for instant loading.
- **Network-first for API calls:** All `/api` requests go to the network. The app requires connectivity for data operations.
- **Auto-update:** When a new version is deployed, the service worker updates automatically. Users see the new version on next visit.

### 6.3 Installation

The PWA is installable on:
- **Kiosk tablet:** Install via Chrome/Edge "Add to Home Screen" for a full-screen, app-like experience.
- **Staff devices:** Optionally installable for quick access to Agent Mode.

## 7. Security Model

### 7.1 Authentication

- **JWT-based authentication** for Agent Mode.
- Staff log in with email + numeric PIN. The server verifies the PIN against a bcrypt hash and returns a signed JWT.
- JWT payload: `{ id, email, role, iat, exp }`.
- Token lifetime: 8 hours (configurable via environment variable).
- Token sent in `Authorization: Bearer <token>` header on all Agent Mode API requests.

### 7.2 Role-Based Access Control

Two roles enforced by the `roleGuard` middleware:

| Role | Capabilities |
|------|-------------|
| `staff` | Dashboard, active/overdue loans, loan history, CSV export, send reminders |
| `admin` | All staff capabilities + device management, category management, staff management |

### 7.3 Kiosk Security Boundary

Kiosk endpoints (student lookup, checkout, return, category list) are intentionally unauthenticated. Security relies on:

- **Physical access control:** The kiosk device (tablet) is located at the IT service window, visible to staff.
- **Limited surface area:** Kiosk endpoints only allow checking out available devices, returning checked-out devices, and reading categories. No destructive operations.
- **No PII exposure:** Student lookup returns only the student's name (first + last) for confirmation — not email, grade, or other details.

### 7.4 Data Protection

- PINs stored as bcrypt hashes (cost factor 10).
- JWT secret stored in environment variable, never committed to source control.
- Database credentials in environment variables.
- `.env` excluded from version control via `.gitignore`.
- No student passwords or sensitive credentials stored — students authenticate via physical ID card barcode.

## 8. Routing Structure

### 8.1 Kiosk Mode (`/kiosk/*`)

| Path | Component | Description |
|------|-----------|-------------|
| `/kiosk` | KioskHome | Landing screen: "Check Out" / "Return" buttons |
| `/kiosk/checkout` | KioskCheckout | Multi-step: scan student → scan device → select category → confirm |
| `/kiosk/return` | KioskReturn | Scan device → confirm return |
| `/kiosk/success` | KioskSuccess | Confirmation display, 10-second auto-reset to `/kiosk` |

### 8.2 Agent Mode (`/agent/*`)

| Path | Component | Auth | Role |
|------|-----------|------|------|
| `/agent/login` | AgentLogin | No | — |
| `/agent` | AgentDashboard | JWT | any |
| `/agent/loans` | ActiveLoans | JWT | any |
| `/agent/overdue` | OverdueLoans | JWT | any |
| `/agent/history` | LoanHistory | JWT | any |
| `/agent/devices` | DeviceManagement | JWT | admin |
| `/agent/categories` | CategoryManagement | JWT | admin |
| `/agent/staff` | StaffManagement | JWT | admin |

### 8.3 Root Route

`/` redirects to `/kiosk` — the kiosk is the default mode since the primary deployment target is a dedicated tablet.
