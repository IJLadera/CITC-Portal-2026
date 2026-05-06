# GreenWatts IoT Integration Guide

This document outlines how the CITC Portal integrates with the GreenWatts IoT
application, following the same pattern used for Syllabease and UniEventify.

## Overview

The GreenWatts IoT application is integrated into the CITC Portal through:

1. **Frontend**: App card in the dashboard that launches GreenWatts
2. **Backend**: Server-to-server synchronization and token verification
3. **Authentication**: Login credentials forwarded from CITC Portal to
   GreenWatts

## Architecture

### Frontend Integration

- GreenWatts appears as an app card in the dashboard at `/dashboard`
- Users can click the card to navigate to GreenWatts
- The app card is dynamically fetched from the `/api/v1/apps/` endpoint

### Backend Integration

The backend handles user synchronization and token verification:

```
CITC Portal                    GreenWatts IoT
    ↓                             ↓
    └──→ verify-greenwatts-token ─→ Verify user credentials
    ├──→ sync-greenwatts-user ────→ Sync user data
    └──→ (credentials passed via browser redirect)
```

## Configuration

### Environment Variables

Add these environment variables to your `.env` file or system environment:

```bash
# GreenWatts API Configuration
GREENWATTS_API_URL=http://localhost:8002  # or your GreenWatts server URL
GREENWATTS_SYNC_TOKEN=your-secure-sync-token
```

### Database Migration

Run the migration to add GreenWatts app to the database:

```bash
python manage.py migrate base_application
```

This will create a GreenWatts app entry in the `App` model with:

- Name: `GreenWatts`
- URL: `greenwatts/`
- Logo: Placeholder SVG (can be updated with actual logo)
- Display Order: 2 (after Syllabease)

## API Endpoints

### 1. Verify GreenWatts Token

**Endpoint**: `GET /api/auth/verify-greenwatts-token/`

**Authentication**: Required (Token)

**Description**: Verifies that a user's CITC Portal token is valid and syncs
user data to GreenWatts.

**Response**:

```json
{
    "valid": true,
    "user": {
        "uuid": "user-uuid",
        "email": "user@citc.edu",
        "first_name": "John",
        "last_name": "Doe",
        "id_number": "2024001",
        "is_student": true,
        "is_employee": false
    },
    "token_type": "Token"
}
```

**Usage**: Called by GreenWatts when verifying a CITC Portal user

### 2. Sync GreenWatts User

**Endpoint**: `POST /api/auth/sync-greenwatts-user/`

**Authentication**: Bearer token (GREENWATTS_SYNC_TOKEN)

**Description**: Synchronizes user data from CITC Portal to GreenWatts.

**Request Body**:

```json
{
    "user_id": "user-uuid"
}
```

**Response**:

```json
{
    "success": true,
    "message": "User synced successfully to GreenWatts",
    "user": { ... }
}
```

## User Data Synchronized

When a user logs in to CITC Portal and accesses GreenWatts, the following data
is synced:

- `id_number` - Student/Employee ID
- `email` - Email address
- `first_name` - First name
- `last_name` - Last name
- `middle_name` - Middle name (if available)
- `suffix` - Name suffix (if available)
- `is_student` - Student status
- `is_employee` - Employee status
- `is_staff` - Staff status
- `is_active` - Account active status
- `uuid` - User UUID
- `avatar` - User avatar URL (if available)

## Login Flow

### User Journey

1. User logs into CITC Portal
2. User navigates to Dashboard
3. User clicks on "GreenWatts" app card
4. Frontend extracts CITC Portal auth token
5. User is redirected to GreenWatts with token in query/header
6. GreenWatts calls `/api/auth/verify-greenwatts-token/` to verify token
7. CITC Portal verifies token and syncs user data
8. User is logged into GreenWatts with CITC credentials

### Credential Handling

**Important Security Notes**:

- Credentials are NOT passed directly in URLs
- Instead, a secure token is used for verification
- Server-to-server communication uses the `GREENWATTS_SYNC_TOKEN` for
  authentication
- Token verification is done via the REST API endpoint
- User data is synced on-demand, not stored on GreenWatts

## Frontend Components

### Dashboard App Listing

File: `project/spa/src/pages/Application/pages/dashboard/index.tsx`

The dashboard fetches apps from `/api/v1/apps/`:

```typescript
const response = await axios.get("/api/v1/apps/", {
    headers: { Authorization: `Token ${token}` },
});
```

Apps are displayed as clickable cards with logos:

```typescript
{
    apps.map((app) => (
        <div onClick={() => handleAppClick(app)}>
            <img src={appLogos[app.name]} alt={app.name} />
            <p>{app.name}</p>
        </div>
    ));
}
```

### Asset Integration

- GreenWatts logo: `project/spa/src/assets/apps/greenwatts.svg`
- Logo mapping in `appLogos` object for dynamic rendering

## Backend Module Structure

### GreenWatts Sync Module

File: `project/app/users/greenwatts_sync.py`

**Key Functions**:

- `sync_user_to_greenwatts(user)` - Sync user data to GreenWatts
- `verify_greenwatts_token(token)` - Verify CITC token is valid
- `create_user_in_greenwatts(...)` - Create new user in GreenWatts

### Views

File: `project/app/users/views.py`

**Endpoints**:

- `verify_greenwatts_token()` - GET endpoint for token verification
- `sync_greenwatts_user_endpoint()` - POST endpoint for user sync

### URLs

File: `project/app/users/urls.py`

Routes registered:

```python
path('verify-greenwatts-token/', verify_greenwatts_token),
path('sync-greenwatts-user/', sync_greenwatts_user_endpoint),
```

## Database Models

### App Model

File: `project/app/base_application/models.py`

GreenWatts is stored as an App instance:

```python
App(
    name='GreenWatts',
    description='IoT Energy Management and Monitoring System',
    url='greenwatts/',
    logo_url='...',
    is_active=True,
    is_visible_to_users=True,
    display_order=2
)
```

## Migration File

File: `project/app/base_application/migrations/0002_add_greenwatts_app.py`

Data migration that creates the GreenWatts app entry on first migration.

## Testing Integration

### Manual Testing Steps

1. **Start CITC Portal**:
   ```bash
   cd project
   python manage.py runserver 8000
   ```

2. **Verify GreenWatts App Exists**:
   ```bash
   curl http://localhost:8000/api/v1/apps/ \
     -H "Authorization: Token YOUR_TOKEN"
   ```
   Should see GreenWatts in the list

3. **Test Token Verification**:
   ```bash
   curl http://localhost:8000/api/auth/verify-greenwatts-token/ \
     -H "Authorization: Token YOUR_TOKEN"
   ```
   Should return user information

4. **Frontend Dashboard**:
   - Open `http://localhost:8000/` in browser
   - Log in with CITC credentials
   - Should see GreenWatts card in dashboard
   - Clicking the card should redirect to GreenWatts

## Troubleshooting

### GreenWatts App Not Showing

1. Check migration: `python manage.py migrate base_application`
2. Verify app is marked as `is_visible_to_users=True`
3. Ensure app is marked as `is_active=True`

### Token Verification Fails

1. Check `GREENWATTS_API_URL` environment variable
2. Verify token exists in database
3. Check GreenWatts is trying to call `/api/auth/verify-greenwatts-token/`

### Logo Not Loading

1. Check GreenWatts logo SVG exists at:
   `project/spa/src/assets/apps/greenwatts.svg`
2. Verify import in dashboard:
   `import greenwattsLogo from '../../../../assets/apps/greenwatts.svg'`
3. Check `appLogos` mapping includes: `GreenWatts: greenwattsLogo`

## Future Enhancements

1. **Real OAuth2 Integration**: Implement OAuth2 instead of token verification
2. **Bidirectional Sync**: Allow GreenWatts to update user data back to CITC
3. **Role-Based Access**: Control GreenWatts features based on CITC Portal roles
4. **Activity Logging**: Track user interactions with GreenWatts from CITC
   Portal
5. **Device Linkage**: Link GreenWatts IoT devices to CITC Portal user accounts

## Related Documentation

- [Syllabease Integration](./SYLLABEASE_INTEGRATION.md)
- [UniEventify Integration](./UniEventifyREADME.md)
- [Integration Architecture](./INTEGRATION_ARCHITECTURE.md)
- [User Management](./USER_MANAGEMENT_COMPLETE.md)
