# Dayflow HRMS — Backend 1 (BE-1)

> Auth, Employee CRUD, RBAC, Private/Security Info, Documents, Skills & Certifications, Company

---

## ⚠️ Intentional Deviations from Original Wireframe

These changes are **by design** and reflect the final agreed-upon v2 spec:

1. **No public sign-up / registration endpoint.** There is no `/auth/register`. Only Admin/HR can create employee accounts via `POST /employees`. Login ID and a temporary password are system-generated.

2. **No email verification.** Authentication uses Login ID + password only. No OTP or email verification flow exists.

3. **Employees can view their OWN salary (read-only).** Salary endpoints are owned by BE-2, but the RBAC middleware enforces that employees can never access another employee's salary, private info, security info, or documents.

---

## 🔐 Role Model

Exactly **2 roles** exist:

| Role | Description |
|------|-------------|
| `ADMIN_HR` | Full access to all endpoints. Can create employees, manage documents, view all data. |
| `EMPLOYEE` | Can view own profile, private info, security info, documents. Can edit only `address`, `phone`, `profile_picture` on self. Cannot access other employees' sensitive data. |

No additional roles exist.

---

## 🏗️ Tech Stack

- **Runtime:** Node.js + Express + TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validation:** Zod
- **File Uploads:** Multer (local `/uploads` directory)
- **Security:** Helmet, CORS, parameterized queries (Prisma ORM)

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database models
│   └── seed.ts                # Seed script (1 Admin + 3 Employees)
├── src/
│   ├── config/                # Environment config + Prisma client
│   ├── controllers/           # Request handlers
│   ├── middleware/             # Auth, RBAC, validation, error handling
│   ├── routes/                # API endpoint definitions
│   ├── services/              # Business logic layer
│   ├── utils/                 # Helpers (password, login ID, file upload)
│   ├── validators/            # Zod schemas
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Entry point
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
docker-compose up --build
```

This starts PostgreSQL + the API server. The API runs on `http://localhost:3000`.

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev

# 5. Seed the database
npm run seed

# 6. Start development server
npm run dev
```

---

## 🔑 Login ID Format

Format: `[2-char company][2-char first name][2-char last name][4-digit year][4-digit serial]`

**Example:** `OIJO20260001` = **O**doo **I**nc + **J**ohn D**o**e + 2026 + serial 0001

- Serial resets to `0001` each new joining year
- Unique constraint enforced at DB level
- Transaction-safe with retry on collision (handles concurrent creation)

---

## 📋 API Endpoints

### Authentication
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/auth/login` | Public | Returns JWT + `firstLogin` flag |
| POST | `/auth/change-password` | Authenticated | Enforces password policy |

### Employees
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/employees` | Admin/HR | Creates employee + auto-generates login ID & temp password |
| GET | `/employees` | Authenticated | Search + pagination + filters |
| GET | `/employees/:id` | Authenticated | Get employee (strips sensitive data by role) |
| PUT | `/employees/:id` | Admin/HR or Self | Self: only address, phone, profile picture |

### Private Info
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/employees/:id/private-info` | Self or Admin/HR | 403 for cross-employee access |
| PUT | `/employees/:id/private-info` | Self or Admin/HR | Update personal details |

### Security Info
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/employees/:id/security` | Self or Admin/HR | Account number masked (last 4 only) |
| PUT | `/employees/:id/security` | Self or Admin/HR | Update bank/PAN/UAN details |

### Documents
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/employees/:id/documents` | Self or Admin/HR | Multipart upload (pdf/jpg/png, 5MB max) |
| GET | `/employees/:id/documents` | Self or Admin/HR | List documents |
| DELETE | `/employees/:id/documents/:docId` | Admin/HR only | Audited deletion |

### Skills & Certifications
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/skills` | Self or Admin/HR | Add skill to employee |
| GET | `/employees/:id/skills` | Authenticated | List employee skills |
| POST | `/certifications` | Self or Admin/HR | Add certification |
| GET | `/employees/:id/certifications` | Authenticated | List certifications |

### Uploads
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | `/upload/profile-picture` | Self or Admin/HR | Profile picture upload |
| POST | `/upload/company-logo` | Admin/HR only | Updates global company logo |

### Company
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/company` | Authenticated | Company info + logo URL |

### Health Check
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/health` | Public | Server status |

---

## 🌱 Seed Data

| Role | Login ID | Password | Name |
|------|----------|----------|------|
| Admin | `OIHR20260001` | `Admin@1234` | HR Admin |
| Employee | `OIJO20260002` | `Temp@1234` | John Doe |
| Employee | `OIJA20260003` | `Temp@5678` | Jane Smith |
| Employee | `OIAL20260004` | `Temp@9012` | Alex Kumar |

Employee passwords must be changed on first login (`firstLogin = true`).

---

## 🔒 Security

- **Password hashing:** bcrypt with 12 salt rounds
- **JWT validation:** on every protected route
- **RBAC:** server-side role + ownership checks
- **File upload security:** MIME type + extension validation, size limits, filename sanitization
- **No raw SQL:** Prisma ORM for all database operations (prevents SQL injection)
- **Helmet:** Security headers on all responses
- **Account masking:** Bank account numbers show only last 4 digits

---

## 📝 Error Messages

| Scenario | Message |
|----------|---------|
| Invalid login | `Invalid Login ID or password.` |
| Duplicate email | `An employee with this email already exists.` |
| Unauthorized action | `You do not have permission to perform this action.` |
| Invalid file upload | `Unsupported file type or file too large.` |

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_SECRET` | — | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | `24h` | Token expiry duration |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `UPLOAD_DIR` | `uploads` | File upload directory |
| `MAX_FILE_SIZE_MB` | `5` | Max upload size in MB |

---

## 🤝 BE-2 Coordination

BE-2 owns: Attendance, Leave, Salary/Payroll modules.

**Shared dependencies:**
- `Employee` table (FK from all BE-2 tables)
- RBAC middleware (`authenticate`, `authorize`, `ownershipCheck`)
- Prisma schema (shared `schema.prisma`)

BE-2 should reference employee IDs from the seed data above.
