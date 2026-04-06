# Syllabease2.0 Integration - Next Steps

## 🎯 What's Been Completed

### Frontend

✅ Added "Syllabease" link to CITC Portal sidebar\
✅ Created Syllabease component with iframe/external link support\
✅ Routes configured for `/syllabease/dashboard/`

### Backend

✅ CORS configured in both CITC Portal & Syllabease2.0\
✅ User sync utilities created in CITC\
✅ Sync endpoints created in Syllabease2.0\
✅ Token verification endpoint ready

### Documentation

✅ Created comprehensive integration guide (`SYLLABEASE_INTEGRATION.md`)

---

## 🚀 Manual Setup Required (DO THESE NEXT)

### 1. Set Environment Variables

**CITC Portal** - Create/update `.env`:

```env
SYLLABEASE_SYNC_TOKEN=your-unique-secure-token-here
```

**Syllabease2.0 Backend** - Create/update `.env`:

```env
SYNC_TOKEN=your-unique-secure-token-here
CITC_PORTAL_URL=http://localhost:8000
```

### 2. Update Syllabease Frontend `.env`

**Syllabease2.0 Frontend** - Create `.env`:

```env
VITE_CITC_API_URL=http://localhost:8000
```

### 3. Test the Integration

#### A. Start all services:

```bash
# Terminal 1: CITC Portal Django backend
cd project
python manage.py runserver

# Terminal 2: CITC Portal React frontend  
cd project/spa
npm install  # if needed
npm run dev

# Terminal 3: Syllabease2.0 Django backend
cd Syllabease2.0/backend
python manage.py runserver 8001

# Terminal 4: Syllabease2.0 React frontend
cd Syllabease2.0/frontend
npm install  # if needed
npm run dev
```

#### B. Test in browser:

1. Go to http://localhost:3000 (CITC Portal)
2. Login with your credentials
3. Check sidebar - should see "Syllabease" link
4. Click Syllabease link
5. Should either:
   - See Syllabease iframe embedded (if IFRAME_MODE=true)
   - Be redirected to http://localhost:5173 (if IFRAME_MODE=false)

### 4. Verify Backend Sync

**Option A: Using curl**

```bash
# Get your CITC token first
CITC_TOKEN=$(curl -X POST http://localhost:8000/auth/token/login/ \
  -H "Content-Type: application/json" \
  -d '{"id_number":"your_id","password":"your_password"}' \
  | jq -r '.auth_token')

# Test sync endpoint
curl -X GET http://localhost:8000/auth/verify-syllabease-token/ \
  -H "Authorization: Token ${CITC_TOKEN}"
```

**Option B: Using Django Shell**

```bash
cd project
python manage.py shell

# Inside shell:
from app.users.models import User
from app.users.syllabease_sync import sync_user_to_syllabease

user = User.objects.first()
result = sync_user_to_syllabease(user)
print(f"Sync successful: {result}")
```

---

## 🔧 Configuration Options

### Switch Between Iframe & External Link Mode

**To use Iframe mode** (recommended for seamless UX):

```typescript
// In /project/spa/src/pages/Application/pages/syllabease/index.tsx
const SYLLABEASE_CONFIG = {
    IFRAME_MODE: true,  // ← Change this to true
    IFRAME_URL: process.env.REACT_APP_SYLLABEASE_URL || "http://localhost:5173",
    ...
};
```

**To use External Link mode** (if you want a separate window):

```typescript
const SYLLABEASE_CONFIG = {
    IFRAME_MODE: false,  // ← Change this to false
    EXTERNAL_URL: "http://localhost:5173/syllabi",
    ...
};
```

---

## 📋 Checklist for Full Setup

- [ ] Set `SYLLABEASE_SYNC_TOKEN` in CITC Portal `.env`
- [ ] Set `SYNC_TOKEN` in Syllabease2.0 Backend `.env`
- [ ] Set `VITE_CITC_API_URL` in Syllabease2.0 Frontend `.env`
- [ ] Start CITC Portal Django server
- [ ] Start CITC Portal React frontend
- [ ] Start Syllabease2.0 Django server
- [ ] Start Syllabease2.0 React frontend
- [ ] Login to CITC Portal
- [ ] Click Syllabease link in sidebar
- [ ] Verify user is accessible in Syllabease
- [ ] Check console for any errors

---

## 🐛 Common Issues & Fixes

### Issue: "Syllabease" link doesn't appear in sidebar

**Fix**:

```bash
# Make sure FaFileLines icon is imported
# Check: /project/spa/src/pages/Application/components/SideBar.tsx
# Should see: import { FaNotesMedical, FaFileLines } from "react-icons/fa6";
```

### Issue: CORS error when accessing Syllabease

**Fix**:

```python
# Verify both settings.py files have correct CORS origins
# CITC: localhost:5173 should be in CORS_ALLOWED_ORIGINS
# Syllabease: localhost:3000, localhost:8000 should be in CORS_ALLOWED_ORIGINS
```

### Issue: "Unauthorized" when syncing users

**Fix**:

```bash
# Make sure SYNC_TOKEN env vars match between systems
# CITC: SYLLABEASE_SYNC_TOKEN
# Syllabease: SYNC_TOKEN (should be the same value)
```

### Issue: Iframe not loading in Syllabease component

**Fix**:

```typescript
// Check 1: Is IFRAME_MODE set to true?
// Check 2: Is IFRAME_URL pointing to correct port (5173)?
// Check 3: Check browser console for postMessage errors
```

---

## 📞 Support

If you encounter issues:

1. **Check the Integration Guide**: `/SYLLABEASE_INTEGRATION.md`
2. **Review Browser Console**: Look for JavaScript errors
3. **Check Server Logs**: Look for Django/API errors
4. **Verify Endpoints**: Test API endpoints with curl
5. **Check Network Tab**: See if requests are being made

---

## 🎓 How to Customize

### Add More Capstone Applications

To add another capstone (e.g., Bayanihan) to the sidebar:

1. **Add sidebar link**:

```typescript
// In SideBar.tsx
<li>
    <NavLink to="bayanihan/dashboard/" 
      className={...}>
        <FaIcon className="..." />
        <span>Bayanihan</span>
    </NavLink>
</li>
```

2. **Create component**: `/pages/Application/pages/bayanihan/index.tsx`
3. **Add route**: Update routers.tsx
4. **Configure CORS**: Add bayanihan URLs to settings.py

---

## 🚀 Production Deployment

When ready for production:

1. Change URLs from `localhost` to production domains
2. Set `DEBUG = False` in Django settings
3. Use HTTPS for all URLs
4. Set strong `SYNC_TOKEN` values (use environment variables)
5. Configure proper database (PostgreSQL instead of SQLite)
6. Set up Docker containers or deployment platform
7. Configure reverse proxy (Nginx/Apache)

---

**Integration Complete!** 🎉\
Your Syllabease2.0 is now integrated with CITC Portal.
