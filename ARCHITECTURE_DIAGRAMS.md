# CITC Portal Multi-Capstone Architecture - Visual Reference

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           END USER BROWSER                                  │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    React Frontend (Unified UI)                     │    │
│  │                    http://localhost:3000                           │    │
│  │                                                                    │    │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐       │    │
│  │  │   Login      │  │   Sidebar Nav    │  │    Header    │       │    │
│  │  │              │  │                  │  │              │       │    │
│  │  │ ┌──────────┐ │  │ • Dashboard      │  │ User Profile │       │    │
│  │  │ │Email    │ │  │ • UniEventify    │  │ Logout       │       │    │
│  │  │ │Password │ │  │ • LMS            │  │              │       │    │
│  │  │ │[Login]  │ │  │ • Administration │  │              │       │    │
│  │  │ └──────────┘ │  │ • Settings       │  │              │       │    │
│  │  └──────────────┘  └──────────────────┘  └──────────────┘       │    │
│  │                            ▼                                      │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │         Dynamic Content Area (Lazy-Loaded Modules)       │   │    │
│  │  │                                                           │   │    │
│  │  │  Displays selected module based on sidebar selection:   │   │    │
│  │  │                                                           │   │    │
│  │  │  ┌────────────────┐  ┌────────────────┐                 │   │    │
│  │  │  │ UniEventify    │  │      LMS       │                 │   │    │
│  │  │  │ Events Page    │  │  Courses Page  │                 │   │    │
│  │  │  │ Event Details  │  │ Enrollments    │                 │   │    │
│  │  │  │ Create Event   │  │ Assignments    │                 │   │    │
│  │  │  └────────────────┘  └────────────────┘                 │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  │                                                                    │    │
│  │  Auth Token: Stored in localStorage                              │    │
│  │  { token: "abc123...", user: { id, email, roles, ... } }        │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                 ▼                                         │
│                    ┌──────────────────────────┐                          │
│                    │  HTTP Requests Over REST │                          │
│                    │  Header: Authorization:  │                          │
│                    │  Token abc123...         │                          │
│                    └──────────────────────────┘                          │
│                                 ▼                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DJANGO BACKEND SERVER                               │
│                      http://localhost:8000/api/v1                           │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐    │
│  │              URL Router - Request Dispatcher                      │    │
│  │                                                                   │    │
│  │  /auth/               ──→ Authentication Service                │    │
│  │  /unieventify/        ──→ UniEventify Service                  │    │
│  │  /lms/                ──→ LMS Service                          │    │
│  │  /admin/              ──→ Administration Service               │    │
│  └───────────────────────────────────────────────────────────────────┘    │
│           ▼                    ▼                  ▼                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   Auth App   │    │ UniEventify  │    │   LMS App    │               │
│  │              │    │   App        │    │              │               │
│  │ • Login      │    │              │    │ • Courses    │               │
│  │ • Logout     │    │ • Events     │    │ • Enrollments│               │
│  │ • User Info  │    │ • Venues     │    │ • Grades     │               │
│  │ • Roles      │    │ • Categories │    │ • Lessons    │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│           ▼                    ▼                  ▼                         │
│           │                    │                  │                        │
│  ┌────────┴─────────┬──────────┴────────┬────────┴─────────┐            │
│  │                  │                   │                  │             │
│  ▼                  ▼                   ▼                  ▼             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │ CITC_DB  │   │ EVENTS   │   │ COURSES  │   │  AUDIT   │            │
│  │          │   │   DB     │   │   DB     │   │   DB     │            │
│  │ • Users  │   │ • Events │   │ • Courses│   │ • Logs   │            │
│  │ • Roles  │   │ • Venues │   │ • Enroll │   │ • Changes│            │
│  │ • Auth   │   │          │   │          │   │          │            │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘            │
│  (Shared)       (UniEventify)   (LMS)         (Audit Trail)            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### 1. Login Flow

```
┌──────────┐
│  User    │
│ Enters   │
│ Creds    │
└────┬─────┘
     │
     ▼
┌────────────────────────────────────┐
│  Frontend: Login Component          │
│  - Email: user@example.com         │
│  - Password: ****                  │
│  - [Login Button]                  │
└────┬───────────────────────────────┘
     │
     ▼
POST /api/v1/auth/token/login/
{
  "email": "user@example.com",
  "password": "1234"
}
     │
     ▼
┌────────────────────────────────────┐
│  Backend: LoginView                │
│  - Verify credentials              │
│  - Check if user exists            │
│  - Generate token                  │
└────┬───────────────────────────────┘
     │
     ▼
Response: 200 OK
{
  "auth_token": "abc123def456...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "roles": ["admin", "dean"],
    "department": "IT"
  }
}
     │
     ▼
┌────────────────────────────────────┐
│  Frontend: Store & Redirect        │
│  localStorage.setItem('token',     │
│    'abc123def456...')              │
│  localStorage.setItem('user',      │
│    {...user data...})              │
│  Redirect to: /dashboard           │
└────────────────────────────────────┘
```

### 2. Sidebar Navigation Flow

```
┌──────────────────────────────┐
│  Dashboard Loaded            │
│  Token in localStorage: ✓    │
│  User data available: ✓      │
└────┬───────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│  Sidebar Component Mounts    │
│  useAuth() hook reads:       │
│  - token from localStorage   │
│  - user data from store      │
│  - user.roles = ['admin']    │
└────┬───────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│  Generate Available Capstones        │
│  Filter by user roles:               │
│                                      │
│  For each capstone in config:        │
│    IF user.roles includes ANY       │
│       capstone.requiredRoles         │
│    THEN show in sidebar              │
│                                      │
│  Result:                             │
│  ✓ Dashboard                         │
│  ✓ UniEventify (admin has access)   │
│  ✓ LMS (admin has access)           │
│  ✓ Admin (admin has access)         │
└────┬───────────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│  Render Sidebar              │
│  - Dashboard link            │
│  - UniEventify link  ✓       │
│  - LMS link          ✓       │
│  - Admin link        ✓       │
│  [Logout]                    │
└──────────────────────────────┘
```

### 3. Module Loading Flow

```
User clicks "UniEventify" link
            │
            ▼
┌──────────────────────────────────┐
│ React Router: Navigate            │
│ to /events/*                      │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Check Protected Route             │
│ - Token exists? ✓                │
│ - User authenticated? ✓           │
│ - Access granted? ✓              │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Lazy Load Module                 │
│ import('../modules/unieventify'  │
│ .then(module => render)          │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Module Initializes               │
│ - useAuth() gets token           │
│ - useFetch() makes API call:     │
│   GET /api/v1/unieventify/events/│
│   with Authorization header      │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Backend Validates Token          │
│ - Extract token from header      │
│ - Look up user from token        │
│ - Check permissions              │
│ - Return events data             │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ Module Renders                   │
│ - Display events list            │
│ - Show event details             │
│ - Enable create/edit/delete      │
│   (based on permissions)        │
└──────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── ProtectedRoute
│   ├── Layout
│   │   ├── Header
│   │   │   ├── Logo
│   │   │   ├── User Profile Dropdown
│   │   │   │   ├── Settings
│   │   │   │   └── [Logout]
│   │   │   └── Search Bar (optional)
│   │   │
│   │   ├── Sidebar
│   │   │   ├── Logo Section
│   │   │   ├── Main Navigation
│   │   │   │   ├── Dashboard Link
│   │   │   │   ├── Capstone Links (dynamic)
│   │   │   │   │   ├── UniEventify
│   │   │   │   │   ├── LMS
│   │   │   │   │   └── Admin
│   │   │   │   ├── Settings Link
│   │   │   │   └── [Logout Button]
│   │   │   └── User Info Section
│   │   │
│   │   └── Main Content Area
│   │       ├── Dashboard (/dashboard)
│   │       │   ├── Welcome Card
│   │       │   ├── Quick Stats
│   │       │   └── Recent Activities
│   │       │
│   │       └── Modules Routes (/events/*, /courses/*, /admin/*)
│   │           │
│   │           ├── unieventify Module
│   │           │   ├── EventsList
│   │           │   ├── EventDetail
│   │           │   ├── CreateEvent
│   │           │   └── EventCard (reusable)
│   │           │
│   │           ├── lms Module
│   │           │   ├── CoursesList
│   │           │   ├── CourseDetail
│   │           │   ├── EnrollmentPage
│   │           │   └── CourseCard (reusable)
│   │           │
│   │           └── admin Module
│   │               ├── UserManagement
│   │               ├── RoleManagement
│   │               ├── SystemSettings
│   │               └── AuditLogs
│   │
│   └── Footer (optional)
│       ├── Copyright
│       ├── Links
│       └── Support Info
│
└── LoginPage (/login)
    ├── LoginForm
    │   ├── Email Input
    │   ├── Password Input
    │   └── [Login Button]
    └── Footer
        └── Links (Forgot Password, etc.)
```

---

## Database Schema Overview

### CITC_DB (Authentication & Core)

```
┌──────────────────┐
│  auth_user       │
├──────────────────┤
│ id (PK)          │
│ uuid             │
│ email            │
│ password_hash    │
│ first_name       │
│ last_name        │
│ is_active        │
│ is_staff         │
│ department_id (FK)
│ created_at       │
│ updated_at       │
└──────────────────┘
        │ M:N
        ↓
┌──────────────────┐
│  auth_role       │
├──────────────────┤
│ id (PK)          │
│ name             │
│ rank             │
│ permissions      │
└──────────────────┘
        │
        ↓
┌──────────────────┐
│  auth_permission │
├──────────────────┤
│ id (PK)          │
│ name             │
│ codename         │
└──────────────────┘
        │
        ↓
┌──────────────────┐
│ auth_token       │
├──────────────────┤
│ key (PK)         │
│ user_id (FK)     │
│ created_at       │
└──────────────────┘
```

### EVENTS_DB (UniEventify)

```
┌──────────────────┐
│ unieventify_     │
│ event            │
├──────────────────┤
│ id (PK)          │
│ event_name       │
│ description      │
│ start_datetime   │
│ end_datetime     │
│ venue_id (FK)    │
│ category_id (FK) │
│ type_id (FK)     │
│ created_by_id (FK)
│ department_id (FK)
│ status_id (FK)   │
└──────────────────┘
        │
        ├─→ ┌──────────────────┐
        │   │ unieventify_     │
        │   │ venue            │
        │   ├──────────────────┤
        │   │ id (PK)          │
        │   │ name             │
        │   │ location         │
        │   └──────────────────┘
        │
        ├─→ ┌──────────────────┐
        │   │ unieventify_     │
        │   │ event_category   │
        │   ├──────────────────┤
        │   │ id (PK)          │
        │   │ name             │
        │   └──────────────────┘
        │
        └─→ ┌──────────────────┐
            │ unieventify_     │
            │ event_type       │
            ├──────────────────┤
            │ id (PK)          │
            │ name             │
            └──────────────────┘
```

### LMS_DB (Learning Management)

```
┌──────────────────┐
│ lms_course       │
├──────────────────┤
│ id (PK)          │
│ code             │
│ title            │
│ description      │
│ teacher_id (FK)  │
│ department_id (FK)
│ year_level_id (FK)
│ created_at       │
└──────────────────┘
        │
        ├─→ ┌──────────────────┐
        │   │ lms_enrollment   │
        │   ├──────────────────┤
        │   │ id (PK)          │
        │   │ student_id (FK)  │
        │   │ course_id (FK)   │
        │   │ grade            │
        │   │ status           │
        │   └──────────────────┘
        │
        └─→ ┌──────────────────┐
            │ lms_assignment   │
            ├──────────────────┤
            │ id (PK)          │
            │ title            │
            │ course_id (FK)   │
            │ due_date         │
            │ description      │
            └──────────────────┘
```

---

## State Management Flow

```
┌────────────────────────────────────────────────────────────────┐
│                   Global Redux Store                           │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                   auth.slice.ts                          │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ State:                                                   │ │
│  │  - token: string | null                                 │ │
│  │  - user: { id, email, roles, ... } | null              │ │
│  │  - isLoading: boolean                                   │ │
│  │  - error: string | null                                 │ │
│  │                                                          │ │
│  │ Actions:                                                │ │
│  │  - loginAsync(email, password)                          │ │
│  │  - logoutAsync()                                        │ │
│  │  - setCurrentUser(user)                                 │ │
│  │  - clearAuth()                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                            ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              unieventify.slice.ts                        │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ State:                                                   │ │
│  │  - events: Event[]                                      │ │
│  │  - selectedEvent: Event | null                          │ │
│  │  - isLoading: boolean                                   │ │
│  │                                                          │ │
│  │ Actions:                                                │ │
│  │  - fetchEventsAsync()                                   │ │
│  │  - createEventAsync(data)                               │ │
│  │  - updateEventAsync(id, data)                           │ │
│  │  - deleteEventAsync(id)                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                            ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                 lms.slice.ts                            │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ State:                                                   │ │
│  │  - courses: Course[]                                    │ │
│  │  - enrollments: Enrollment[]                            │ │
│  │  - selectedCourse: Course | null                        │ │
│  │  - isLoading: boolean                                   │ │
│  │                                                          │ │
│  │ Actions:                                                │ │
│  │  - fetchCoursesAsync()                                  │ │
│  │  - enrollAsync(courseId)                                │ │
│  │  - submitAssignmentAsync(data)                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
        ▼                           ▼
┌─────────────┐           ┌─────────────┐
│ Components  │ useSelector │ Components │
│ useAuth()   │◄──────────┤ useCourses()│
└─────────────┘           └─────────────┘
```

---

## API Endpoints Reference

### Authentication Endpoints

```
POST   /api/v1/auth/token/login/
       Request: { email, password }
       Response: { auth_token, user }

POST   /api/v1/auth/token/logout/
       Header: Authorization: Token <token>
       Response: { message }

GET    /api/v1/auth/user/me/
       Header: Authorization: Token <token>
       Response: { user details }

GET    /api/v1/auth/capstones/
       Header: Authorization: Token <token>
       Response: { available_capstones: [...] }
```

### UniEventify Endpoints

```
GET    /api/v1/unieventify/events/
       Header: Authorization: Token <token>
       Response: { events: [...] }

POST   /api/v1/unieventify/events/
       Header: Authorization: Token <token>
       Body: { name, description, ... }
       Response: { event }

GET    /api/v1/unieventify/events/{id}/
GET    /api/v1/unieventify/venues/
GET    /api/v1/unieventify/categories/
GET    /api/v1/unieventify/types/
```

### LMS Endpoints

```
GET    /api/v1/lms/courses/
       Header: Authorization: Token <token>
       Response: { courses: [...] }

POST   /api/v1/lms/courses/
       Header: Authorization: Token <token>
       Body: { code, title, ... }
       Response: { course }

GET    /api/v1/lms/enrollments/
GET    /api/v1/lms/assignments/
POST   /api/v1/lms/assignments/{id}/submit/
```

---

## Browser Storage Format

### localStorage

```javascript
{
  "authToken": "abc123def456ghi789...",
  "currentUser": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "roles": ["admin", "dean"],
    "department": "Information Technology"
  },
  "theme": "light" // optional
}
```

### sessionStorage (if needed)

```javascript
{
  "tempEventFilter": {
    "category": "academic",
    "month": "2026-03"
  }
}
```

---

## Environment Variables

### Frontend (.env)

```
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
REACT_APP_ENV=development
# or for production:
REACT_APP_API_BASE_URL=https://citc-portal.example.com/api/v1
REACT_APP_ENV=production
```

### Backend (.env)

```
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,citc-portal.example.com

# Database
DATABASE_ENGINE=django.db.backends.postgresql_psycopg2
DATABASE_NAME=citc_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

---

## Deployment Architecture

### Development Setup

```
Developer Machine
├── Frontend: npm start (port 3000)
├── Backend: python manage.py runserver (port 8000)
├── Database: PostgreSQL (port 5432)
└── Browser: http://localhost:3000
```

### Production Setup (Option A: Single Server)

```
Production Server
├── Nginx (Reverse Proxy)
│   ├── Port 80 → Redirect to 443
│   ├── Port 443 → HTTPS
│   │   ├── / → Frontend (React build)
│   │   └── /api → Backend (Django)
│   └── Static files & SSL certs
│
├── Django Backend
│   ├── Gunicorn (WSGI server)
│   ├── Port 8000 (internal only)
│   ├── Multiple workers
│   └── Celery (background tasks)
│
└── PostgreSQL
    ├── All databases
    ├── Backups
    └── Replication (optional)
```

### Production Setup (Option B: Microservices)

```
Load Balancer
├── API Gateway (Kong/AWS)
│   ├── Authentication validation
│   ├── Request routing
│   └── Rate limiting
│
├── CITC Service (Port 8000)
│   ├── Auth endpoints
│   └── User management
│
├── Events Service (Port 8001)
│   └── UniEventify APIs
│
└── LMS Service (Port 8002)
    └── LMS APIs

CDN (for static files)
├── React build
├── Images
└── CSS/JS bundles
```

---

**Documents Related to This Architecture:**

- INTEGRATION_ARCHITECTURE.md - Full design details
- IMPLEMENTATION_ROADMAP.md - Step-by-step implementation plan
- QUICK_START.md - Checklist and quick reference
