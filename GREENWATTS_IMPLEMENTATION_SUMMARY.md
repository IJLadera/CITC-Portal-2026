# GreenWatts Integration - Implementation Summary

**Date**: 2024-04-07\
**Status**: ✅ Complete\
**Integration Pattern**: Server-to-Server Sync + Token Verification (Same as
Syllabease/UniEventify)

## Overview

The GreenWatts IoT application has been fully integrated into the CITC Portal.
When users log in to the CITC Portal, they can access GreenWatts from the
dashboard. The system automatically syncs their credentials and user data using
a secure token-based approach.

## Files Created

### 1. Backend Integration Module

**File**: `project/app/users/greenwatts_sync.py`

- **Purpose**: Handle user synchronization between CITC Portal and GreenWatts
  IoT
- **Key Functions**:
  - `sync_user_to_greenwatts()` - Synchronize user data to GreenWatts
  - `verify_greenwatts_token()` - Verify CITC Portal token validity
  - `create_user_in_greenwatts()` - Create new user in GreenWatts

### 2. Database Migration

**File**: `project/app/base_application/migrations/0002_add_greenwatts_app.py`

- **Purpose**: Data migration to seed the GreenWatts app in the database
- **Creates**: App entry with name "GreenWatts", description, and logo URL

### 3. Frontend Asset

**File**: `project/spa/src/assets/apps/greenwatts.svg`

- **Purpose**: SVG logo for GreenWatts app in dashboard
- **Design**: Green IoT-themed logo with light bulb and network nodes

### 4. Integration Documentation

**File**: `GREENWATTS_INTEGRATION.md`

- **Purpose**: Comprehensive guide for developers and administrators
- **Contents**: Configuration, API endpoints, user flow, troubleshooting

## Files Modified

### 1. User Views

**File**: `project/app/users/views.py`

- **Changes**:
  - Added import for `greenwatts_sync` module
  - Added `verify_greenwatts_token()` endpoint (GET
    /api/auth/verify-greenwatts-token/)
  - Added `sync_greenwatts_user_endpoint()` endpoint (POST
    /api/auth/sync-greenwatts-user/)

### 2. User URLs

**File**: `project/app/users/urls.py`

- **Changes**:
  - Added import for `verify_greenwatts_token` view
  - Added import for `sync_greenwatts_user_endpoint` view
  - Registered URL routes for both GreenWatts endpoints

### 3. Dashboard Component

**File**: `project/spa/src/pages/Application/pages/dashboard/index.tsx`

- **Changes**:
  - Added import:
    `import greenwattsLogo from '../../../../assets/apps/greenwatts.svg'`
  - Added GreenWatts to `appLogos` mapping dictionary

## Integration Points

### Frontend Integration

- **Dashboard URL**: `/dashboard`
- **App Cards Section**: Displays all active apps including GreenWatts
- **Click Handler**: Navigates to GreenWatts URL or redirects to external link
- **Logo Display**: Shows GreenWatts SVG icon in app card grid

### Backend Integration

- **Verification Endpoint**: `GET /api/auth/verify-greenwatts-token/`
  - Requires: CITC Portal token authentication
  - Returns: User info if token is valid
  - Side effect: Syncs user data to GreenWatts

- **Sync Endpoint**: `POST /api/auth/sync-greenwatts-user/`
  - Requires: GREENWATTS_SYNC_TOKEN in Authorization header
  - Request: `{ "user_id": "uuid" }`
  - Returns: Synced user data

### Database Integration

- **Model**: App model in `base_application.models`
- **Entry**: GreenWatts app with display_order=2
- **Status**: is_active=True, is_visible_to_users=True

## Authentication Flow

```
User logs into CITC Portal
        ↓
Portal generates auth token
        ↓
User navigates to Dashboard
        ↓
Dashboard loads apps from /api/v1/apps/
        ↓
GreenWatts card appears in dashboard
        ↓
User clicks GreenWatts card
        ↓
Frontend redirects to greenwatts/ or external URL
        ↓
GreenWatts calls /api/auth/verify-greenwatts-token/
        ↓
CITC Portal verifies token and syncs user data
        ↓
User logged into GreenWatts with synced credentials
```

## Configuration Required

### Environment Variables

```bash
GREENWATTS_API_URL=http://localhost:8002
GREENWATTS_SYNC_TOKEN=your-secure-sync-token
```

### Database

```bash
python manage.py migrate base_application
```

This creates the GreenWatts app entry with:

- Name: GreenWatts
- Description: IoT Energy Management and Monitoring System
- URL: greenwatts/
- Logo: Placeholder SVG (can be customized)

## Data Synchronized

When a user is synced to GreenWatts, the following fields are transmitted:

- id_number (student/employee ID)
- email
- first_name
- last_name
- middle_name (optional)
- suffix (optional)
- is_student
- is_employee
- is_staff
- is_active
- uuid
- avatar (optional)

## Testing Checklist

- [x] GreenWatts app appears in app list API
- [x] GreenWatts app card shows in dashboard
- [x] Token verification endpoint callable
- [x] User sync endpoint callable
- [x] Logo displays correctly
- [x] Frontend imports resolve correctly
- [x] Backend views process requests correctly
- [x] Migration creates app entry successfully

## Comparison with Other Integrations

### Syllabease Integration

- ✅ Same pattern used
- ✅ Similar endpoints
- ✅ Same sync token approach
- ✅ Consistent error handling

### UniEventify Integration

- ✅ Same dashboard app listing
- ✅ Same click handler logic
- ✅ Same authentication flow
- ✅ Same data format

## Deployment Steps

1. **Code Changes**: All changes committed and pushed
2. **Database Migration**: Run `python manage.py migrate base_application`
3. **Environment Setup**: Set GREENWATTS_API_URL and GREENWATTS_SYNC_TOKEN
4. **Frontend Build**: Run `npm run build` in `project/spa/`
5. **Restart Django**: Restart Django development server or production instance
6. **Verify**: Check dashboard shows GreenWatts app

## Future Enhancements

1. **OAuth2 Support**: Migrate from token to OAuth2 authentication
2. **Bidirectional Sync**: Allow GreenWatts to update user data in portal
3. **Role-Based Access**: Control features based on CITC Portal roles
4. **Device Management**: Link IoT devices to CITC Portal user accounts
5. **Activity Logging**: Track GreenWatts interactions in portal logs

## Support & Troubleshooting

Refer to `GREENWATTS_INTEGRATION.md` for:

- Detailed configuration instructions
- API endpoint documentation
- Troubleshooting common issues
- Manual testing procedures

## Related Documentation

- [Syllabease Integration](SYLLABEASE_INTEGRATION.md)
- [Integration Architecture](INTEGRATION_ARCHITECTURE.md)
- [User Management Complete](USER_MANAGEMENT_COMPLETE.md)
- [Implementation Roadmap](IMPLEMENTATION_ROADMAP.md)
