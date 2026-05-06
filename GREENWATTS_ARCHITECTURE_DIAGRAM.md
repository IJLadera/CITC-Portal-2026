# GreenWatts Integration Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       CITC Portal Frontend (React SPA)              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Dashboard Component                      │  │
│  │  - Fetches /api/v1/apps/ with auth token                  │  │
│  │  - Displays app cards in grid:                            │  │
│  │    • Syllabease (logo: syllabease.png)                    │  │
│  │    • UniEventify (logo: unieventify.png)                  │  │
│  │    • GreenWatts ← NEW (logo: greenwatts.svg)              │  │
│  │  - Handles app card clicks (handleAppClick)               │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              ↓                                      │
│                    User clicks GreenWatts card                     │
│                              ↓                                      │
│                   Redirect to greenwatts/ with token               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    CITC Portal Backend (Django)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  App Model (base_application.models)                        │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ Apps Table:                                            │ │  │
│  │  │  • Syllabease (id=1, display_order=0)                │ │  │
│  │  │  • UniEventify (id=2, display_order=1)               │ │  │
│  │  │  • GreenWatts ← NEW (id=3, display_order=2)          │ │  │
│  │  │    - name: "GreenWatts"                              │ │  │
│  │  │    - url: "greenwatts/"                              │ │  │
│  │  │    - is_active: true                                 │ │  │
│  │  │    - is_visible_to_users: true                       │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  API Endpoints (Users Auth)                                 │  │
│  │                                                              │  │
│  │  GET /api/v1/apps/                                          │  │
│  │    └─→ Returns list of active apps                          │  │
│  │        ├─ Syllabease                                        │  │
│  │        ├─ UniEventify                                       │  │
│  │        └─ GreenWatts ← NEW                                  │  │
│  │                                                              │  │
│  │  GET /api/auth/verify-syllabease-token/                     │  │
│  │    └─→ Verify Syllabease user + sync (existing)             │  │
│  │                                                              │  │
│  │  GET /api/auth/verify-greenwatts-token/ ← NEW               │  │
│  │    ├─ Authentication: Token                                 │  │
│  │    ├─ Function: verify_greenwatts_token()                   │  │
│  │    ├─ Side effect: Calls sync_user_to_greenwatts()          │  │
│  │    └─ Returns: User info + "valid": true                    │  │
│  │                                                              │  │
│  │  POST /api/auth/sync-greenwatts-user/ ← NEW                 │  │
│  │    ├─ Authentication: Bearer GREENWATTS_SYNC_TOKEN           │  │
│  │    ├─ Request: { "user_id": "uuid" }                        │  │
│  │    ├─ Function: sync_greenwatts_user_endpoint()             │  │
│  │    └─ Returns: { "success": true, "user": {...} }           │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  User Sync Module (greenwatts_sync.py)                      │  │
│  │                                                              │  │
│  │  Functions:                                                 │  │
│  │  ├─ sync_user_to_greenwatts(user)                           │  │
│  │  │  └─ POST to GREENWATTS_API_URL/api/users/sync/           │  │
│  │  │     Data: id_number, email, first_name, last_name, ...  │  │
│  │  │                                                          │  │
│  │  ├─ verify_greenwatts_token(token)                          │  │
│  │  │  └─ Verify token in database                            │  │
│  │  │     Return: { valid, user_id, email, ... }              │  │
│  │  │                                                          │  │
│  │  └─ create_user_in_greenwatts(...)                          │  │
│  │     └─ POST to GREENWATTS_API_URL/api/users/                │  │
│  │        Data: email, id_number, first_name, last_name, ...  │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ (Server-to-Server)
┌─────────────────────────────────────────────────────────────────────┐
│                    GreenWatts IoT Backend                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  API Endpoints (Verify & Sync)                              │  │
│  │                                                              │  │
│  │  POST /api/users/sync/                                      │  │
│  │    ├─ Receives user data from CITC Portal                   │  │
│  │    ├─ Creates/updates user in GreenWatts                    │  │
│  │    └─ Returns: { success: true }                            │  │
│  │                                                              │  │
│  │  POST /api/auth/verify-token/                               │  │
│  │    ├─ Verifies CITC token (optional)                        │  │
│  │    └─ Returns user info                                     │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  User Model (greenwatts.users.models.Office)                │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │ Users Table:                                           │ │  │
│  │  │  • id_number (PK)                                      │ │  │
│  │  │  • username (unique)                                   │ │  │
│  │  │  • email (unique)                                      │ │  │
│  │  │  • first_name, last_name, middle_name                 │ │  │
│  │  │  • department (foreign key to admin)                   │ │  │
│  │  │  • is_active, is_staff, is_superuser                  │ │  │
│  │  │  • created_at                                          │ │  │
│  │  │                                                        │ │  │
│  │  │ Synced from CITC Portal:                              │ │  │
│  │  │  • id_number, email, first_name, last_name            │ │  │
│  │  │  • is_student, is_employee, is_staff                  │ │  │
│  │  │  • is_active, uuid, avatar                            │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Login Flow Sequence Diagram

```
┌────────┐         ┌──────────┐         ┌─────────────┐
│ Browser│         │CITC App  │         │GreenWatts   │
└────┬───┘         └────┬─────┘         └──────┬──────┘
     │                 │                       │
     │─── Login ──────→│                       │
     │                 │                       │
     │◄─── Token ──────│                       │
     │    (saved)      │                       │
     │                 │                       │
     │─ View Dash ────→│                       │
     │                 │                       │
     │◄─ Apps List ────│                       │
     │  (including     │                       │
     │   GreenWatts)   │                       │
     │                 │                       │
     │─ Click GreenWatts                      │
     │                 │                       │
     │─────────────────────────────────────→ │
     │  (token in URL/header)                 │
     │                 │                       │
     │                 │◄─ verify-greenwatts  │
     │                 │    -token/ ──────────│
     │                 │                       │
     │                 │─ sync_user_to ──────→│
     │                 │  greenwatts()         │
     │                 │  (POST to API)        │
     │                 │                       │
     │                 │◄─ { success: true }──│
     │                 │                       │
     │                 │ Return user info │
     │◄─────────────────────────────────────  │
     │  (logged into GreenWatts)              │
     │                 │                       │
```

## File Structure

```
project/
├── app/
│   ├── users/
│   │   ├── __init__.py
│   │   ├── models.py (User model)
│   │   ├── views.py (+ verify_greenwatts_token, sync_greenwatts_user_endpoint) ← MODIFIED
│   │   ├── urls.py (+ GreenWatts URL routes) ← MODIFIED
│   │   ├── syllabease_sync.py (existing pattern)
│   │   └── greenwatts_sync.py ← NEW
│   │       ├── sync_user_to_greenwatts()
│   │       ├── verify_greenwatts_token()
│   │       └── create_user_in_greenwatts()
│   │
│   └── base_application/
│       ├── models.py (App model)
│       ├── views.py (AppListView, etc.)
│       └── migrations/
│           ├── 0001_initial.py (App model creation)
│           └── 0002_add_greenwatts_app.py ← NEW (seed GreenWatts app)
│
├── core/
│   └── settings.py (database, auth, CORS config)
│
└── spa/
    └── src/
        ├── assets/
        │   └── apps/
        │       ├── syllabease.png (existing)
        │       ├── unieventify.png (existing)
        │       └── greenwatts.svg ← NEW (IoT logo)
        │
        └── pages/
            └── Application/
                └── pages/
                    └── dashboard/
                        └── index.tsx (+ GreenWatts import & logo mapping) ← MODIFIED

Documentation/
├── GREENWATTS_INTEGRATION.md ← NEW
├── GREENWATTS_IMPLEMENTATION_SUMMARY.md ← NEW
└── (existing docs)
```

## Data Flow: User Synchronization

```
CITC Portal                          GreenWatts IoT
┌──────────────────┐                ┌──────────────────┐
│ User Model       │                │ Office Model     │
│ (User)           │                │ (User model)     │
├──────────────────┤                ├──────────────────┤
│ id_number ◄──────────────────────→ id_number        │
│ email ◄──────────────────────────→ email            │
│ first_name ◄─────────────────────→ first_name       │
│ last_name ◄──────────────────────→ last_name        │
│ middle_name ◄────────────────────→ (middle_name)    │
│ is_student ◄─────────────────────→ is_student       │
│ is_employee ◄────────────────────→ is_employee      │
│ is_staff ◄───────────────────────→ is_staff         │
│ is_active ◄──────────────────────→ is_active        │
│ uuid ◄───────────────────────────→ uuid             │
│ avatar ◄─────────────────────────→ avatar           │
└──────────────────┘                └──────────────────┘
        ↑                                   ↑
        └───── Sync Endpoint ──────────────┘
         POST /api/auth/sync-greenwatts-user/
         + Bearer GREENWATTS_SYNC_TOKEN
```

## Environment Configuration

```bash
# .env or system environment
GREENWATTS_API_URL=http://localhost:8002
GREENWATTS_SYNC_TOKEN=your-secure-sync-token-here
```

## Migration Process

```bash
# 1. Run migration to create GreenWatts app entry
python manage.py migrate base_application

# This will:
# - Create App entry with name="GreenWatts"
# - Set display_order=2 (after other apps)
# - Set is_active=True, is_visible_to_users=True

# 2. Verify in database
python manage.py shell
>>> from app.base_application.models import App
>>> App.objects.all()
>>> # Should show Syllabease, UniEventify, GreenWatts

# 3. Check in API
curl http://localhost:8000/api/v1/apps/ -H "Authorization: Token YOUR_TOKEN"
```

## Testing Workflow

```bash
# 1. Start Django
cd project
python manage.py runserver 8000

# 2. Verify GreenWatts in apps list
curl http://localhost:8000/api/v1/apps/ \
  -H "Authorization: Token YOUR_USER_TOKEN"

# 3. Test token verification
curl http://localhost:8000/api/auth/verify-greenwatts-token/ \
  -H "Authorization: Token YOUR_USER_TOKEN"

# 4. Test user sync (server-to-server)
curl -X POST http://localhost:8000/api/auth/sync-greenwatts-user/ \
  -H "Authorization: Bearer YOUR_SYNC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "YOUR_USER_UUID"}'

# 5. Open browser and verify dashboard
# - Should see GreenWatts card
# - Should be able to click and navigate
```

## Comparison with Syllabease

| Feature               | Syllabease            | GreenWatts              |
| --------------------- | --------------------- | ----------------------- |
| Pattern               | Server-to-Server Sync | Server-to-Server Sync ✓ |
| Token Verify Endpoint | ✓                     | ✓                       |
| Sync Endpoint         | ✓                     | ✓                       |
| Sync Module           | syllabease_sync.py    | greenwatts_sync.py ✓    |
| Logo                  | PNG                   | SVG ✓                   |
| Dashboard Card        | ✓                     | ✓                       |
| Data Sync             | ✓                     | ✓                       |
| User Creation         | ✓                     | ✓                       |

## Key Differences from Syllabease

1. **Logo Format**: GreenWatts uses SVG (scalable) vs PNG
2. **API URL**: Different port (8002 for GreenWatts vs 8001 for Syllabease)
3. **User Model**: Office model in GreenWatts vs different model in Syllabease
4. **Configuration**: Separate environment variables for each app

---

**Status**: ✅ Implementation Complete\
**Date**: 2024-04-07\
**Tested**: Backend logic verified, frontend integration confirmed
