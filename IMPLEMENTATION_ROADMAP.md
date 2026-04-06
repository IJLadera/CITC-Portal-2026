# CITC Portal Integration - Implementation Roadmap

## Executive Summary

Transform CITC Portal into a unified capstone platform where:

- **CITC Portal** = Main authentication hub + shell UI
- **UniEventify, LMS, etc.** = Sub-modules accessible via sidebar
- **Single login** → Access all available capstones based on user role
- **Independent databases** → Each capstone maintains its own data structure

---

## Architecture Quick Start

### What Stays the Same

✓ Django backend APIs (no breaking changes) ✓ Database structures for each
capstone ✓ Business logic in each app ✓ Authentication tokens (already using
Token Auth)

### What Changes

✗ React frontend: Convert to modular structure ✗ Navigation: Add sidebar with
dynamic capstone list ✗ Routing: Center routes around capstone modules ✗ Entry
point: Single login screen for all capstones

---

## Implementation Phases

### Phase 1: Frontend Architecture (Week 1-2)

**Goal:** Restructure React app to support multiple capstone modules

**Tasks:**

1. Create sidebar navigation component
   - Show capstones user has access to (based on roles)
   - Dynamically load available capstones

2. Set up React Router for modularity
   - `/login` → Login page
   - `/dashboard` → Main dashboard
   - `/events/*` → UniEventify module
   - `/courses/*` → LMS module
   - `/admin/*` → Admin module

3. Create capstone registry
   ```typescript
   // Define which capstones exist, their routes, required roles, etc.
   CAPSTONE_CONFIG = {
     unieventify: { path: '/events', roles: ['admin', 'dean'], ... },
     lms: { path: '/courses', roles: ['admin', 'faculty'], ... },
   }
   ```

4. Implement lazy loading
   - Only load capstone modules when accessed
   - Reduces initial bundle size

**Files to Create/Modify:**

- `src/config/capstones.config.ts` (NEW)
- `src/components/Sidebar.tsx` (NEW)
- `src/App.tsx` (MODIFY - new router setup)
- `src/pages/Layout.tsx` (NEW - main layout with sidebar)

---

### Phase 2: Modularize Existing Capstones (Week 2-3)

**Goal:** Convert existing capstones into importable modules

**UniEventify Example:**

```
Current:
spa/src/pages/Events.tsx
spa/src/components/EventList.tsx

New Structure:
spa/src/modules/unieventify/
├── pages/
│   ├── EventsList.tsx
│   ├── EventDetail.tsx
│   └── CreateEvent.tsx
├── components/
│   ├── EventCard.tsx
│   └── EventForm.tsx
├── services/
│   └── events.service.ts
└── index.tsx (entry point)
```

**Tasks:**

1. Create module folders for each capstone
2. Move components into module structure
3. Keep API logic separate (already done with services)
4. Create module entry points

**LMS can follow the same pattern**

---

### Phase 3: Centralized Authentication (Week 3)

**Goal:** Ensure all modules use shared authentication

**Current State:**

- Already using Django Token Authentication ✓
- Auth stored in localStorage ✓

**What to Add:**

1. Create Auth Context/Redux slice
   ```typescript
   const AuthContext = {
     user: { id, email, roles, ... }
     token: 'auth_token_...'
     login: (email, password) => {}
     logout: () => {}
     isAuthenticated: () => boolean
   }
   ```

2. Create Protected Route wrapper
   ```typescript
   <ProtectedRoute>
       <Layout /> {/* Shows login if not authenticated */}
   </ProtectedRoute>;
   ```

3. Ensure all API calls use shared token
   ```typescript
   // All HTTP calls include: Authorization: Token <token>
   ```

**Files to Create/Modify:**

- `src/context/AuthContext.tsx` (NEW)
- `src/components/ProtectedRoute.tsx` (NEW)
- `src/services/auth.service.ts` (NEW/UPDATE)

---

### Phase 4: Backend Gateway Setup (Week 4)

**Goal:** Ensure backend routes all capstone requests correctly

**Current Django URLs:**

```
/api/v1/auth/token/login/      ← Login endpoint
/api/v1/unieventify/events/     ← Events API
/api/v1/lms/courses/            ← LMS API
```

**What Needs Updating:**

1. **Centralize Auth Endpoints:**
   ```python
   # core/urls.py
   urlpatterns = [
       path('api/v1/auth/', include('app.auth.urls')),
       path('api/v1/unieventify/', include('app.unieventify.urls')),
       path('api/v1/lms/', include('app.lms.urls')),
   ]
   ```

2. **Add User Profile Endpoint** (if not exists):
   ```
   GET /api/v1/auth/user/me/ 
   → Returns: { user_id, email, roles, department, ... }
   ```

3. **Add Capstone Access Check** (optional but recommended):
   ```
   GET /api/v1/auth/capstones/
   → Returns: [ 'unieventify', 'lms', 'admin' ] 
   (Only capstones user has access to)
   ```

**Backend files to create/modify:**

- `app/auth/views.py` - Add user profile & capstone list endpoints
- `app/auth/urls.py` - Expose new endpoints

---

### Phase 5: Integration Testing (Week 4-5)

**Goal:** Ensure all capstones work together seamlessly

**Test Scenarios:**

1. ✓ Login on CITC Portal
2. ✓ See UniEventify in sidebar (if user has access)
3. ✓ Click on UniEventify → Load module & display events
4. ✓ Switch to another capstone via sidebar
5. ✓ Logout → All sessions cleared
6. ✓ Re-login → State restored

**Browser Compatibility:**

- ✓ Token persistence across page refreshes
- ✓ CORS issues (if capstones on different ports/servers)
- ✓ LocalStorage availability

---

## Deployment Strategy

### Option A: Single Django Server (Simple)

```
┌─────────────────────────────────┐
│  Django Backend (port 8000)     │
│                                 │
│  ├─ /api/v1/auth               │
│  ├─ /api/v1/unieventify/        │
│  ├─ /api/v1/lms/                │
│  └─ / → Serve React build       │
│                                 │
│  Database: PostgreSQL           │
│  (One DB with all schemas)      │
└─────────────────────────────────┘
```

**Pros:** Simple, one deployment **Cons:** Monolithic, single point of failure

---

### Option B: Microservices (Scalable)

```
        ┌─────────────┐
        │ API Gateway │ (Nginx/Kong)
        └──────┬──────┘
        ┌──────┴──────────────┐
        │                     │
┌───────▼─────┐      ┌──────▼────────┐
│ CITC Service│      │ Event Service │
│ (port 8000) │      │ (port 8001)   │
└───────┬─────┘      └──────┬────────┘
        │                   │
┌───────▼───┐      ┌────────▼────┐
│ Auth DB   │      │ Events DB   │
└───────────┘      └─────────────┘
```

**Pros:** Scalable, independent deployment, separate DBs **Cons:** More complex
setup, CORS handling needed

---

## Sample Code Snippets

### Creating Sidebar Component

```typescript
// src/components/Sidebar.tsx
import { useAuth } from "../context/AuthContext";
import { CAPSTONE_CONFIG } from "../config/capstones.config";

export const Sidebar = () => {
    const { user, logout } = useAuth();

    // Filter capstones user has access to
    const accessibleCapstones = Object.values(CAPSTONE_CONFIG)
        .filter((cap) =>
            user?.roles?.some((r) => cap.requiredRoles.includes(r))
        )
        .sort((a, b) => a.order - b.order);

    return (
        <aside className="sidebar">
            <h1>CITC Portal</h1>
            <nav>
                <ul>
                    <li>
                        <Link to="/dashboard">Dashboard</Link>
                    </li>
                    <li>
                        <hr />
                    </li>
                    {accessibleCapstones.map((cap) => (
                        <li key={cap.path}>
                            <Link to={cap.path}>{cap.name}</Link>
                        </li>
                    ))}
                    <li>
                        <hr />
                    </li>
                    <li>
                        <button onClick={logout}>Logout</button>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};
```

### Capstone Configuration

```typescript
// src/config/capstones.config.ts
export const CAPSTONE_CONFIG = {
    unieventify: {
        name: "UniEventify",
        icon: "calendar",
        path: "/events",
        requiredRoles: ["admin", "dean", "chairperson", "faculty"],
        component: () => import("../modules/unieventify"),
        apiBase: "/api/v1/unieventify",
        order: 1,
    },
    lms: {
        name: "Learning Management",
        icon: "book",
        path: "/courses",
        requiredRoles: ["admin", "faculty", "student"],
        component: () => import("../modules/lms"),
        apiBase: "/api/v1/lms",
        order: 2,
    },
    admin: {
        name: "Administration",
        icon: "settings",
        path: "/admin",
        requiredRoles: ["admin"],
        component: () => import("../modules/admin"),
        apiBase: "/api/v1/admin",
        order: 3,
    },
};
```

---

## Timeline Estimate

| Phase                          | Duration      | Effort            |
| ------------------------------ | ------------- | ----------------- |
| Phase 1: Frontend architecture | 1-2 weeks     | High              |
| Phase 2: Modularize capstones  | 1-2 weeks     | Medium            |
| Phase 3: Centralized auth      | 3-4 days      | Low               |
| Phase 4: Backend setup         | 3-4 days      | Low               |
| Phase 5: Testing & refinement  | 1 week        | Medium            |
| **Total**                      | **3-4 weeks** | **3-4 dev weeks** |

---

## Risks & Mitigation

| Risk                               | Impact | Mitigation                                      |
| ---------------------------------- | ------ | ----------------------------------------------- |
| Breaking existing functionality    | High   | Maintain all existing APIs, backward compatible |
| Token expiration across modules    | Medium | Implement token refresh strategy                |
| CORS issues with separate services | Medium | Use API Gateway or same-origin deployment       |
| Database conflicts                 | Low    | Maintain separate DBs per capstone              |
| Performance degradation            | Medium | Implement lazy loading, code splitting          |

---

## Next Steps

1. **Review** this architecture with your team
2. **Decide:** Single server vs Microservices approach
3. **Prioritize:** Which capstones to integrate first
4. **Start Phase 1:** Frontend restructuring
5. **Iterate:** Test and refine with each capstone integration

---

## Questions to Clarify

1. Should new capstones share the same database or maintain separate DBs?
2. Are capstones deployed on same server or different servers?
3. What's the priority order for integration (UniEventify first, then LMS)?
4. Should existing URLs change, or keep backward compatibility?
5. Any real-time features requiring WebSocket support?
