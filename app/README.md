# Productivity Backend API

Production-ready Node.js/Express REST API with MongoDB, JWT auth, Cloudinary uploads, and full analytics.

---

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js ≥ 18, ES Modules (`type: module`) |
| Framework | Express 4 |
| Database | MongoDB via Mongoose |
| Auth | JWT (access + refresh tokens, HttpOnly cookies) |
| File Storage | Cloudinary |
| Email | Nodemailer (SMTP) |
| Security | Helmet, CORS, mongo-sanitize, rate-limit |
| Logging | Winston + Morgan |

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start development
npm run dev

# 4. Start production
npm start
```

---

## Environment Variables

See `.env.example` for the full list. Key variables:

```
MONGODB_URI=mongodb://...
JWT_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars>
CLOUDINARY_CLOUD_NAME=...
EMAIL_HOST=smtp.gmail.com
FRONTEND_URL=http://localhost:3000
```

---

## API Reference

All routes are prefixed with `/api/v1`.

### Auth — `/api/v1/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | ✗ | Register + send verification email |
| GET | `/verify-email/:token` | ✗ | Verify email address |
| POST | `/resend-verification` | ✗ | Resend verification email |
| POST | `/login` | ✗ | Login, returns JWT + sets cookies |
| POST | `/refresh` | ✗ | Rotate refresh token |
| POST | `/forgot-password` | ✗ | Send password reset email |
| PATCH | `/reset-password/:token` | ✗ | Reset password via token |
| GET | `/me` | ✓ | Get current user |
| POST | `/logout` | ✓ | Logout, invalidate refresh token |
| PATCH | `/change-password` | ✓ | Change password (invalidates all sessions) |

#### Register
```json
POST /api/v1/auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Secret123",
  "passwordConfirm": "Secret123"
}
```

#### Login
```json
POST /api/v1/auth/login
{
  "email": "jane@example.com",
  "password": "Secret123"
}
// Response includes accessToken + sets HttpOnly cookies
```

---

### Profile — `/api/v1/profile`

| Method | Route | Description |
|---|---|---|
| PATCH | `/` | Update name |
| POST | `/avatar` | Upload avatar (multipart/form-data, field: `avatar`) |
| DELETE | `/avatar` | Remove avatar |
| DELETE | `/account` | Soft-delete account (requires `password` in body) |

---

### Tasks (Work Section) — `/api/v1/tasks`

Statuses: `To Do` → `In Progress` → `Review` → `Complete`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List tasks (filter: `?status=`, `?search=`, `?page=`, `?limit=`, `?sort=`) |
| POST | `/` | Create task |
| GET | `/kanban` | All tasks grouped by status column |
| PATCH | `/bulk-status` | Bulk update status (`{ ids: [], status: "" }`) |
| GET | `/:id` | Get single task |
| PATCH | `/:id` | Update task |
| DELETE | `/:id` | Delete task |

```json
POST /api/v1/tasks
{
  "title": "Implement login UI",
  "description": "Build the login form with validation",
  "status": "To Do"
}
```

---

### Calendar — `/api/v1/calendar`

| Method | Route | Description |
|---|---|---|
| GET | `/` | Get tasks (filter: `?start=&end=` or `?month=&year=`) |
| POST | `/` | Create calendar task |
| GET | `/date/:date` | Get all tasks for a specific date (YYYY-MM-DD) |
| GET | `/:id` | Get single task |
| PATCH | `/:id` | Update task |
| DELETE | `/:id` | Delete task |

```json
POST /api/v1/calendar
{
  "title": "Team standup",
  "date": "2025-08-01",
  "startTime": "09:00",
  "endTime": "09:30",
  "color": "#4F46E5",
  "allDay": false
}
```

---

### Sessions — `/api/v1/sessions`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List sessions (`?date=`, `?month=`, `?year=`, `?page=`, `?limit=`) |
| POST | `/` | Log a session manually |
| GET | `/dashboard` | Summary view grouped by date (`?month=&year=`) |
| GET | `/:id` | Get session |
| PATCH | `/:id` | Update session |
| DELETE | `/:id` | Delete session |

```json
POST /api/v1/sessions
{
  "date": "2025-08-01",
  "startTime": "10:00",
  "endTime": "11:30",
  "notes": "Deep work block"
}
```

Dashboard response includes:
- `summary`: totalSessions, totalDuration (mins), avgDuration, activeDays
- `byDate`: array of `{ date, count, sessions[] }`

---

### Folders — `/api/v1/folders`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List folders (`?parent=root` for root level, `?parent=<id>`) |
| POST | `/` | Create folder |
| GET | `/tree` | Full nested folder tree |
| PATCH | `/:id` | Rename / recolor folder |
| PATCH | `/:id/move` | Move folder (update parent) |
| DELETE | `/:id` | Delete folder + all subfolders + all documents |

```json
POST /api/v1/folders
{
  "name": "Contracts",
  "parent": null,
  "color": "#10b981"
}
```

---

### Documents — `/api/v1/documents`

Accepts: `application/pdf`, `image/jpeg` / `image/jpg` — max 20MB.

| Method | Route | Description |
|---|---|---|
| GET | `/` | List documents (`?folder=root`, `?folder=<id>`, `?search=`, `?page=`) |
| POST | `/` | Upload document (`multipart/form-data`, field: `document`) |
| GET | `/:id` | Get document metadata + URL |
| PATCH | `/:id` | Update metadata (name, description, tags, folder) |
| PUT | `/:id/file` | Replace file binary (keeps same record) |
| PATCH | `/:id/move` | Move to different folder |
| DELETE | `/:id` | Delete document + Cloudinary file |

```
POST /api/v1/documents
Content-Type: multipart/form-data

document: <file>
name: "Q3 Contract"
folder: "64abc..."   (optional)
description: "Signed Q3 vendor contract"
tags: "contracts,2025,vendor"
```

---

### Analytics — `/api/v1/analytics`

| Method | Route | Description |
|---|---|---|
| GET | `/dashboard` | Combined overview (tasks distribution + sessions summary + today's stats) |
| GET | `/tasks` | Task analytics: completed/day, status distribution, completion rate (last 30 days) |
| GET | `/sessions` | Session analytics: sessions/day, hour distribution, total duration (last 30 days) |

#### Task Analytics Response
```json
{
  "period": { "start": "...", "end": "...", "days": 30 },
  "summary": {
    "totalTasks": 42,
    "completedTotal": 18,
    "completionRate": 43,
    "statusDistribution": { "To Do": 10, "In Progress": 8, "Review": 6, "Complete": 18 }
  },
  "completedByDay": [{ "date": "2025-07-01", "completed": 2 }, ...],
  "tasksByDay": [...]
}
```

#### Session Analytics Response
```json
{
  "summary": {
    "totalSessions": 24,
    "totalDuration": 1440,
    "activeDays": 18,
    "avgSessionsPerActiveDay": 1.3
  },
  "sessionsByDay": [{ "date": "2025-07-01", "count": 2, "totalDuration": 120 }, ...],
  "hourDistribution": [{ "hour": 9, "count": 8 }, ...]
}
```

---

## Authentication Flow

```
Register → Receive verification email → Click link → Email verified → Login
         → Access token (15min, Bearer) + Refresh token (30d, HttpOnly cookie)
         → Use refresh endpoint to rotate tokens silently
```

Tokens can be sent as:
- `Authorization: Bearer <token>` header, OR
- `accessToken` HttpOnly cookie (set automatically on login)

---

## Security Features

- **Helmet** — secure HTTP headers
- **CORS** — strict origin whitelist
- **Rate limiting** — global (100/15min), auth (10/15min), password reset (5/hr)
- **MongoDB sanitization** — NoSQL injection prevention
- **JWT rotation** — refresh tokens are rotated on every use; reuse triggers invalidation
- **HttpOnly cookies** — tokens never accessible via JS
- **Bcrypt** — passwords hashed with cost factor 12
- **Input validation** — express-validator on all inputs
- **Soft deletes** — users are deactivated, not erased
- **Email enumeration prevention** — forgot-password always returns same response

---

## Error Response Format

```json
{
  "status": "fail",
  "message": "Human-readable error message",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

HTTP status codes: `400` validation, `401` auth, `403` forbidden, `404` not found, `409` conflict, `422` unprocessable, `429` rate limit, `500` server error.

---

## Project Structure

```
src/
├── config/         # DB + Cloudinary config
├── controllers/    # Route handlers (auth, profile, task, calendar, session, folder, document, analytics)
├── middleware/     # auth, errorHandler, rateLimiter, upload, validate
├── models/         # Mongoose schemas (User, Task, CalendarTask, Session, Folder, Document)
├── routes/         # Express routers
├── utils/          # AppError, catchAsync, apiResponse, email, logger, tokenUtils
├── validators/     # express-validator rule sets
├── app.js          # Express app setup
└── server.js       # HTTP server + graceful shutdown
```
