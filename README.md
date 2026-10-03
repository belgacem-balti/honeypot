# TaskFlow

> Modern SaaS-style task management application built with React, Express, and PostgreSQL.

![TaskFlow](https://img.shields.io/badge/TaskFlow-v1.0.0-4f46e5)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Express](https://img.shields.io/badge/Express-4.18-000000)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169e1)
![Prisma](https://img.shields.io/badge/Prisma-5.7-2d3748)

## Overview

TaskFlow is a full-stack task management application designed for teams and individuals who want to organize their work efficiently. It features a modern, responsive UI inspired by contemporary SaaS platforms like Linear, Vercel, and Notion.

## Features

- **Authentication** — Secure registration, login, and JWT-based session management
- **Task Management** — Full CRUD operations with status tracking and priority levels
- **Dashboard** — Visual overview with statistics cards and interactive charts
- **Search & Filter** — Find tasks by title, status, or priority
- **Profile Management** — Update personal information and change password
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile
- **Real-time Feedback** — Toast notifications, loading states, and confirmation dialogs

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite 5, React Router 6 |
| **Styling** | Tailwind CSS 3, Lucide React Icons |
| **Charts** | Recharts |
| **HTTP Client** | Axios |
| **Backend** | Node.js, Express 4 |
| **Database** | PostgreSQL 15+ |
| **ORM** | Prisma 5 |
| **Auth** | JWT, bcryptjs |
| **Validation** | express-validator |

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
├──────────────────────────────────────────────────────┤
│                   PostgreSQL                          │
│           (Users, Tasks tables)                       │
└──────────────────────────────────────────────────────┘
```

## Folder Structure

```
taskflow/
│
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI & feature components
│   │   │   ├── ui/            # Button, Input, Card, Modal, Badge, etc.
│   │   │   ├── dashboard/     # StatsCards, TaskChart, RecentTasks
│   │   │   └── tasks/         # TaskCard, TaskForm, TaskFilters
│   │   ├── pages/             # Landing, Login, Register, Dashboard, Tasks, Profile
│   │   ├── layouts/           # DashboardLayout, AuthLayout
│   │   ├── hooks/             # useAuth, useTasks
│   │   ├── services/          # Axios API client
│   │   ├── context/           # AuthContext
│   │   ├── utils/             # Validators, formatters
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── controllers/       # authController, taskController, userController
│   │   ├── services/          # Business logic layer
│   │   ├── routes/            # API route definitions
│   │   ├── middleware/        # Auth & error handling
│   │   ├── config/            # Database configuration
│   │   ├── utils/             # API response helpers
│   │   └── app.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── .gitignore
├── README.md
└── package.json               # Root with concurrently
```

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **PostgreSQL** 15 or higher

## PostgreSQL Setup

1. Install PostgreSQL if not already installed
2. Create the database:

```sql
CREATE DATABASE taskflow;
```

3. Note your PostgreSQL credentials (default: `postgres` / `password`)

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskflow"
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_EXPIRES_IN="7d"
PORT=5000
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

> ⚠️ **Important:** Change `JWT_SECRET` to a strong random string in production. Never commit `.env` files to version control.

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd taskflow
```

### 2. Install all dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

Or use the convenience script from root:

```bash
npm run install:all
```

### 3. Set up the database

```bash
cd server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init
```

### 4. Running with Docker (Recommended)

Run the entire stack (PostgreSQL, Express Server, React Frontend with Nginx reverse proxy) with a single command:

```bash
docker compose up --build
```

Access the application:
- **Frontend:** [http://localhost](http://localhost) or [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **PostgreSQL:** `localhost:5432`

To stop the containers:
```bash
docker compose down
```

### 5. Running Locally (Alternative)

From the **root** directory:

```bash
npm run dev
```

This starts both the frontend (port 5173) and backend (port 5000) concurrently.

Or start them separately:

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

### 5. Open the application

Navigate to [http://localhost:5173](http://localhost:5173)

## API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Create a new account | No |
| `POST` | `/api/auth/login` | Log in | No |
| `GET` | `/api/auth/me` | Get current user | Yes |

### Tasks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/tasks` | List tasks (with filters & pagination) | Yes |
| `GET` | `/api/tasks/:id` | Get a single task | Yes |
| `POST` | `/api/tasks` | Create a task | Yes |
| `PUT` | `/api/tasks/:id` | Update a task | Yes |
| `DELETE` | `/api/tasks/:id` | Delete a task | Yes |
| `PATCH` | `/api/tasks/:id/status` | Update task status | Yes |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/users/profile` | Get profile | Yes |
| `PUT` | `/api/users/profile` | Update profile | Yes |
| `PUT` | `/api/users/password` | Change password | Yes |

### Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { },
  "message": "Operation successful"
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "errors": [ ]
}
```

### Query Parameters (GET /api/tasks)

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `TODO`, `IN_PROGRESS`, `COMPLETED` |
| `priority` | string | Filter by priority: `LOW`, `MEDIUM`, `HIGH` |
| `search` | string | Search in title and description |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |

## Screenshots

> Screenshots can be added here after running the application.

| Page | Description |
|------|-------------|
| Landing | Modern SaaS landing page |
| Dashboard | Statistics and task overview |
| Tasks | Task management interface |
| Profile | User profile settings |

## Scripts

### Root

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:server` | Start backend only |
| `npm run dev:client` | Start frontend only |
| `npm run build` | Build frontend for production |
| `npm run install:all` | Install all dependencies |

### Server

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start for production |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:generate` | Generate Prisma client |

### Client

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Future Improvements

- [ ] Task categories and tags
- [ ] Drag-and-drop Kanban board view
- [ ] Task comments and attachments
- [ ] Team collaboration and task assignment
- [ ] Email notifications and reminders
- [ ] Dark mode support
- [ ] Export tasks to CSV/PDF
- [ ] Two-factor authentication
- [ ] OAuth (Google, GitHub) sign-in
- [ ] Real-time updates with WebSockets
- [ ] Task templates
- [ ] Mobile app (React Native)

## License

MIT
