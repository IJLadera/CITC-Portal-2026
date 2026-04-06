# Quick Reference: Syllabease2.0 Integration Checklist

## 📝 Before You Start

- [ ] Read
      [SYLLABEASE_INTEGRATION_SUMMARY.md](SYLLABEASE_INTEGRATION_SUMMARY.md)
- [ ] Review [SYLLABEASE_INTEGRATION.md](SYLLABEASE_INTEGRATION.md) architecture
- [ ] Have access to both CITC Portal and Syllabease2.0 folders

---

## 🔧 Configuration (5 minutes)

### CITC Portal `.env`

```bash
echo 'SYLLABEASE_SYNC_TOKEN=your-secure-random-token-here' >> project/.env
```

### Syllabease2.0 Backend `.env`

```bash
echo 'SYNC_TOKEN=your-secure-random-token-here' >> Syllabease2.0/backend/.env
echo 'CITC_PORTAL_URL=http://localhost:8000' >> Syllabease2.0/backend/.env
```

### Syllabease2.0 Frontend `.env`

```bash
echo 'VITE_CITC_API_URL=http://localhost:8000' >> Syllabease2.0/frontend/.env
```

---

## 🚀 Start All Services (4 terminals)

### Terminal 1: CITC Backend

```bash
cd project
python manage.py runserver
# Expected: Starting development server at http://127.0.0.1:8000/
```

### Terminal 2: CITC Frontend

```bash
cd project/spa
npm install  # first time only
npm run dev
# Expected: http://localhost:5173/ (Vite) or http://localhost:3000/
```

### Terminal 3: Syllabease Backend

```bash
cd Syllabease2.0/backend
python manage.py runserver 8001
# Expected: Starting development server at http://127.0.0.1:8001/
```

### Terminal 4: Syllabease Frontend

```bash
cd Syllabease2.0/frontend
npm install  # first time only
npm run dev
# Expected: http://localhost:5173/
```

---

## ✅ Testing (3 minutes)

### 1. Check Sidebar

- [ ] Open http://localhost:3000 (CITC Portal)
- [ ] Login with test user
- [ ] ✅ Should see "Syllabease" link in sidebar

### 2. Test Navigation

- [ ] Click "Syllabease" link
- [ ] Should navigate to `/syllabease/dashboard/`
- [ ] ✅ Should either show iframe or redirect (depending on mode)

### 3. Test Auto-Login

- [ ] If iframe mode: Check console for postMessage
- [ ] If external mode: Check URL has token parameter
- [ ] ✅ User should NOT need to login again

### 4. Test User Sync

```bash
# Get your token
curl -X POST http://localhost:8000/auth/token/login/ \
  -H "Content-Type: application/json" \
  -d '{"id_number":"your_id_number","password":"your_password"}'

# Verify token works
curl -X GET http://localhost:8000/auth/verify-syllabease-token/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# Should return user data
```

---

## 🔌 API Endpoints Reference

### CITC Portal Endpoints

```
POST   /auth/token/login/             Login (Djoser)
GET    /auth/users/me/                Get current user
GET    /auth/verify-syllabease-token/ ✨ Verify for Syllabease
POST   /auth/sync-user/               ✨ Sync specific user
```

### Syllabease2.0 Endpoints

```
POST   /auth/sync/                    ✨ Receive synced user
GET    /auth/verify-citc-token/       ✨ Verify CITC token
POST   /auth/login/                   Login (JWT)
```

---

## 🎛️ Configuration Options

### Switch Iframe vs External Mode

```typescript
// File: /project/spa/src/pages/Application/pages/syllabease/index.tsx

// For Iframe (embedded, seamless):
const SYLLABEASE_CONFIG = {
    IFRAME_MODE: true, // ← Change to true
    IFRAME_URL: "http://localhost:5173",
};

// For External Link (separate tab):
const SYLLABEASE_CONFIG = {
    IFRAME_MODE: false, // ← Change to false
    EXTERNAL_URL: "http://localhost:5173/syllabi",
};
```

---

## 🐛 Troubleshooting Quick Fixes

| Problem                         | Solution                                               |
| ------------------------------- | ------------------------------------------------------ |
| Syllabease not in sidebar       | Check SideBar.tsx was modified with FaFileLines import |
| CORS error                      | Verify CORS_ALLOWED_ORIGINS in both settings.py        |
| 401 Unauthorized on sync        | Check SYNC_TOKEN env var matches between systems       |
| Token not passed to iframe      | Check browser console for postMessage errors           |
| Syllabease frontend not loading | Verify npm run dev is running on port 5173             |

---

## 📊 System Status Check

```bash
# Check CITC Backend
curl -s http://localhost:8000/auth/users/ | head -c 100

# Check Syllabease Backend  
curl -s http://localhost:8001/api/ | head -c 100

# Check CITC Frontend (should return HTML)
curl -s http://localhost:3000/

# Check Syllabease Frontend
curl -s http://localhost:5173/ | head -c 100
```

---

## 💾 Key Files Modified

```
project/
├── spa/
│   └── src/
│       ├── pages/Application/components/SideBar.tsx          ✅ Modified
│       ├── pages/Application/pages/syllabease/index.tsx      ✅ Created
│       └── routers.tsx                                       ✅ Modified
├── core/settings.py                                          ✅ Modified
├── app/users/
│   ├── syllabease_sync.py                                    ✅ Created
│   ├── views.py                                              ✅ Modified
│   └── urls.py                                               ✅ Modified

Syllabease2.0/
├── backend/
│   ├── backend/settings.py                                   ✅ Modified
│   └── users/
│       ├── sync_endpoints.py                                 ✅ Created
│       └── urls.py                                           ✅ Modified
```

---

## 📚 Documentation Files

- [SYLLABEASE_INTEGRATION_SUMMARY.md](SYLLABEASE_INTEGRATION_SUMMARY.md) -
  Overview & summary
- [SYLLABEASE_INTEGRATION.md](SYLLABEASE_INTEGRATION.md) - Technical guide
- [SYLLABEASE_SETUP_NEXT_STEPS.md](SYLLABEASE_SETUP_NEXT_STEPS.md) - Detailed
  setup
- [SYLLABEASE_INTEGRATION_CHECKLIST.md](SYLLABEASE_INTEGRATION_CHECKLIST.md) -
  This file

---

## 🎯 Integration Verification Checklist

After completing setup, verify everything works:

### Frontend

- [ ] Sidebar shows "Syllabease" link
- [ ] Clicking link navigates to `/syllabease/dashboard/`
- [ ] No console errors on navigation
- [ ] Syllabease interface loads (iframe or redirect)

### Backend

- [ ] CITC backend runs on port 8000
- [ ] Syllabease backend runs on port 8001
- [ ] Token endpoints return valid responses
- [ ] Sync endpoint successfully creates/updates users

### Authentication

- [ ] User can login to CITC Portal
- [ ] Token is generated and stored
- [ ] User doesn't need to re-login for Syllabease
- [ ] User data exists in Syllabease database

### Deployment

- [ ] All services start without errors
- [ ] No CORS errors in browser console
- [ ] Network requests succeed between systems
- [ ] Sync tokens are configured correctly

---

## 📞 Support Resources

1. **Integration Guide**: [SYLLABEASE_INTEGRATION.md](SYLLABEASE_INTEGRATION.md)
2. **Setup Steps**:
   [SYLLABEASE_SETUP_NEXT_STEPS.md](SYLLABEASE_SETUP_NEXT_STEPS.md)
3. **Code Files**:
   - Sync logic: [syllabease_sync.py](project/app/users/syllabease_sync.py)
   - Endpoints:
     [sync_endpoints.py](Syllabease2.0/backend/users/sync_endpoints.py)
4. **Browser Console**: Check for JavaScript errors
5. **Django Shell**: Test sync locally with `python manage.py shell`

---

## 🚀 Ready to Deploy?

When moving to production:

1. Update localhost URLs to production domains
2. Change SYNC_TOKEN to strong random string
3. Enable HTTPS for all URLs
4. Configure proper database (PostgreSQL)
5. Set DEBUG = False in Django settings
6. Review security checklist in
   [SYLLABEASE_INTEGRATION.md](SYLLABEASE_INTEGRATION.md)

---

**Estimated Setup Time**: 15-20 minutes\
**Status**: ✅ Ready to configure and test
