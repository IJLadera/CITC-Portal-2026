# Syllabease2.0 Integration Guide

## Overview

Syllabease2.0 has been integrated into the CITC Portal as a **separate
microservice** with **unified user authentication**. When users log into CITC
Portal, they automatically have access to Syllabease2.0.

## Architecture

```
┌─────────────────────────┐
│   CITC Portal (Main)    │
│  - Users Database       │
│  - Authentication       │
│  - Sidebar Navigation   │
└────────┬────────────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
    ┌────▼──────────┐              ┌──────────▼──┐
    │   UniEventify │              │  Syllabease │
    │   (Integrated)│              │  (External) │
    └───────────────┘              └─────────────┘
```

### Key Points

- **CITC Portal** = Identity Provider (manages all users)
- **Syllabease2.0** = External Microservice (uses CITC tokens)
- **Authentication**: Users login to CITC, token is passed to Syllabease
- **User Sync**: User data syncs from CITC → Syllabease on login

## Implementation Timeline

### Step 1: Frontend Integration ✅

**Status**: COMPLETE

Changes:

- Added Syllabease icon to CITC Sidebar
  (`/project/spa/src/pages/Application/components/SideBar.tsx`)
- Created Syllabease component
  (`/project/spa/src/pages/Application/pages/syllabease/index.tsx`)
- Added routing in routers.tsx

The Syllabease link in the sidebar points to `/syllabease/dashboard/` which can
either:

1. **Iframe Mode** (default): Embeds Syllabease frontend and passes token via
   postMessage
2. **External Link Mode**: Redirects to external Syllabease instance with token

### Step 2: CORS Configuration ✅

**Status**: COMPLETE

**CITC Portal** (`/project/core/settings.py`):

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Syllabease2.0 frontend (Vite)
    'http://localhost:8001',  # Syllabease2.0 backend
    # ... other origins
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',  # Syllabease
    # ... other origins
]
```

**Syllabease2.0** (`/Syllabease2.0/backend/backend/settings.py`):

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # CITC Portal frontend
    "http://localhost:8000",  # CITC Portal backend
    # ... other origins
]
```

### Step 3: User Synchronization ✅

**Status**: COMPLETE

#### CITC Portal User Sync (`/project/app/users/syllabease_sync.py`)

Functions available:

- `sync_user_to_syllabease(user)` - Syncs a user from CITC to Syllabease
- `verify_syllabease_token(token)` - Verifies CITC token is valid
- `create_user_in_syllabease()` - Creates new user in Syllabease

#### New Endpoints in CITC Portal (`/project/app/users/urls.py`):

- `POST /auth/sync-user/` - Sync a specific user to Syllabease
- `GET /auth/verify-syllabease-token/` - Verify token for Syllabease

#### New Endpoints in Syllabease2.0 (`/Syllabease2.0/backend/users/urls.py`):

- `POST /auth/sync/` - Receive synced user data from CITC
- `GET /auth/verify-citc-token/` - Verify a CITC token

## Configuration Required

### Environment Variables

**CITC Portal** (`.env`):

```env
SYLLABEASE_API_URL=http://localhost:8001
SYLLABEASE_SYNC_TOKEN=your-secure-token-here
```

**Syllabease2.0** (`.env`):

```env
SYNC_TOKEN=your-secure-token-here
CITC_PORTAL_URL=http://localhost:8000
```

### Update Frontend Environment

**CITC Portal SPA** (`.env` or `vite.config.ts`):

```
REACT_APP_SYLLABEASE_URL=http://localhost:5173
```

## How It Works

### Login Flow

```
1. User enters credentials in CITC Portal
2. CITC authenticates user and generates token
3. Token stored in Redux state + sessionStorage
4. Sidebar renders with Syllabease link
5. User clicks Syllabease → Component mounts
6. Token passed to Syllabease via iframe postMessage or URL params
7. Syllabease receives token and:
   - If iframe mode: Uses postMessage to authenticate
   - If external mode: Includes token in request
8. User gets access to Syllabease without re-authenticating
```

### User Sync Flow

```
1. User logs into CITC Portal (via Djoser)
2. CITC calls sync_user_to_syllabease()
3. User data sent to Syllabease /auth/sync/ endpoint
4. Syllabease creates/updates user using id_number → faculty_id mapping
5. User now exists in both databases with same identity
```

## Usage Examples

### For Frontend Developers

#### Change Syllabease integration mode in component:

```typescript
// In /project/spa/src/pages/Application/pages/syllabease/index.tsx

const SYLLABEASE_CONFIG = {
    IFRAME_MODE: false, // Set to false for external linking
    IFRAME_URL: "http://localhost:5173",
    EXTERNAL_URL: "http://localhost:5173/syllabi",
};
```

#### Access token in Syllabease frontend:

```typescript
// Listen for CITC token via postMessage
window.addEventListener("message", (event) => {
    if (event.data.type === "CITC_AUTH_TOKEN") {
        const token = event.data.token;
        const user = event.data.user;
        // Store token in Syllabease state management
        // Use for API auth: Authorization: Token ${token}
    }
});
```

### For Backend Developers

#### Sync a user from CITC to Syllabease:

```python
from app.users.syllabease_sync import sync_user_to_syllabease
from app.users.models import User

user = User.objects.get(id_number='2024-0001')
success = sync_user_to_syllabease(user)
```

#### Add sync to login signal (optional):

```python
# In /project/app/users/apps.py or signals.py
from django.db.models.signals import post_save
from app.users.syllabease_sync import sync_user_to_syllabease

@receiver(post_save, sender=User)
def sync_new_user(sender, instance, created, **kwargs):
    if created:
        sync_user_to_syllabease(instance)
```

## Troubleshooting

### Issue: CORS Error when accessing Syllabease

**Solution**:

1. Check CORS_ALLOWED_ORIGINS in both settings.py files
2. Verify frontend URL is included in CORS_ALLOWED_ORIGINS
3. Restart both Django servers

### Issue: User sync failing

**Solution**:

1. Check SYLLABEASE_SYNC_TOKEN environment variable is set
2. Verify Syllabease backend is running
3. Check network between CITC and Syllabease
4. Use Django shell to test: `python manage.py shell` →
   `sync_user_to_syllabease(user)`

### Issue: Token not being passed to Syllabease

**Solution**:

1. Check if IFRAME_MODE is true/false as intended
2. If iframe: Check browser console for postMessage errors
3. If external: Ensure token is included in URL params
4. Verify Redux state has token stored

## Testing

### Test User Sync

```bash
# CITC Portal
curl -X POST http://localhost:8000/auth/sync-user/ \
  -H "Authorization: Bearer <YOUR_CITC_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "550e8400-e29b-41d4-a716-446655440000"}'
```

### Test Token Verification

```bash
# From Syllabease to verify CITC token
curl -X GET http://localhost:8000/auth/verify-syllabease-token/ \
  -H "Authorization: Token <YOUR_CITC_TOKEN>"
```

## Future Enhancements

1. **OAuth2/OIDC Integration**: Replace simple token-based auth with OAuth2
2. **Real-time User Sync**: WebSocket-based sync instead of HTTP
3. **Role-based Access**: Map CITC roles to Syllabease permissions
4. **Single Logout**: Logout from CITC logs out of Syllabease
5. **API Gateway**: Implement API gateway for better microservice management

## Security Considerations

1. **SYNC_TOKEN**: Keep the sync token secure (use .env, never commit)
2. **HTTPS**: Use HTTPS in production (not http://)
3. **Token Expiration**: Implement token refresh mechanism
4. **CORS**: Restrict CORS to specific domains in production
5. **Rate Limiting**: Add rate limiting to sync endpoint

## Support & Maintenance

- **CITC Portal Code**: `/project/`
- **Syllabease2.0 Code**: `/Syllabease2.0/`
- **Sync Code**:
  - CITC: `/project/app/users/syllabease_sync.py`
  - Syllabease: `/Syllabease2.0/backend/users/sync_endpoints.py`
