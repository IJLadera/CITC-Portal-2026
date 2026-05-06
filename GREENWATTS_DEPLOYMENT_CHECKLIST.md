# GreenWatts Integration - Deployment Checklist

## Pre-Deployment Verification ✓

### Backend Code Quality

- [x] Python syntax validated (no errors)
- [x] Django imports all resolve
- [x] Views follow existing patterns
- [x] Endpoints properly registered
- [x] Error handling implemented
- [x] Comments and docstrings added

### Frontend Code Quality

- [x] TypeScript/React imports valid
- [x] Logo file created (SVG format)
- [x] Asset path correct
- [x] Logo mapping added to appLogos
- [x] No console errors expected

### Database

- [x] Migration file created (0002_add_greenwatts_app.py)
- [x] Data migration uses get_or_create pattern
- [x] Reverse migration removes app cleanly
- [x] Migration follows Django conventions

### Documentation

- [x] Integration guide written (GREENWATTS_INTEGRATION.md)
- [x] Architecture diagram created (GREENWATTS_ARCHITECTURE_DIAGRAM.md)
- [x] Implementation summary written (GREENWATTS_IMPLEMENTATION_SUMMARY.md)
- [x] API endpoints documented
- [x] Configuration instructions provided

---

## Step-by-Step Deployment Guide

### Phase 1: Preparation

#### 1.1 Backup Current Database

```bash
# Create backup
python manage.py dumpdata > backup_before_greenwatts.json
```

- [ ] Backup created
- [ ] Backup verified
- [ ] Location noted: `project/backup_before_greenwatts.json`

#### 1.2 Install Dependencies

```bash
# Verify all dependencies are installed
pip install -r requirements.txt
# Should include: django, djangorestframework, requests, etc.
```

- [ ] Django 5.0.6+ installed
- [ ] DRF installed
- [ ] Requests library installed
- [ ] All dependencies match requirements.txt

#### 1.3 Pull Code Changes

```bash
# Pull latest from repository
git pull origin main
# OR manually copy files:
# - project/app/users/greenwatts_sync.py
# - project/app/users/views.py (modified)
# - project/app/users/urls.py (modified)
# - project/app/base_application/migrations/0002_add_greenwatts_app.py
# - project/spa/src/assets/apps/greenwatts.svg
# - project/spa/src/pages/Application/pages/dashboard/index.tsx (modified)
```

- [ ] All new files present
- [ ] Modified files updated
- [ ] No merge conflicts
- [ ] Git status clean

### Phase 2: Environment Configuration

#### 2.1 Set Environment Variables

```bash
# In .env file (project root) or system environment:
GREENWATTS_API_URL=http://localhost:8002
GREENWATTS_SYNC_TOKEN=your-secure-sync-token-here
```

- [ ] GREENWATTS_API_URL set
- [ ] GREENWATTS_SYNC_TOKEN set (change from default!)
- [ ] Values match GreenWatts deployment config
- [ ] .env file in .gitignore (don't commit)
- [ ] Environment variables accessible to Django

#### 2.2 Verify Django Settings

```python
# Check in project/core/settings.py
# Should already have:
# - INSTALLED_APPS includes 'base_application'
# - CORS_ALLOWED_ORIGINS configured
# - Database configured (SQLite or PostgreSQL)
# - REST_FRAMEWORK configured
# - Authentication backends configured
```

- [ ] INSTALLED_APPS correct
- [ ] Database engine compatible
- [ ] REST settings configured
- [ ] Templates directory includes spa/build
- [ ] Static files configuration correct

### Phase 3: Database Migration

#### 3.1 Make Migrations

```bash
cd project
python manage.py makemigrations base_application
# Should report: No changes detected in app 'base_application'
# OR create new migrations if schema changed
```

- [ ] No errors from makemigrations
- [ ] Existing migrations intact
- [ ] New migrations ready to apply

#### 3.2 Apply Migrations

```bash
python manage.py migrate base_application
# Should report: Running migrations:
#   Applying base_application.0002_add_greenwatts_app... OK
```

- [ ] Migration applies without errors
- [ ] GreenWatts app created in database
- [ ] Migration reversible (tested reverse migration)

#### 3.3 Verify App Created

```bash
python manage.py shell
>>> from app.base_application.models import App
>>> greenwatts = App.objects.get(name='GreenWatts')
>>> print(f"Name: {greenwatts.name}")
>>> print(f"URL: {greenwatts.url}")
>>> print(f"Active: {greenwatts.is_active}")
>>> print(f"Visible: {greenwatts.is_visible_to_users}")
```

- [ ] GreenWatts app exists in database
- [ ] name = "GreenWatts"
- [ ] url = "greenwatts/"
- [ ] is_active = True
- [ ] is_visible_to_users = True
- [ ] display_order = 2

### Phase 4: Backend Testing

#### 4.1 Test Django Import

```bash
python manage.py shell
>>> from app.users.greenwatts_sync import sync_user_to_greenwatts
>>> from app.users.views import verify_greenwatts_token
>>> print("✓ Imports successful")
```

- [ ] greenwatts_sync module imports
- [ ] Views import without errors
- [ ] No import-related errors

#### 4.2 Start Django Server

```bash
python manage.py runserver 8000
# Should start without errors
# Should NOT show migration pending errors
```

- [ ] Server starts successfully
- [ ] No migration errors
- [ ] No import errors
- [ ] Port 8000 accessible
- [ ] Admin accessible at http://localhost:8000/admin/

#### 4.3 Test APIs

```bash
# In another terminal, test endpoints:

# 1. Get auth token (replace with your credentials)
curl -X POST http://localhost:8000/api/auth/token/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
# Response should include token: "..."

# 2. List apps (including GreenWatts)
curl http://localhost:8000/api/v1/apps/ \
  -H "Authorization: Token YOUR_TOKEN_FROM_STEP_1"
# Response should include GreenWatts app

# 3. Verify token endpoint
curl http://localhost:8000/api/auth/verify-greenwatts-token/ \
  -H "Authorization: Token YOUR_TOKEN_FROM_STEP_1"
# Response should show valid: true

# 4. Test sync endpoint (server-to-server)
curl -X POST http://localhost:8000/api/auth/sync-greenwatts-user/ \
  -H "Authorization: Bearer YOUR_SYNC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"YOUR_USER_UUID"}'
# Response should show success: true
```

- [ ] Token auth endpoint works
- [ ] Apps list includes GreenWatts
- [ ] verify_greenwatts_token returns valid=true
- [ ] sync_greenwatts_user_endpoint accepts POST
- [ ] Endpoints require proper authentication
- [ ] Endpoints return expected JSON

### Phase 5: Frontend Build

#### 5.1 Install Frontend Dependencies

```bash
cd project/spa
npm install
# Should install all node_modules
```

- [ ] npm install completes without errors
- [ ] node_modules directory created
- [ ] Dependencies locked in package-lock.json

#### 5.2 Build React SPA

```bash
npm run build
# Should create project/spa/build/ directory
# Should complete without errors or warnings
```

- [ ] Build completes successfully
- [ ] build/ directory created
- [ ] build/index.html exists
- [ ] No build errors in console
- [ ] Build size is reasonable

#### 5.3 Verify Build Includes GreenWatts

```bash
# Check that greenwatts.svg is in build
ls project/spa/build/static/media/ | grep greenwatts
# Should show greenwatts.*.svg file
```

- [ ] SVG asset in build output
- [ ] Asset referenced in JavaScript
- [ ] All dependencies bundled
- [ ] Build output valid

### Phase 6: Integration Testing

#### 6.1 Test Frontend Load

```bash
# Browser: http://localhost:8000/
# Should show login page
# Enter CITC Portal credentials
```

- [ ] Login page loads
- [ ] CSS/styling loads correctly
- [ ] No JavaScript errors in console

#### 6.2 Test Dashboard

```bash
# After login: http://localhost:8000/dashboard/
# Should show apps in dashboard
```

- [ ] Dashboard loads
- [ ] Apps section visible
- [ ] GreenWatts card appears
- [ ] GreenWatts logo shows (SVG renders)
- [ ] Other apps (Syllabease, UniEventify) still visible
- [ ] No console errors

#### 6.3 Test App Click

```bash
# Click GreenWatts card in dashboard
# Should attempt to navigate to GreenWatts
```

- [ ] Click triggers navigation
- [ ] URL changes or external navigation
- [ ] No JavaScript errors
- [ ] Redirect happens

#### 6.4 Mock GreenWatts Response (Optional)

```bash
# If GreenWatts not running yet:
# The verify endpoint will fail (expected)
# But should not crash CITC Portal
# CITC Portal should show error gracefully
```

- [ ] No 500 errors on verify failure
- [ ] Error logged in console/backend
- [ ] Portal remains functional

### Phase 7: Production Deployment

#### 7.1 Collect Static Files (if needed)

```bash
python manage.py collectstatic --noinput
# Copies CSS, JS, images to STATIC_ROOT
```

- [ ] Static files collected
- [ ] No permission errors
- [ ] All assets in staticfiles/ directory

#### 7.2 Set Production Settings

```bash
# In production:
# Set DEBUG=False in settings
# Configure allowed hosts
# Use production database
# Use production static file serving (nginx, etc)
```

- [ ] DEBUG=False
- [ ] ALLOWED_HOSTS correct
- [ ] Database connection tested
- [ ] Static files served correctly

#### 7.3 Restart Django Process

```bash
# For development:
# Restart Django server (Ctrl+C, then python manage.py runserver)

# For production:
# Restart gunicorn/uwsgi process
# Restart Nginx/Apache
# Verify process started
```

- [ ] Django process restarted
- [ ] No startup errors
- [ ] All ports accessible
- [ ] Health checks pass

#### 7.4 Verify GreenWatts Integration

```bash
# Test complete flow:
# 1. Login to CITC Portal
# 2. Navigate to dashboard
# 3. See GreenWatts in app list
# 4. Click GreenWatts card
# 5. Should redirect to GreenWatts or show verification error (if not running)
```

- [ ] Complete user flow works
- [ ] No 500 errors
- [ ] All endpoints respond
- [ ] User data syncs correctly

---

## Verification Checklist

### API Verification

```bash
# Verify all endpoints exist
curl -I http://localhost:8000/api/v1/apps/ -H "Authorization: Token YOUR_TOKEN"
# Should return 200

curl -I http://localhost:8000/api/auth/verify-greenwatts-token/ -H "Authorization: Token YOUR_TOKEN"
# Should return 200

curl -I http://localhost:8000/api/auth/sync-greenwatts-user/ -X OPTIONS
# Should return 200 or 405 (Method Not Allowed for OPTIONS)
```

- [ ] All endpoints reachable
- [ ] No 404 errors
- [ ] Authentication working

### Database Verification

```bash
python manage.py dbshell
sqlite3 db.sqlite3 (or psql if PostgreSQL)

# Check GreenWatts app
SELECT * FROM base_application_app WHERE name='GreenWatts';

# Should show:
# - name: GreenWatts
# - url: greenwatts/
# - is_active: 1 (true)
# - is_visible_to_users: 1 (true)
# - display_order: 2
```

- [ ] GreenWatts app in database
- [ ] All fields correct
- [ ] No duplicate entries

### Frontend Verification

```bash
# Check React component
curl http://localhost:8000/api/v1/apps/ -H "Authorization: Token YOUR_TOKEN" | jq '.[] | select(.name=="GreenWatts")'
# Should return GreenWatts app entry

# In browser console after dashboard loads:
# Open DevTools (F12)
# Check Network tab for greenwatts.svg request
# Should see 200 response with SVG content
```

- [ ] API returns GreenWatts
- [ ] SVG loads from assets
- [ ] No 404 for logo
- [ ] No CORS errors

---

## Troubleshooting Checklist

### If GreenWatts app not showing in dashboard

- [ ] Migration applied: `python manage.py migrate base_application`
- [ ] App is_active=True in database
- [ ] App is_visible_to_users=True in database
- [ ] Clear browser cache (F12 → Application → Clear cache)
- [ ] Restart Django server
- [ ] Rebuild React: `npm run build` in `project/spa/`

### If logo not showing

- [ ] Check file exists: `project/spa/src/assets/apps/greenwatts.svg`
- [ ] Import in dashboard:
      `import greenwattsLogo from '../../../../assets/apps/greenwatts.svg'`
- [ ] Check appLogos mapping: `GreenWatts: greenwattsLogo`
- [ ] Check React build includes SVG
- [ ] Check browser DevTools for failed network requests

### If verify-greenwatts-token fails

- [ ] Check user is authenticated with valid token
- [ ] Verify token in database:
  ```bash
  python manage.py shell
  >>> from rest_framework.authtoken.models import Token
  >>> Token.objects.filter(key='YOUR_TOKEN').exists()
  ```
- [ ] Check GREENWATTS_API_URL is set (if needed for sync)
- [ ] Check GreenWatts service is running (if needed)

### If sync-greenwatts-user fails

- [ ] Check GREENWATTS_SYNC_TOKEN matches in Authorization header
- [ ] Check user_id exists in CITC Portal
- [ ] Check GREENWATTS_API_URL is accessible
- [ ] Check GreenWatts endpoint is responding
- [ ] Check error logs for detailed message

---

## Rollback Plan

If issues occur, rollback with these steps:

```bash
# 1. Reverse database migrations
python manage.py migrate base_application 0001

# 2. Revert code changes
git checkout project/app/users/views.py
git checkout project/app/users/urls.py
git checkout project/spa/src/pages/Application/pages/dashboard/index.tsx

# 3. Delete new files
rm project/app/users/greenwatts_sync.py
rm project/app/base_application/migrations/0002_add_greenwatts_app.py
rm project/spa/src/assets/apps/greenwatts.svg

# 4. Rebuild frontend
cd project/spa
npm run build

# 5. Restart Django
python manage.py runserver 8000
```

- [ ] Rollback plan tested
- [ ] Backup verified restorable
- [ ] Gitignore configured for sensitive files

---

## Sign-Off

- [ ] All checks passed
- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Team notified of deployment
- [ ] Deployment completed successfully
- [ ] GreenWatts integration live

---

**Deployment Date**: _______________\
**Deployed By**: _______________\
**Verified By**: _______________\
**Notes**: _______________________________________________________________
