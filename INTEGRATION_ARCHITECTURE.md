# CITC Portal - Multi-Capstone Integration Architecture

## Overview

Transform CITC Portal into a unified platform that serves as the main
authentication hub with other capstones (UniEventify, LMS, etc.) accessible as
sub-applications through sidebar navigation.

---

## Phase 1: Architecture Design

### 1.1 High-Level Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    CITC Portal (Main Shell)                 │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Login      │  │  Sidebar Nav │  │   Auth       │      │
│  │              │  │              │  │   Token Mgmt │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ▼                  ▼                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         React Router - Route Handling               │    │
│  │                                                      │    │
│  │  / → Dashboard  | /events → UniEventify            │    │
│  │  /courses → LMS | /admin → Admin Panel             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         ▼                    ▼                    ▼
    ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
    │ Django Core │   │UniEventify  │   │    LMS       │
    │  (Auth/API) │   │  Backend    │   │  Backend     │
    └─────────────┘   └─────────────┘   └──────────────┘
         ▼                    ▼                    ▼
    ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
    │CITC Auth DB │   │Events DB    │   │Courses DB    │
    └─────────────┘   └─────────────┘   └──────────────┘
```

### 1.2 Key Design Principles

1. **Centralized Authentication**
   - CITC Portal handles login/logout
   - Token stored in localStorage/sessionStorage
   - Shared auth token across all capstones

2. **Micro-Frontend Architecture**
   - Each capstone is a separate React module
   - Can be developed/deployed independently
   - Share common UI components

3. **Independent Databases**
   - Each capstone maintains its own database
   - No direct database sharing between projects
   - Communication only through APIs

4. **API Gateway Pattern**
   - Single backend URL for all requests
   - Routes requests to appropriate capstone service
   - Validates authentication on each request

---

## Phase 2: Frontend Implementation

### 2.1 React Project Structure (Proposed)

```
spa/
├── src/
│   ├── App.tsx                 # Main app router
│   ├── pages/
│   │   ├── Login.tsx          # Login page
│   │   ├── Dashboard.tsx      # Dashboard
│   │   └── Layout.tsx         # Main layout with sidebar
│   ├── components/
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   ├── Header.tsx         # Header with user info
│   │   └── shared/            # Shared components
│   ├── modules/               # Capstone modules
│   │   ├── unieventify/       # UniEventify module
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── index.tsx      # Module entry
│   │   ├── lms/               # LMS module
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── index.tsx
│   │   └── admin/             # Admin module
│   ├── services/
│   │   ├── auth.service.ts    # Auth service
│   │   ├── api.client.ts      # API client
│   │   └── capstone.registry.ts
│   ├── store/                 # Redux/Context for global state
│   │   ├── auth.slice.ts
│   │   └── capstones.slice.ts
│   ├── config/
│   │   └── capstones.config.ts # Capstone routes config
│   └── types/
│       └── capstone.types.ts
```

### 2.2 Key Implementation Files

#### 2.2.1 Capstone Registry Configuration

```typescript
// src/config/capstones.config.ts
export const CAPSTONE_CONFIG = {
    unieventify: {
        name: "UniEventify",
        icon: "calendar",
        path: "/events",
        component: () => import("../modules/unieventify"),
        apiBase: "/api/v1/unieventify",
        requiredRoles: ["admin", "dean", "chairperson"],
        order: 1,
    },
    lms: {
        name: "Learning Management",
        icon: "book",
        path: "/courses",
        component: () => import("../modules/lms"),
        apiBase: "/api/v1/lms",
        requiredRoles: ["admin", "faculty", "student"],
        order: 2,
    },
    admin: {
        name: "Administration",
        icon: "settings",
        path: "/admin",
        component: () => import("../modules/admin"),
        apiBase: "/api/v1/admin",
        requiredRoles: ["admin"],
        order: 3,
    },
};
```

#### 2.2.2 Sidebar Navigation Component

```typescript
// src/components/Sidebar.tsx
import { CAPSTONE_CONFIG } from "../config/capstones.config";

export const Sidebar: React.FC = () => {
    const { user } = useAuth();

    const availableCapstones = Object.values(CAPSTONE_CONFIG).filter(
        (capstone) =>
            user?.roles?.some((r) => capstone.requiredRoles.includes(r)),
    ).sort((a, b) => a.order - b.order);

    return (
        <nav className="sidebar">
            <div className="logo">CITC Portal</div>
            <ul className="nav-menu">
                <li>
                    <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                    <hr />
                </li>
                {availableCapstones.map((capstone) => (
                    <li key={capstone.path}>
                        <Link to={capstone.path}>
                            <Icon name={capstone.icon} />
                            {capstone.name}
                        </Link>
                    </li>
                ))}
                <li>
                    <hr />
                </li>
                <li>
                    <Link to="/profile">Profile</Link>
                </li>
                <li>
                    <Button onClick={logout}>Logout</Button>
                </li>
            </ul>
        </nav>
    );
};
```

#### 2.2.3 Main Router Setup

```typescript
// src/App.tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { CAPSTONE_CONFIG } from "./config/capstones.config";
import Layout from "./pages/Layout";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

export const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Dynamic capstone routes */}
                    {Object.entries(CAPSTONE_CONFIG).map(([key, config]) => (
                        <Route
                            key={key}
                            path={`${config.path}/*`}
                            element={
                                <Suspense fallback={<div>Loading...</div>}>
                                    <LazyCapstoneModule config={config} />
                                </Suspense>
                            }
                        />
                    ))}
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </BrowserRouter>
    );
};
```

### 2.3 Authentication Flow

```typescript
// src/services/auth.service.ts
export class AuthService {
    private tokenKey = "authToken";
    private userKey = "currentUser";

    async login(email: string, password: string) {
        const response = await fetch("/api/v1/auth/token/login/", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        const { auth_token, user } = await response.json();

        // Store token
        localStorage.setItem(this.tokenKey, auth_token);
        localStorage.setItem(this.userKey, JSON.stringify(user));

        return { token: auth_token, user };
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    getUser() {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        window.location.href = "/login";
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}
```

---

## Phase 3: Backend Implementation

### 3.1 Django Backend Structure

```
project/
├── core/
│   ├── settings.py         # Centralized settings
│   ├── urls.py             # Main router
│   └── middleware/
│       └── auth_middleware.py
├── app/
│   ├── auth/               # Centralized auth app
│   │   ├── serializers.py
│   │   ├── views.py        # Login, logout, token refresh
│   │   └── permissions.py
│   ├── unieventify/        # UniEventify app (existing)
│   │   ├── models.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── lms/                # LMS app (existing)
│   │   ├── models.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── admin/              # Admin management
│   │   ├── views.py
│   │   └── urls.py
│   └── gateway/            # API Gateway/Routing
│       ├── views.py        # Route dispatcher
│       └── middleware.py   # Auth validation
```

### 3.2 URL Configuration Strategy

```python
# project/core/urls.py
from django.urls import path, include

urlpatterns = [
    # Authentication endpoints (centralized)
    path('api/v1/auth/', include('app.auth.urls')),
    
    # Capstone endpoints (each with own routing)
    path('api/v1/unieventify/', include('app.unieventify.urls')),
    path('api/v1/lms/', include('app.lms.urls')),
    path('api/v1/admin/', include('app.admin.urls')),
    
    # Gateway for shared services
    path('api/v1/gateway/', include('app.gateway.urls')),
]
```

### 3.3 Centralized Authentication Views

```python
# app/auth/views.py
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response

class LoginView(ObtainAuthToken):
    """Centralized login endpoint"""
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # Get user details
        user = request.user
        
        return Response({
            'auth_token': response.data['token'],
            'user': {
                'id': user.id,
                'uuid': str(user.uuid),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'roles': [role.name for role in user.roles.all()],
                'department': user.department.name if user.department else None,
            }
        })

class LogoutView(APIView):
    """Logout endpoint - invalidate token"""
    
    def post(self, request):
        request.user.auth_token.delete()
        return Response({'message': 'Logged out successfully'})
```

### 3.4 Token Validation Middleware

```python
# app/gateway/middleware.py
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import AnonymousUser

class TokenAuthMiddleware:
    """Validate tokens across all capstone endpoints"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if auth_header.startswith('Token '):
            token_key = auth_header[6:]
            try:
                token = Token.objects.get(key=token_key)
                request.user = token.user
            except Token.DoesNotExist:
                request.user = AnonymousUser()
        
        response = self.get_response(request)
        return response
```

---

## Phase 4: Deployment Strategy

### 4.1 Single Django Server with Multiple Frontends

**Option A: Integrated (Recommended for Small Teams)**

- Single Django backend serving all APIs
- Single React frontend with all capstone modules
- Easier deployment, centralized auth

**Option B: Micro-services (Recommended for Scalability)**

- Separate Django service for each capstone
- API Gateway (Kong, AWS API Gateway, or Django gateway app)
- Independent deployment pipelines
- Shared authentication service

### 4.2 Database Strategy

```
├── CITC_DB (PostgreSQL)
│   ├── auth_user
│   ├── auth_roles
│   ├── auth_permissions
│   └── audit_logs
├── EVENTS_DB (PostgreSQL)
│   ├── unieventify_event
│   ├── unieventify_venue
│   └── ...
└── LMS_DB (PostgreSQL)
    ├── lms_course
    ├── lms_enrollment
    └── ...
```

---

## Phase 5: Implementation Steps

### Step 1: Frontend Architecture

- [ ] Create sidebar navigation component
- [ ] Set up React Router for capstones
- [ ] Implement lazy loading for modules
- [ ] Create capstone registry config

### Step 2: Backend Setup

- [ ] Centralize auth endpoints
- [ ] Create API gateway routing
- [ ] Implement token validation middleware
- [ ] Add role-based capstone access

### Step 3: Module Integration

- [ ] Extract UniEventify as React module
- [ ] Extract LMS as React module
- [ ] Ensure APIs work with shared auth
- [ ] Test cross-capstone navigation

### Step 4: Testing & Documentation

- [ ] Integration tests
- [ ] API contract testing
- [ ] Update README with new architecture
- [ ] Document deployment process

---

## Phase 6: Migration Guide

### For Existing Capstones (e.g., UniEventify)

1. **Keep Django backend unchanged** - no database migration needed
2. **Extract React components as module:**
   ```
   spa/src/modules/unieventify/
   ├── pages/       # Copy from current structure
   ├── components/  # Copy from current structure
   ├── services/    # Copy from current structure
   └── index.tsx    # Module entry point
   ```

3. **Update API calls to use shared auth:**
   ```typescript
   // Instead of hardcoded auth
   // Use context: const { token } = useAuth();
   ```

4. **Register in capstone config:**
   ```typescript
   CAPSTONE_CONFIG.unieventify = { ... }
   ```

---

## Quick Reference: File Changes Required

### Frontend Changes

- [ ] `src/App.tsx` - Add router setup
- [ ] `src/components/Sidebar.tsx` - Create new
- [ ] `src/config/capstones.config.ts` - Create new
- [ ] `src/services/auth.service.ts` - Update
- [ ] Extract module: `src/modules/unieventify/`
- [ ] Extract module: `src/modules/lms/`

### Backend Changes

- [ ] `app/auth/views.py` - Centralize login
- [ ] `core/urls.py` - Update routing
- [ ] `core/middleware.py` - Add token validation
- [ ] `app/gateway/` - Create API gateway (optional)

---

## Technology Stack

| Layer          | Technology            | Purpose                                  |
| -------------- | --------------------- | ---------------------------------------- |
| Frontend Shell | React 18 + TypeScript | Main navigation & routing                |
| Auth           | Django REST Token     | Centralized authentication               |
| Backend        | Django 5.0            | API services                             |
| Database       | PostgreSQL            | Data storage (separate DBs per capstone) |
| State          | Redux / Context API   | Global auth state                        |
| HTTP Client    | Axios / Fetch         | API communication                        |

---

## Success Metrics

1. Single login system for all capstones
2. Seamless navigation between modules
3. Each capstone maintains independent database
4. Easy addition of new capstones
5. No code duplication across modules
6. Performance: < 2s module load time

---

## Common Challenges & Solutions

| Challenge                    | Solution                                 |
| ---------------------------- | ---------------------------------------- |
| Shared state between modules | Use Redux or Context API at root level   |
| Module dependencies          | Use npm workspaces or monorepo structure |
| Database conflicts           | Maintain separate DBs, sync via APIs     |
| Deployment complexity        | Use separate pipelines per service       |
| User role conflicts          | Implement fine-grained RBAC at backend   |
