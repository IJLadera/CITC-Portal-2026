# CITC Portal - Multi-Capstone Integration Analysis

**Analysis Date**: May 6, 2026\
**Focus**: Syllabease 2.0 & GreenWatts_IoT Integration Architecture

---

## Executive Summary

The CITC Portal is a **monolithic hub** with **three distinct capstone
applications**:

1. **CITC Portal (Main)** - Central authentication & user management
2. **Syllabease 2.0** - Separate Django microservice (external)
3. **GreenWatts_IoT** - Standalone IoT monitoring system (separate)
4. **UniEventify** - Integrated as React module (internal)
5. **LMS** - Integrated as React module (internal)

**Key Architecture**: Token-based Single Sign-On (SSO) with centralized user
database.

---

## 1. Syllabease 2.0 Integration

### 1.1 How Syllabease Runs

**Type**: **Separate Django Microservice**

- **Backend**: Django 5.2 with React Vite frontend
- **Location**: `/Syllabease2.0/backend/` (independent from main CITC Portal)
- **Database**: Uses its own database (not shared with CITC)
- **Authentication**: JWT tokens (separate from CITC Token-based auth)
- **Runtime**: Runs on separate port (backend: `8001`, frontend: `5173`)

**Architectural Diagram**:

```
┌─────────────────────────────────────┐
│  CITC Portal (Main - Port 8000)     │
│  - Users Database (Central)         │
│  - Token Authentication             │
│  - Sidebar Navigation               │
└────────┬────────────────────────────┘
         │ SSO Token Exchange
         │ User Data Sync
         ▼
┌─────────────────────────────────────┐
│  Syllabease 2.0 (Port 8001)         │
│  - JWT Authentication               │
│  - Separate Database                │
│  - Frontend (Vite - Port 5173)      │
└─────────────────────────────────────┘
```

### 1.2 Authentication & Credential Sharing

**Syllabease 2.0 Authentication Model**:

| Component        | Type                           | Details                            |
| ---------------- | ------------------------------ | ---------------------------------- |
| **Primary Auth** | JWT (Access/Refresh)           | Token-based with refresh mechanism |
| **Storage**      | localStorage                   | `access`, `refresh`, `user` keys   |
| **Token Format** | Bearer Token                   | `Bearer <jwt_token>` in headers    |
| **Endpoints**    | `/api/login/`, `/api/refresh/` | JWT authentication endpoints       |

**CITC Portal Authentication Model**:

| Component        | Type                                        | Details                             |
| ---------------- | ------------------------------------------- | ----------------------------------- |
| **Primary Auth** | Token (Djoser)                              | REST Framework Token Authentication |
| **Storage**      | Redux/localStorage                          | Stored as `auth.token`              |
| **Token Format** | Token                                       | `Token <auth_token>` in headers     |
| **Endpoints**    | `/auth/token/login/`, `/auth/token/logout/` | Djoser endpoints                    |

### 1.3 Credential Sharing Mechanism

**How Users Access Syllabease**:

1. **Login to CITC Portal** → User authenticates with CITC token
2. **Click Syllabease Sidebar Link** → Token passed to Syllabease
3. **Syllabease Verifies Token** → Makes call to CITC verification endpoint
4. **User Data Synced** → Syllabease creates/updates local user record
5. **JWT Issued** → Syllabease issues its own JWT token

**Key Integration Files**:

#### CITC Portal → Syllabease Sync

- **File**:
  [project/app/users/syllabease_sync.py](project/app/users/syllabease_sync.py)

```python
# Main functions:
- sync_user_to_syllabease(user)      # Sync CITC user to Syllabease
- verify_syllabease_token(token)     # Verify CITC token is valid
- create_user_in_syllabease(...)     # Create new Syllabease user
```

#### CITC Portal API Endpoints

- **File**: [project/app/users/urls.py](project/app/users/urls.py) (lines 25-26)

```
GET  /auth/verify-syllabease-token/  → Verify CITC token + sync user
POST /auth/sync-user/                → Manual user sync (Bearer auth)
```

#### Syllabease Frontend Auth Context

- **File**:
  [Syllabease2.0/frontend/src/context/AuthContext.tsx](Syllabease2.0/frontend/src/context/AuthContext.tsx)

```typescript
// Stores JWT tokens from Syllabease backend:
- access: JWT token for API requests
- refresh: JWT token for refreshing access token
- user: User object from Syllabease
```

#### Syllabease API Client

- **File**:
  [Syllabease2.0/frontend/src/api.ts](Syllabease2.0/frontend/src/api.ts)

```typescript
// Auto-refreshes tokens on 401
// Uses Bearer token in Authorization header
// Implements token refresh queue for concurrent requests
```

### 1.4 CORS Configuration

**CITC Portal**
([project/core/settings.py](project/core/settings.py#L199-L206)):

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',    # Syllabease frontend (Vite)
    'http://localhost:8001',    # Syllabease backend
    'http://localhost:8000',    # CITC backend
    'http://localhost:3000',    # CITC frontend
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8000',
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',    # Syllabease
]
```

**Syllabease 2.0**
([Syllabease2.0/backend/backend/settings.py](Syllabease2.0/backend/backend/settings.py#L152-L162)):

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",      # Syllabease frontend
    "http://localhost:3000",      # CITC Portal frontend
    "http://localhost:8000",      # CITC Portal backend
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "https://syllabease2-0-deployment.vercel.app"
]
```

---

## 2. GreenWatts_IoT Integration

### 2.1 Architecture Overview

**Type**: **Standalone Django Application**

- **Backend**: Django 5.2 (separate from CITC Portal)
- **Location**: `/GreenWatts_IoT-main/GreenWatts_IoT-main/`
- **Database**: PostgreSQL on Supabase (production)
- **Frontend**: **NOT included** in this repo - likely deployed separately
- **Purpose**: IoT energy monitoring system with ESP32 sensors
- **Runtime**: Separate Django instance (likely port 8002 or production URL)

**Key Components**:

- Settings Module: `greenwatts.settings`
- Apps: `greenwatts.sensors`, `greenwatts.users`, `greenwatts.adminpanel`
- URL Router:
  [greenwatts/urls.py](GreenWatts_IoT-main/GreenWatts_IoT-main/greenwatts/urls.py)

### 2.2 GreenWatts Authentication

**Current Setup**:

| Aspect            | Details                                                  |
| ----------------- | -------------------------------------------------------- |
| **Auth Type**     | Django session-based (traditional)                       |
| **Database**      | PostgreSQL on Supabase (separate)                        |
| **Allowed Hosts** | `.onrender.com`, `localhost`, `127.0.0.1`                |
| **Frontend**      | Likely embedded or separate React app                    |
| **CORS**          | **NOT explicitly configured** (using session-based auth) |

**Database Configuration**:

```python
# Production: PostgreSQL on Supabase
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        ssl_require=True
    )
}

# Local fallback: SQLite
```

### 2.3 GreenWatts Structure

**Applications**:

1. **greenwatts.sensors** - IoT sensor data collection
2. **greenwatts.users** - User management
3. **greenwatts.adminpanel** - Administration interface

**Key Files**:

- [GreenWatts_IoT-main/GreenWatts_IoT-main/README.md](GreenWatts_IoT-main/GreenWatts_IoT-main/README.md) -
  2FA, Gmail API, weekly spike analysis
- [GreenWatts_IoT-main/GreenWatts_IoT-main/greenwatts/settings.py](GreenWatts_IoT-main/GreenWatts_IoT-main/greenwatts/settings.py) -
  Settings with LazyLoadingMiddleware

### 2.4 Current Integration Status

**GreenWatts is NOT integrated into CITC Portal**:

- ✗ No CORS configuration for CITC Portal
- ✗ No SSO mechanism
- ✗ No sidebar link
- ✗ No shared authentication
- ✗ Runs completely independent

**To Integrate GreenWatts** (future work):

1. Add CORS support to GreenWatts settings
2. Implement token verification endpoints
3. Create user sync mechanism
4. Add GreenWatts link to CITC sidebar
5. Implement SSO token exchange

---

## 3. Integration Architecture Comparison

### 3.1 Communication Patterns

| System             | Auth Type         | Database          | CORS Config       | Integration Status |
| ------------------ | ----------------- | ----------------- | ----------------- | ------------------ |
| **CITC Portal**    | Token (Djoser)    | SQLite/PostgreSQL | ✅ Configured     | **Hub/Central**    |
| **Syllabease 2.0** | JWT (DRF-JWT)     | Separate          | ✅ Configured     | **✅ Integrated**  |
| **UniEventify**    | Token (inherited) | Shared            | ✅ Via CITC       | **✅ Module**      |
| **LMS**            | Token (inherited) | Shared            | ✅ Via CITC       | **✅ Module**      |
| **GreenWatts_IoT** | Session (Django)  | Supabase          | ❌ Not configured | **❌ Standalone**  |

### 3.2 Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  User Logs Into CITC Portal                                 │
│  POST /api/v1/auth/token/login/                             │
│  Returns: { token: "abc123...", user: {...} }               │
└──────────────┬────────────────────────────────────────────┬─┘
               │                                             │
        ┌──────▼──────────┐                    ┌─────────────▼──┐
        │ Redux Store     │                    │ sessionStorage │
        │ auth.token      │                    │ auth_token     │
        └──────┬──────────┘                    └────────────────┘
               │
        ┌──────▼──────────────────────────────────────┐
        │ Axios Interceptor                           │
        │ Add: Authorization: Token abc123...         │
        └──────┬───────────────────────────────────────┘
               │
        ┌──────▼──────────────────────────────┐
        │ CITC API Calls                       │
        │ GET /api/v1/auth/users/me/           │
        │ GET /api/v1/unieventify/events/      │
        │ GET /api/v1/lms/courses/             │
        └──────────────────────────────────────┘
```

**When User Clicks Syllabease**:

```
1. Frontend: GET /syllabease/dashboard/ (component loads)
2. CITC Backend: GET /auth/verify-syllabease-token/
   └─ Returns: { valid: true, user: {...} }
   └─ Calls: sync_user_to_syllabease(user)
3. sync_user_to_syllabease():
   └─ POST to Syllabease /api/users/sync/
   └─ Headers: Authorization: Bearer {SYLLABEASE_SYNC_TOKEN}
   └─ Body: { id_number, email, first_name, ... }
4. Syllabease: POST /auth/login/ (if first time)
   └─ Returns: { access: "jwt_token", refresh: "refresh_token" }
5. Frontend: Stores JWT in localStorage
6. Subsequent requests: Authorization: Bearer jwt_token
```

---

## 4. Key Integration Files & Paths

### 4.1 CITC Portal Integration Files

| File                                                                                                     | Purpose           | Lines   |
| -------------------------------------------------------------------------------------------------------- | ----------------- | ------- |
| [project/core/settings.py](project/core/settings.py)                                                     | CORS, auth config | 195-230 |
| [project/api/urls.py](project/api/urls.py)                                                               | API routing       | 1-10    |
| [project/app/users/syllabease_sync.py](project/app/users/syllabease_sync.py)                             | Sync utilities    | 1-150   |
| [project/app/users/urls.py](project/app/users/urls.py)                                                   | Auth endpoints    | 20-30   |
| [project/app/users/views.py](project/app/users/views.py)                                                 | Auth views        | 85-130  |
| [project/spa/src/http.tsx](project/spa/src/http.tsx)                                                     | Axios config      | 1-20    |
| [project/spa/src/pages/authentication/Login/api.tsx](project/spa/src/pages/authentication/Login/api.tsx) | Login API call    | 1-15    |

### 4.2 Syllabease 2.0 Integration Files

| File                                                                                                     | Purpose          | Lines |
| -------------------------------------------------------------------------------------------------------- | ---------------- | ----- |
| [Syllabease2.0/backend/backend/settings.py](Syllabease2.0/backend/backend/settings.py)                   | CORS, JWT config | 1-180 |
| [Syllabease2.0/backend/backend/urls.py](Syllabease2.0/backend/backend/urls.py)                           | API routing      | 1-30  |
| [Syllabease2.0/backend/users/models.py](Syllabease2.0/backend/users/models.py)                           | User model       | 1-50  |
| [Syllabease2.0/frontend/src/api.ts](Syllabease2.0/frontend/src/api.ts)                                   | Axios JWT client | 1-80  |
| [Syllabease2.0/frontend/src/context/AuthContext.tsx](Syllabease2.0/frontend/src/context/AuthContext.tsx) | Auth state       | 1-100 |

### 4.3 GreenWatts_IoT Files

| File                                                                                                                             | Purpose       | Lines |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----- |
| [GreenWatts_IoT-main/GreenWatts_IoT-main/greenwatts/settings.py](GreenWatts_IoT-main/GreenWatts_IoT-main/greenwatts/settings.py) | Django config | 1-100 |
| [GreenWatts_IoT-main/GreenWatts_IoT-main/greenwatts/urls.py](GreenWatts_IoT-main/GreenWatts_IoT-main/greenwatts/urls.py)         | URL routing   | 1-20  |
| [GreenWatts_IoT-main/GreenWatts_IoT-main/requirements.txt](GreenWatts_IoT-main/GreenWatts_IoT-main/requirements.txt)             | Dependencies  | -     |

---

## 5. Authentication/Credential Sharing Mechanisms

### 5.1 CITC Portal → Syllabease2.0 (Token Bridge)

**Mechanism**: HTTP-based Token Verification & User Sync

**Flow**:

1. User authenticated in CITC Portal → Token stored in Redux
2. User clicks Syllabease → Component calls:
   ```
   GET /api/v1/auth/verify-syllabease-token/
   Header: Authorization: Token {CITC_TOKEN}
   ```
3. CITC verifies token and syncs user:
   ```python
   @api_view(['GET'])
   @permission_classes([permissions.IsAuthenticated])
   def verify_syllabease_token(request):
       user = request.user
       sync_user_to_syllabease(user)  # Sync to Syllabease DB
       return Response({"valid": True, "user": serializer.data})
   ```
4. Syllabease creates JWT token for user
5. User receives JWT and uses for subsequent requests

**Security**:

- CITC validates token server-side
- User data synced with `SYLLABEASE_SYNC_TOKEN` header
- Each system maintains its own token
- No shared secret key

### 5.2 CITC Portal → Syllabease2.0 (Direct Sync)

**Alternative Method**: Manual user sync endpoint

**Endpoint**:

```
POST /api/v1/auth/sync-user/
Header: Authorization: Bearer {SYLLABEASE_SYNC_TOKEN}
Body: { "user_id": "550e8400-e29b-41d4-a716-446655440000" }
```

**Purpose**: For administrative user creation/updates

### 5.3 Syllabease2.0 → CITC Portal (Verification)

**Reverse Verification**: Syllabease can verify CITC tokens

**Potential Endpoint** (to be implemented):

```
GET /api/auth/verify-citc-token/
Header: Authorization: Token {CITC_TOKEN}
Response: { "valid": true, "user": {...} }
```

**Implementation File**:
[Syllabease2.0/backend/users/urls.py](Syllabease2.0/backend/users/urls.py)

---

## 6. Configuration Summary

### 6.1 Environment Variables Required

**CITC Portal** (`.env`):

```env
SECRET_KEY=django-insecure-xyz
DATABASE_URL=postgresql://...
SYLLABEASE_API_URL=http://localhost:8001
SYLLABEASE_SYNC_TOKEN=secure-token-xyz
DEBUG=True
```

**Syllabease 2.0** (`.env`):

```env
SECRET_KEY=django-insecure-abc
DATABASE_URL=postgresql://...
SYNC_TOKEN=secure-token-xyz
CITC_PORTAL_URL=http://localhost:8000
DEBUG=True
```

**GreenWatts_IoT** (`.env`):

```env
SECRET_KEY=fallbacksecretkey
DATABASE_URL=postgresql://...
DEBUG=False
```

### 6.2 Running Multiple Systems Locally

**Terminal 1** - CITC Portal Backend:

```bash
cd project
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2** - CITC Portal Frontend:

```bash
cd project/spa
npm run dev  # Port 3000
```

**Terminal 3** - Syllabease Backend:

```bash
cd Syllabease2.0/backend
python manage.py runserver 0.0.0.0:8001
```

**Terminal 4** - Syllabease Frontend:

```bash
cd Syllabease2.0/frontend
npm run dev  # Port 5173
```

**Terminal 5** - GreenWatts:

```bash
cd GreenWatts_IoT-main/GreenWatts_IoT-main
python manage.py runserver 0.0.0.0:8002
```

---

## 7. Security Considerations

### 7.1 Token Types Used

| System         | Token Type             | Storage         | Scope           |
| -------------- | ---------------------- | --------------- | --------------- |
| **CITC**       | REST Framework Token   | localStorage    | All CITC APIs   |
| **Syllabease** | JWT (access + refresh) | localStorage    | Syllabease APIs |
| **GreenWatts** | Session Cookie         | httpOnly cookie | GreenWatts only |

### 7.2 CORS & CSRF Protection

- **CORS**: Configured for cross-origin requests
- **CSRF**: Enabled with X-CSRFTOKEN headers
- **Credentials**: Sent with credentials: true

### 7.3 Token Lifecycle

**CITC Tokens**:

- No expiration configured
- Invalidated on logout
- Stored in Redux state

**Syllabease JWT**:

- Access token: short-lived
- Refresh token: long-lived
- Auto-refresh on 401 response
- Cleared on logout

---

## 8. Recommendations

### 8.1 Immediate (Already Implemented)

✅ Syllabease 2.0 integrated with SSO\
✅ CORS configured for cross-system communication\
✅ User sync mechanism implemented\
✅ Token verification endpoints created

### 8.2 Short-term Improvements

1. **GreenWatts Integration**:
   - Add to CITC sidebar
   - Implement CORS for CITC origin
   - Create SSO token verification
   - Implement user sync

2. **Token Management**:
   - Add token expiration to CITC Portal
   - Implement refresh token mechanism
   - Add token revocation on logout

3. **Enhanced Security**:
   - Implement rate limiting on auth endpoints
   - Add audit logging for token verification
   - Encrypt sensitive data in sync payloads

### 8.3 Long-term Architecture

1. **OAuth 2.0 / OpenID Connect**:
   - Replace custom token systems
   - Centralized identity provider
   - Standard token formats

2. **API Gateway**:
   - Single entry point for all services
   - Centralized authentication
   - Rate limiting and logging

3. **Service Mesh** (if scaling):
   - Istio/Linkerd for service-to-service communication
   - Mutual TLS between services
   - Centralized policy enforcement

---

## 9. Quick Reference URLs

### CITC Portal APIs

```
POST   /api/v1/auth/token/login/          → Login
POST   /api/v1/auth/token/logout/         → Logout
GET    /api/v1/auth/users/me/             → Current user
GET    /api/v1/auth/verify-syllabease-token/  → Verify for Syllabease
POST   /api/v1/auth/sync-user/            → Manual sync
```

### Syllabease 2.0 APIs

```
POST   /api/login/                        → JWT login
POST   /api/refresh/                      → Refresh token
GET    /api/academics/                    → Academic data
POST   /api/auth/sync/                    → Receive user sync
GET    /api/auth/verify-citc-token/       → Verify CITC token (TBD)
```

### GreenWatts APIs

```
/admin/                                   → Django admin
/users/                                   → User management
/adminpanel/                              → Admin panel
/sensors/                                 → Sensor data
```

---

## 10. Troubleshooting

### Issue: CORS Error when accessing Syllabease from CITC

**Solution**: Ensure both systems have matching CORS configuration

```python
# Check CORS_ALLOWED_ORIGINS in both settings.py files
# Ensure frontend origins are included
```

### Issue: User not syncing to Syllabease

**Solution**: Verify sync endpoint and token

```bash
curl -X POST http://localhost:8001/api/users/sync/ \
  -H "Authorization: Bearer {SYLLABEASE_SYNC_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"faculty_id":"user123"}'
```

### Issue: Token not working after login

**Solution**: Check token storage and axios interceptors

```typescript
// Verify token in Redux store
console.log(store.getState().auth.token);

// Check axios header
console.log(http.defaults.headers);
```

---

## Conclusion

The CITC Portal implements a **hub-and-spoke architecture** with:

- **Central hub**: CITC Portal (authentication + user management)
- **Integrated spokes**: UniEventify & LMS (React modules)
- **External microservice**: Syllabease 2.0 (separate Django app)
- **Standalone system**: GreenWatts_IoT (no integration yet)

Token-based authentication enables seamless SSO across systems while maintaining
independence and scalability.
