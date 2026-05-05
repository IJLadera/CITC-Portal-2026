# CITC Portal - Unified Role System Implementation

## 🎯 What Was Done

I've implemented a **unified, standardized role system** across the entire CITC
Portal ecosystem:

- **CITC Portal**
- **UniEventify**
- **Syllabease**

### The Problem Solved

✅ No more confusion about different roles in each app\
✅ Single role assignment that applies everywhere\
✅ Consistent dashboards based on role\
✅ Clear role hierarchy and permissions\
✅ Easy role management for administrators

### The Solution

✅ 11 standardized roles (super_admin → student)\
✅ Rank-based hierarchy (lower rank = higher authority)\
✅ Automatic dashboard routing by role\
✅ App access control per role\
✅ Frontend + Backend integration\
✅ Visual role display in header

---

## 🚀 Quick Start (Do This Now)

### Step 1: Create Roles in Database (5 minutes)

**Windows Users:**

```bash
# Navigate to project directory, then run:
setup_roles.bat postgres citc_portal
```

**Linux/Mac Users:**

```bash
bash setup_roles.sh postgres citc_portal
```

**Or manually:**

- Open your database client (pgAdmin, DBeaver, psql, etc.)
- Copy-paste contents of `ROLE_SETUP.sql`
- Execute

### Step 2: Assign Roles to Test Users (5 minutes)

Make a user an Admin:

```sql
INSERT INTO users_userrole (user_id, role_id)
SELECT u.uuid, r.uuid
FROM users_user u, users_role r
WHERE u.email = 'testadmin@example.com' AND r.name = 'admin';
```

Make a user a Faculty Member:

```sql
INSERT INTO users_userrole (user_id, role_id)
SELECT u.uuid, r.uuid
FROM users_user u, users_role r
WHERE u.email = 'professor@example.com' AND r.name = 'faculty';
```

Make a user a Student:

```sql
INSERT INTO users_userrole (user_id, role_id)
SELECT u.uuid, r.uuid
FROM users_user u, users_role r
WHERE u.email = 'student@example.com' AND r.name = 'student';
```

### Step 3: Update Backend (10 minutes)

**File**: `project/app/users/serializers.py`

Make sure your user serializer returns roles:

```python
class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    
    def get_roles(self, obj):
        return list(obj.roles.values_list('name', flat=True))
    
    class Meta:
        model = User
        fields = ['uuid', 'email', 'first_name', 'last_name', 'roles', ...]
```

### Step 4: Update Frontend (10 minutes)

**File**: `project/spa/src/pages/Application/pages/dashboard/index.tsx`

Wrap your dashboard with role-based routing:

```typescript
import { RoleBasedRoute } from "../../../components/RoleBasedRoute";

export default function Dashboard() {
    return (
        <RoleBasedRoute>
            {/* Your dashboard content here */}
        </RoleBasedRoute>
    );
}
```

### Step 5: Test (5 minutes)

1. Restart Django: `python manage.py runserver`
2. Restart React: `npm start`
3. Login as one of your test users
4. Should see:
   - ✓ Role badges in header profile
   - ✓ Auto-redirect to correct dashboard
   - ✓ Can access only appropriate apps

**Total Time: ~35 minutes** ⏱️

---

## 📚 Documentation Files

Read these in order for complete understanding:

1. **`ROLE_SYSTEM_QUICK_REFERENCE.md`** - Quick lookup (5 min read)
2. **`ROLE_SYSTEM_DOCUMENTATION.md`** - Complete guide (20 min read)
3. **`INTEGRATION_CHECKLIST.md`** - Step-by-step implementation checklist

---

## 📋 Role Assignments

### Quick Reference

| When you want... | Command                               |
| ---------------- | ------------------------------------- |
| Admin dashboard  | Assign `admin` role                   |
| Faculty access   | Assign `faculty` role                 |
| Student access   | Assign `student` role                 |
| LMS Teacher      | Assign `faculty` or `instructor` role |
| Event Manager    | Assign `event_coordinator` role       |
| Department Head  | Assign `chairman` role                |

### Dashboard Routing

```
user role          →  dashboard URL         →  accessible apps
────────────────────────────────────────────────────────────
super_admin        →  /admin/               →  All apps
admin              →  /dashboard/           →  All apps
dean               →  /dashboard/           →  All apps
chairman           →  /dashboard/           →  LMS, Syllabease, UniEventify
faculty            →  /lms/                 →  LMS, Syllabease, UniEventify, Consultation
instructor         →  /lms/                 →  LMS, Syllabease, UniEventify
student            →  /dashboard/           →  LMS, UniEventify
registrar          →  /admin/apps/          →  LMS, CITC Portal
event_coordinator  →  /unieventify/app/     →  UniEventify
student_org_leader →  /unieventify/app/     →  UniEventify
staff              →  /dashboard/           →  CITC Portal
```

---

## 🛠️ Files Created/Modified

### New Backend Files

- `project/app/users/role_constants.py` - All role definitions and constants

### New Frontend Files

- `project/spa/src/types/roles.ts` - Role utilities and constants
- `project/spa/src/components/RoleBasedRoute.tsx` - Role-based routing component

### Updated Frontend Files

- `project/spa/src/pages/Application/components/Header.tsx` - Shows role badges

### Database Scripts

- `ROLE_SETUP.sql` - Creates all 11 roles
- `ROLE_ASSIGNMENT_EXAMPLES.sql` - Examples of assigning roles
- `setup_roles.sh` - Automated setup (Linux/Mac)
- `setup_roles.bat` - Automated setup (Windows)

### Documentation

- `ROLE_SYSTEM_DOCUMENTATION.md` - Complete guide
- `ROLE_SYSTEM_QUICK_REFERENCE.md` - Quick lookup
- `INTEGRATION_CHECKLIST.md` - Implementation checklist
- `README_UNIFIED_ROLES.md` - This file

---

## ✨ Key Features

✅ **Unified Role System** - Single role definition across all apps\
✅ **Automatic Dashboard Routing** - Users land on correct dashboard based on
role\
✅ **Role Hierarchy** - Clear authority levels (rank 1-11)\
✅ **App Access Control** - Different roles access different apps\
✅ **Visual Role Display** - Role badges show in user header\
✅ **Easy Management** - Simple SQL to assign/change roles\
✅ **Type Safe** - Full TypeScript support frontend\
✅ **Extensible** - Easy to add new roles or apps

---

## 🔄 How It Works

### 1. User Logs In

```
User provides email & password
    ↓
Backend verifies credentials
    ↓
Backend returns user object WITH roles array
    ↓
Frontend stores user in Redux (including roles)
```

### 2. Dashboard Loads

```
Dashboard component mounts
    ↓
RoleBasedRoute reads user's primary role
    ↓
Looks up dashboard URL for that role
    ↓
Auto-redirects to correct dashboard
    ↓
User lands on their role-specific interface
```

### 3. Header Shows Role

```
User clicks profile icon
    ↓
Header reads user's roles from Redux
    ↓
Displays role names as colored badges
    ↓
User can see exactly what role(s) they have
```

---

## 🎓 Understanding Roles

### Role Rank System

Lower rank number = Higher authority/More access

```
Rank 1  → super_admin   [Full system access]
Rank 2  → admin         [All apps access]
Rank 3  → dean          [College administration]
Rank 4  → chairman      [Department management]
Rank 5  → registrar     [Registration management]
Rank 6  → faculty       [Teaching staff]
Rank 7  → instructor    [Teaching staff]
Rank 8  → event_coordinator [Event specialists]
Rank 9  → student_org_leader [Student leadership]
Rank 10 → staff         [Support staff]
Rank 11 → student       [Regular student - limited access]
```

### Access Philosophy

- **Admins** (rank 1-2) can manage everything
- **Executives** (rank 3-5) manage specific domains
- **Staff** (rank 6-10) perform specialized functions
- **Students** (rank 11) have limited access

---

## 📞 Troubleshooting

### "User logs in but doesn't see role dashboard"

→ Check `INTEGRATION_CHECKLIST.md` Phase 2 (ensure serializer returns roles)

### "Role badges don't show in header"

→ Make sure API returns roles in user object

### "Can't find roles in database"

→ Run `ROLE_SETUP.sql` if you haven't already

### More issues?

→ See `ROLE_SYSTEM_DOCUMENTATION.md` Troubleshooting section

---

## 🎯 Next Steps

1. ✅ Run `setup_roles.bat` or `setup_roles.sh`
2. ✅ Assign roles to test users
3. ✅ Update user serializer in backend
4. ✅ Integrate RoleBasedRoute in dashboard
5. ✅ Test with different user roles
6. ✅ Deploy to production

---

## 📖 Full Documentation

- **Quick Ref**:
  [ROLE_SYSTEM_QUICK_REFERENCE.md](ROLE_SYSTEM_QUICK_REFERENCE.md)
- **Full Docs**: [ROLE_SYSTEM_DOCUMENTATION.md](ROLE_SYSTEM_DOCUMENTATION.md)
- **Checklist**: [INTEGRATION_CHECKLIST.md](INTEGRATION_CHECKLIST.md)
- **SQL Setup**: [ROLE_SETUP.sql](ROLE_SETUP.sql)
- **SQL Examples**: [ROLE_ASSIGNMENT_EXAMPLES.sql](ROLE_ASSIGNMENT_EXAMPLES.sql)

---

## 🎊 Success Criteria

You'll know it's working when:

✅ All 11 roles exist in database\
✅ Users can be assigned roles\
✅ User logs in → sees role badges in header\
✅ User logs in → auto-routed to correct dashboard\
✅ Admin can only access admin apps\
✅ Faculty can only access faculty apps\
✅ Student can only access student apps\
✅ Each app reflects the user's role appropriately

---

## 💬 Questions?

Refer to the comprehensive documentation files:

1. Quick Reference (5 min)
2. Full Documentation (20 min)
3. Integration Checklist (follow step by step)

**Good luck! You've got this! 🚀**
