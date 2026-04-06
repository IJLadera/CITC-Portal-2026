# CITC Multi-Capstone Integration - Quick Start Checklist

## Pre-Implementation Review

### Architecture Decision

- [ ] **Deployment Model Chosen:**
  - [ ] Option A: Single Django server with all capstones (Simple)
  - [ ] Option B: Separate microservices with API Gateway (Scalable)

- [ ] **Database Strategy Decided:**
  - [ ] Separate database per capstone (RECOMMENDED)
  - [ ] Shared database for all capstones

- [ ] **Integration Priority:**
  1. [ ] UniEventify (first)
  2. [ ] LMS (second)
  3. [ ] Other capstones (as needed)

---

## Phase 1: Frontend Restructuring

### 1.1 Create Configuration Files

```
✓ Checklist:
- [ ] Create: src/config/capstones.config.ts
  └─ Define all capstones (name, path, roles, icon, db)
  
- [ ] Create: src/types/capstone.types.ts
  └─ TypeScript interfaces for capstone structure
  
- [ ] Create: src/context/AuthContext.tsx
  └─ Centralized auth state management
```

### 1.2 Create New Components

```
✓ Checklist:
- [ ] Create: src/components/Sidebar.tsx
  └─ Dynamic navigation with capstone list
  
- [ ] Create: src/components/ProtectedRoute.tsx
  └─ Wrapper for authenticated routes
  
- [ ] Create: src/pages/Layout.tsx
  └─ Main layout with sidebar + content area
  
- [ ] Create: src/pages/Dashboard.tsx
  └─ Home/dashboard after login
```

### 1.3 Update Existing Components

```
✓ Checklist:
- [ ] Modify: src/App.tsx
  └─ Add React Router with new route structure
  └─ Implement ProtectedRoute wrapper
  └─ Add lazy loading for capstone modules
  
- [ ] Modify: src/services/auth.service.ts
  └─ Ensure token persistence
  └─ Add getUser() method
  └─ Add logout() method
  
- [ ] Modify: src/http.tsx (or API client)
  └─ Ensure all requests include auth token
  └─ Add interceptors for 401 errors
```

### 1.4 Create Module Structure

```
✓ Checklist for UniEventify:
- [ ] Create: src/modules/unieventify/
  ├─ [ ] pages/ (copy from existing pages)
  │  ├─ EventsList.tsx
  │  ├─ EventDetail.tsx
  │  └─ CreateEvent.tsx
  ├─ [ ] components/ (copy from existing components)
  │  ├─ EventCard.tsx
  │  └─ EventForm.tsx
  ├─ [ ] services/ (use existing auth service)
  │  └─ events.service.ts
  └─ [ ] index.tsx (module entry point)

✓ Checklist for LMS:
- [ ] Create: src/modules/lms/
  ├─ [ ] pages/
  │  ├─ CoursesList.tsx
  │  ├─ CourseDetail.tsx
  │  └─ EnrollmentPage.tsx
  ├─ [ ] components/
  │  ├─ CourseCard.tsx
  │  └─ CourseForm.tsx
  ├─ [ ] services/
  │  └─ courses.service.ts
  └─ [ ] index.tsx (module entry point)
```

### 1.5 Update Build Configuration

```
✓ Checklist:
- [ ] Verify: tsconfig.json paths (if using path aliases)
- [ ] Verify: package.json has all dependencies
- [ ] Test: npm run build (production build)
- [ ] Test: npm start (development server)
```

---

## Phase 2: Backend Setup

### 2.1 Centralize Authentication Endpoints

```
✓ Checklist:
- [ ] Update: app/auth/views.py
  └─ POST /api/v1/auth/token/login/
     └─ Returns: { auth_token, user: {...} }
  └─ POST /api/v1/auth/token/logout/
     └─ Invalidates token
  └─ GET /api/v1/auth/user/me/
     └─ Returns current user with roles

- [ ] Update: app/auth/urls.py
  ├─ [ ] path('token/login/', LoginView.as_view())
  ├─ [ ] path('token/logout/', LogoutView.as_view())
  └─ [ ] path('user/me/', UserDetailView.as_view())

- [ ] Create: app/auth/serializers.py
  └─ CustomLoginSerializer (include user details + roles)
```

### 2.2 Add User Role Information

````
✓ Checklist:
- [ ] Verify: User model has roles relationship
  └─ Check: app/users/models.py (should have ManyToMany roles)
  
- [ ] Update: auth response to include roles
  ```python
  def post(self, request):
    # ... existing login logic ...
    return Response({
      'auth_token': token.key,
      'user': {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'roles': [r.name for r in user.roles.all()],
        'department': user.department.name if user.department else None,
      }
    })
````

```
### 2.3 Add Capstone Access Endpoint (Optional)
```

✓ Checklist:

- [ ] Create: app/auth/views.py::AvailableCapstoneView
  ```python
  class AvailableCapstoneView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
      user = request.user
      capstones = []
      
      if user.roles.filter(name='admin').exists():
        capstones.extend(['unieventify', 'lms', 'admin'])
      else:
        if user.roles.filter(name__in=['dean', 'chairperson']).exists():
          capstones.append('unieventify')
        if user.roles.filter(name__in=['faculty', 'student']).exists():
          capstones.append('lms')
      
      return Response({'available_capstones': capstones})
  ```

- [ ] Add to urls: path('capstones/', AvailableCapstoneView.as_view())

```
### 2.4 Verify API Security
```

✓ Checklist:

- [ ] Check: Token authentication is enabled └─ Verify: REST_FRAMEWORK settings
      in settings.py └─ Should have:
      'rest_framework.authentication.TokenAuthentication'

- [ ] Check: CORS is properly configured └─ Verify: CORS_ALLOWED_ORIGINS in
      settings.py └─ Should include: frontend URLs

- [ ] Check: All protected endpoints require authentication └─ Run: python
      manage.py check

```
---

## Phase 3: Integration Testing

### 3.1 Frontend Testing
```

✓ Test Checklist:

- [ ] Test 1: Login Flow └─ [ ] Navigate to /login └─ [ ] Enter credentials └─ [
      ] Verify token stored in localStorage └─ [ ] Verify redirect to /dashboard

- [ ] Test 2: Sidebar Display └─ [ ] Verify sidebar shows available capstones └─
      [ ] Verify sidebar only shows capstones user has access to └─ [ ] Verify
      all capstone links are clickable

- [ ] Test 3: Module Navigation └─ [ ] Click UniEventify → Load events module └─
      [ ] Verify events page displays correctly └─ [ ] Verify API calls include
      auth token └─ [ ] Click LMS → Load courses module └─ [ ] Verify courses
      page displays correctly

- [ ] Test 4: Logout └─ [ ] Click Logout button └─ [ ] Verify token removed from
      localStorage └─ [ ] Verify redirect to /login

- [ ] Test 5: Page Refresh └─ [ ] Refresh page while in module └─ [ ] Verify
      session persists └─ [ ] Verify no duplicate requests

```
### 3.2 Backend Testing
```

✓ API Test Checklist (using Postman or curl):

- [ ] Test: POST /api/v1/auth/token/login/ └─ Valid credentials → returns {
      auth_token, user } └─ Invalid credentials → returns 400 error

- [ ] Test: GET /api/v1/auth/user/me/ └─ With token → returns user details └─
      Without token → returns 401 Unauthorized

- [ ] Test: GET /api/v1/auth/capstones/ └─ Returns list of capstones user can
      access

- [ ] Test: GET /api/v1/unieventify/events/ └─ With token → returns events └─
      Without token → returns 401

- [ ] Test: GET /api/v1/lms/courses/ └─ With token → returns courses └─ Without
      token → returns 401

```
### 3.3 Cross-Browser Testing
```

✓ Compatibility Checklist:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile (iOS Safari & Chrome)

✓ Specific Checks:

- [ ] localStorage availability
- [ ] CORS headers properly set
- [ ] Token sent in Authorization header

```
---

## Phase 4: Deployment Preparation

### 4.1 Build Optimization
```

✓ Checklist:

- [ ] Test production build: npm run build
- [ ] Check bundle size: should be reasonable
- [ ] Verify lazy loading works
- [ ] Test minification/compression

- [ ] Verify environment variables: └─ [ ] API_BASE_URL set correctly └─ [ ]
      DEBUG mode off └─ [ ] Security headers configured

```
### 4.2 Documentation
```

✓ Checklist:

- [ ] Update README.md with new architecture
- [ ] Document capstone registration process
- [ ] Document how to add new capstone modules
- [ ] Create deployment guide
- [ ] Document database setup for each capstone

✓ Files to Document:

- [ ] How to run locally (npm start + python runserver)
- [ ] How to deploy to production
- [ ] How to add a new capstone (step-by-step)
- [ ] API endpoints reference
- [ ] Troubleshooting guide

```
### 4.3 Database Migration
```

✓ Checklist:

- [ ] Database Setup (for separate DB approach): ├─ [ ] DB 1: CITC_DB (auth +
      core) │ └─ Models: User, Role, Permissions │ └─ Tables: auth_user,
      auth_role, auth_permission │ ├─ [ ] DB 2: EVENTS_DB (unieventify) │ └─
      Models: Event, Venue, EventType │ └─ Connection: via separate Django
      settings │ └─ [ ] DB 3: COURSES_DB (lms) └─ Models: Course, Enrollment,
      Assignment └─ Connection: via separate Django settings

- [ ] Django Settings: ├─ [ ] DATABASES['citc'] = {...} ├─ [ ]
      DATABASES['events'] = {...} └─ [ ] DATABASES['lms'] = {...}

- [ ] Apply migrations: └─ [ ] python manage.py migrate --database=citc └─ [ ]
      python manage.py migrate --database=events └─ [ ] python manage.py migrate
      --database=lms

```
---

## Phase 5: Final Checklist

### Before Going Live
```

✓ Pre-Launch Checklist:

- [ ] All tests passing (frontend + backend)
- [ ] No console errors/warnings
- [ ] Performance acceptable (< 2s page load)
- [ ] Security review completed └─ [ ] No hardcoded credentials └─ [ ] CSRF
      protection enabled └─ [ ] CORS properly configured └─ [ ] Token expiration
      tested

- [ ] Monitoring & Logging └─ [ ] Error logs configured └─ [ ] User activity
      logged └─ [ ] Performance metrics tracked

- [ ] User Documentation └─ [ ] User guide created └─ [ ] Troubleshooting guide
      created └─ [ ] Video tutorials (optional)

- [ ] Team Handoff └─ [ ] Code reviewed └─ [ ] Documentation reviewed └─ [ ]
      Training completed

```
### Post-Launch
```

✓ Day 1 Checklist:

- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Verify all endpoints working
- [ ] Monitor performance metrics
- [ ] Have rollback plan ready

✓ Week 1:

- [ ] Gather feedback
- [ ] Fix any critical bugs
- [ ] Monitor usage patterns
- [ ] Optimize performance bottlenecks

```
---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "TemplateDoesNotExist" | Ensure index.html in build directory |
| 401 Unauthorized errors | Verify token in Authorization header |
| CORS errors | Check CORS_ALLOWED_ORIGINS in Django settings |
| Module not loading | Verify lazy loading path matches capstone config |
| Token persists after logout | Clear localStorage in logout function |
| Sidebar not showing capstones | Verify user roles in database |

---

## Files Checklist Summary

### New Files to Create
```

✓ Frontend:

- src/config/capstones.config.ts
- src/types/capstone.types.ts
- src/context/AuthContext.tsx
- src/components/Sidebar.tsx
- src/components/ProtectedRoute.tsx
- src/pages/Layout.tsx
- src/pages/Dashboard.tsx
- src/modules/unieventify/index.tsx
- src/modules/lms/index.tsx

✓ Backend:

- app/auth/views.py (update)
- app/auth/urls.py (update)
- app/auth/serializers.py (update)

✓ Documentation:

- INTEGRATION_ARCHITECTURE.md ✓ (created)
- IMPLEMENTATION_ROADMAP.md ✓ (created)
- QUICK_START.md ✓ (this file)

```
### Files to Modify
```

✓ Frontend:

- src/App.tsx
- src/http.tsx or API client
- src/services/auth.service.ts
- package.json (if needed)

✓ Backend:

- core/settings.py
- core/urls.py
- core/middleware.py (optional)

```
---

## Getting Help

**Read these documents in order:**
1. INTEGRATION_ARCHITECTURE.md (overall design)
2. IMPLEMENTATION_ROADMAP.md (step-by-step plan)
3. QUICK_START.md (this file - checklist)

**Key Contact Points:**
- Architecture questions → Review INTEGRATION_ARCHITECTURE.md
- Implementation questions → Review IMPLEMENTATION_ROADMAP.md
- Quick reference → This file

---

## Version Control Strategy
```

Main Branches: ├── main (production) ├── develop (integration branch) │ Feature
Branches: ├── feature/frontend-restructuring ├── feature/unieventify-module ├──
feature/lms-module ├── feature/auth-centralization └── feature/api-gateway

Commit Convention:

- [FRONTEND]: Changes to React/TypeScript
- [BACKEND]: Changes to Django/Python
- [DOCS]: Documentation updates
- [CHORE]: Build, dependencies, etc.

Example: [FRONTEND]: Add Sidebar component for capstone navigation [BACKEND]:
Centralize auth endpoints [DOCS]: Update INTEGRATION_ARCHITECTURE.md

```
---

**Last Updated:** March 31, 2026
**Status:** Ready for Implementation
**Next Step:** Begin Phase 1 - Frontend Restructuring
```
