# CITC Portal Role System - Quick Reference

## 🚀 Quick Start (3 Steps)

### 1️⃣ Create Roles

```bash
# Windows
setup_roles.bat postgres citc_portal

# Linux/Mac
bash setup_roles.sh postgres citc_portal
```

### 2️⃣ Assign Roles to Users

```sql
-- Make user@email.com an Admin
INSERT INTO users_userrole (user_id, role_id)
SELECT u.uuid, r.uuid
FROM users_user u, users_role r
WHERE u.email = 'user@email.com' AND r.name = 'admin';
```

### 3️⃣ Test

- Login with the user
- Should automatically route to their dashboard
- Check header for role display

---

## 📋 All Roles

| Role                 | Dashboard           | Apps                                       |
| -------------------- | ------------------- | ------------------------------------------ |
| `super_admin`        | `/admin/`           | All                                        |
| `admin`              | `/dashboard/`       | All                                        |
| `dean`               | `/dashboard/`       | All                                        |
| `chairman`           | `/dashboard/`       | LMS, Syllabease, UniEventify               |
| `registrar`          | `/admin/apps/`      | LMS, CITC Portal                           |
| `faculty`            | `/lms/`             | LMS, Syllabease, UniEventify, Consultation |
| `instructor`         | `/lms/`             | LMS, Syllabease, UniEventify               |
| `student`            | `/dashboard/`       | LMS, UniEventify                           |
| `event_coordinator`  | `/unieventify/app/` | UniEventify                                |
| `student_org_leader` | `/unieventify/app/` | UniEventify                                |
| `staff`              | `/dashboard/`       | CITC Portal                                |

---

## 🛠️ Common Commands

### View All Roles

```sql
SELECT * FROM users_role ORDER BY rank;
```

### View User Roles

```sql
SELECT u.email, STRING_AGG(r.name, ', ') as roles
FROM users_user u
LEFT JOIN users_userrole ur ON u.uuid = ur.user_id
LEFT JOIN users_role r ON ur.role_id = r.uuid
GROUP BY u.email;
```

### Make User Admin

```sql
INSERT INTO users_userrole (user_id, role_id)
SELECT u.uuid, r.uuid
FROM users_user u, users_role r
WHERE u.email = 'admin@example.com' AND r.name = 'admin';
```

### Make User Faculty

```sql
INSERT INTO users_userrole (user_id, role_id)
SELECT u.uuid, r.uuid
FROM users_user u, users_role r
WHERE u.email = 'prof@example.com' AND r.name = 'faculty';
```

### Make User Student

```sql
INSERT INTO users_userrole (user_id, role_id)
SELECT u.uuid, r.uuid
FROM users_user u, users_role r
WHERE u.email = 'student@example.com' AND r.name = 'student';
```

### Remove Role from User

```sql
DELETE FROM users_userrole
WHERE user_id = (SELECT uuid FROM users_user WHERE email = 'user@example.com')
AND role_id = (SELECT uuid FROM users_role WHERE name = 'admin');
```

---

## 📁 Files Created

| File                                    | Purpose                      |
| --------------------------------------- | ---------------------------- |
| `ROLE_SYSTEM_DOCUMENTATION.md`          | Complete documentation       |
| `ROLE_SETUP.sql`                        | Create all roles             |
| `ROLE_ASSIGNMENT_EXAMPLES.sql`          | Examples for assigning roles |
| `setup_roles.sh`                        | Linux/Mac setup script       |
| `setup_roles.bat`                       | Windows setup script         |
| `app/users/role_constants.py`           | Backend role constants       |
| `spa/src/types/roles.ts`                | Frontend role utilities      |
| `spa/src/components/RoleBasedRoute.tsx` | Role-based routing           |

---

## 🔧 Code Integration

### Backend (Python)

```python
from app.users.role_constants import RoleChoices, get_dashboard_for_role

# Get dashboard for role
dashboard = get_dashboard_for_role('faculty')  # Returns '/lms/'
```

### Frontend (React)

```typescript
import { getDashboardForRole, useUserRole } from "../types/roles";

function MyComponent() {
    const role = useUserRole();
    if (role) {
        const dashboard = getDashboardForRole(role);
    }
}
```

---

## ✨ Features

✅ Single, unified role system across all apps\
✅ Automatic dashboard routing based on role\
✅ Role hierarchy for permissions\
✅ App access control per role\
✅ Display roles in header\
✅ Easy role management\
✅ SQL scripts for setup\
✅ Both frontend & backend integration

---

## 📚 See Also

- Full documentation: `ROLE_SYSTEM_DOCUMENTATION.md`
- Assignment examples: `ROLE_ASSIGNMENT_EXAMPLES.sql`
- Backend constants: `project/app/users/role_constants.py`
- Frontend utilities: `project/spa/src/types/roles.ts`

---

## ❓ Need Help?

1. Check `ROLE_SYSTEM_DOCUMENTATION.md` for full guide
2. Review `ROLE_ASSIGNMENT_EXAMPLES.sql` for SQL examples
3. Verify roles created: `SELECT * FROM users_role ORDER BY rank;`
4. Check user roles: See "View User Roles" command above
5. Make sure user has `is_active = true`
