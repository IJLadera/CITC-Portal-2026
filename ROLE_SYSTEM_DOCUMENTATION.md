# CITC Portal - Unified Role System Documentation

## Overview

The CITC Portal now uses a **unified, standardized role system** across all
applications:

- **CITC Portal**
- **UniEventify**
- **Syllabease**

When you set a user's role to "admin", "faculty", "student", etc., it
automatically applies across all apps with consistent dashboard routing and
permission management.

## Role Hierarchy

Roles are organized in a hierarchy where **lower rank numbers = higher
authority**:

| Rank | Role                 | Authority Level | Description                                         |
| ---- | -------------------- | --------------- | --------------------------------------------------- |
| 1    | `super_admin`        | Highest         | System administrator with full access to everything |
| 2    | `admin`              | Admin           | Administrator with full access to all apps          |
| 3    | `dean`               | Executive       | Dean/College Administrator                          |
| 4    | `chairman`           | Department Head | Department Chairman/Director                        |
| 5    | `registrar`          | Administrative  | Registrar Staff - handles registration              |
| 6    | `faculty`            | Teaching        | Faculty Member - can teach courses                  |
| 7    | `instructor`         | Teaching        | Instructor/Lecturer                                 |
| 8    | `event_coordinator`  | Specialist      | Event Coordinator for UniEventify                   |
| 9    | `student_org_leader` | Specialist      | Student Organization Leader                         |
| 10   | `staff`              | Support         | Support Staff                                       |
| 11   | `student`            | Lowest          | Student - limited access                            |

## Dashboard Routing by Role

When users log in, they are automatically routed to their role-specific
dashboard:

### Admin & Management Roles

- **super_admin** → `/admin/` (Full system access)
- **admin** → `/dashboard/` (CITC Portal dashboard)
- **dean** → `/dashboard/` (Department management dashboard)
- **chairman** → `/dashboard/` (Department dashboard)

### Teaching Roles

- **faculty** → `/lms/` (Learning Management System)
- **instructor** → `/lms/` (Learning Management System)

### Specialized Roles

- **registrar** → `/admin/apps/` (Application management)
- **event_coordinator** → `/unieventify/app/` (Event management)
- **student_org_leader** → `/unieventify/app/` (Organization management)

### General Access Roles

- **student** → `/dashboard/` (Student portal)
- **staff** → `/dashboard/` (Support staff portal)

## App Access Control

Different roles have access to different applications:

| Role               | CITC Portal | LMS | Syllabease | UniEventify | Consultation | Evaluation |
| ------------------ | :---------: | :-: | :--------: | :---------: | :----------: | :--------: |
| super_admin        |      ✓      |  ✓  |     ✓      |      ✓      |      ✓       |     ✓      |
| admin              |      ✓      |  ✓  |     ✓      |      ✓      |      ✓       |     ✓      |
| dean               |      ✓      |  ✓  |     ✓      |      ✓      |      ✓       |     ✓      |
| chairman           |             |  ✓  |     ✓      |      ✓      |              |            |
| faculty            |             |  ✓  |     ✓      |      ✓      |      ✓       |            |
| instructor         |             |  ✓  |     ✓      |      ✓      |              |            |
| registrar          |      ✓      |  ✓  |            |             |              |            |
| student            |             |  ✓  |            |      ✓      |              |            |
| event_coordinator  |             |     |            |      ✓      |              |            |
| student_org_leader |             |     |            |      ✓      |              |            |
| staff              |      ✓      |     |            |             |              |            |

## Setting Up Roles

### Step 1: Create Roles in Database

Run the SQL setup script to create all standardized roles:

```bash
psql -U postgres -d citc_portal -f ROLE_SETUP.sql
```

Or copy and paste the SQL commands from `ROLE_SETUP.sql` into your database
client.

### Step 2: Assign Roles to Users

Use `ROLE_ASSIGNMENT_EXAMPLES.sql` for examples, or:

```sql
-- Make a user an Admin
INSERT INTO users_userrole (user_id, role_id)
VALUES (
  (SELECT uuid FROM users_user WHERE email = 'admin@citc.edu.ph'),
  (SELECT uuid FROM users_role WHERE name = 'admin')
);

-- Make a user a Faculty Member
INSERT INTO users_userrole (user_id, role_id)
VALUES (
  (SELECT uuid FROM users_user WHERE email = 'prof@citc.edu.ph'),
  (SELECT uuid FROM users_role WHERE name = 'faculty')
);
```

### Step 3: Verify Role Assignment

```sql
SELECT 
    u.email,
    STRING_AGG(r.name, ', ') as roles
FROM users_user u
LEFT JOIN users_userrole ur ON u.uuid = ur.user_id
LEFT JOIN users_role r ON ur.role_id = r.uuid
GROUP BY u.email
ORDER BY u.email;
```

## Using Roles in Code

### Backend (Django/Python)

Use the role constants from `app/users/role_constants.py`:

```python
from app.users.role_constants import RoleChoices, get_role_rank, can_manage_role

# Check if user has a specific role
if 'admin' in user.roles.values_list('name', flat=True):
    # User is admin
    pass

# Get user's primary role
primary_role = user.get_highest_rank_role()
if primary_role:
    print(f"User is: {primary_role.name}")

# Check if user can manage another role
if can_manage_role(user_role='admin', target_role='faculty'):
    print("Can manage faculty role")
```

### Frontend (React/TypeScript)

Use the role utilities from `spa/src/types/roles.ts`:

```typescript
import {
    getDashboardForRole,
    getRoleDisplay,
    hasAppAccess,
    useHasRole,
    useUserRole,
} from "../types/roles";

// Get display name for role
const displayName = getRoleDisplay("faculty"); // "Faculty Member"

// Get dashboard URL for role
const dashboard = getDashboardForRole("admin"); // "/dashboard/"

// Check if user has access to app
if (hasAppAccess("student", "lms")) {
    // Student can access LMS
}

// Using React hooks
function MyComponent() {
    const role = useUserRole(); // Get primary role
    const isAdmin = useHasRole("admin"); // Check for specific role

    if (isAdmin) {
        return <AdminPanel />;
    }
}
```

## Role Management Operations

### View All Roles with Counts

```sql
SELECT 
    r.name,
    r.rank,
    COUNT(DISTINCT u.uuid) as user_count
FROM users_role r
LEFT JOIN users_userrole ur ON r.uuid = ur.role_id
LEFT JOIN users_user u ON ur.user_id = u.uuid
GROUP BY r.uuid, r.name, r.rank
ORDER BY r.rank;
```

### Find Users by Role

```sql
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    r.name as role,
    u.is_active
FROM users_user u
JOIN users_userrole ur ON u.uuid = ur.user_id
JOIN users_role r ON ur.role_id = r.uuid
WHERE r.name = 'faculty'
ORDER BY u.email;
```

### Count Users per Role

```sql
SELECT 
    r.name,
    COUNT(DISTINCT u.uuid) as count
FROM users_role r
LEFT JOIN users_userrole ur ON r.uuid = ur.role_id
LEFT JOIN users_user u ON ur.user_id = u.uuid
GROUP BY r.name
ORDER BY r.rank;
```

### Remove a User's Role

```sql
DELETE FROM users_userrole
WHERE user_id = (SELECT uuid FROM users_user WHERE email = 'user@example.com')
  AND role_id = (SELECT uuid FROM users_role WHERE name = 'admin');
```

## Troubleshooting

### User Can't Access Expected Dashboard

**Problem**: User logs in but doesn't see the expected dashboard.

**Solution**:

1. Check if user has a role assigned:
   ```sql
   SELECT * FROM users_userrole WHERE user_id = 'user_uuid';
   ```
2. If no role, assign one:
   ```sql
   INSERT INTO users_userrole (user_id, role_id)
   VALUES ('user_uuid', (SELECT uuid FROM users_role WHERE name = 'faculty'));
   ```
3. Check browser cache - clear it or hard refresh (Ctrl+Shift+R)

### User Can't Access App They Should Have Access To

**Problem**: User's role should allow access but they see permission error.

**Solution**:

1. Verify role has app access in `ROLE_APPS_ACCESS` table
2. Check `is_active` flag on user:
   `SELECT is_active FROM users_user WHERE uuid = 'user_uuid';`
3. Make sure user has correct role assignment
4. Check permission decorators on views

### Can't Create Roles

**Problem**: SQL error when running ROLE_SETUP.sql

**Solution**:

1. Make sure you're using correct database
2. Check that `users_role` table exists: `\dt users_role`
3. Verify UUIDs are valid: check if `gen_random_uuid()` is available (PostgreSQL
   only)
4. If using MySQL instead of PostgreSQL, modify UUID generation

## Migration Notes

If migrating from old dual-role system (boolean flags + dynamic roles):

```python
# Backend migration script
from app.users.models import User, Role, UserRole

for user in User.objects.all():
    # Migrate boolean flags to roles
    if user.is_student:
        role, _ = Role.objects.get_or_create(name='student', defaults={'rank': 11})
        UserRole.objects.get_or_create(user=user, role=role)
    
    if user.is_employee and not user.is_student:
        role, _ = Role.objects.get_or_create(name='staff', defaults={'rank': 10})
        UserRole.objects.get_or_create(user=user, role=role)
```

## Frontend Integration

The Header component now displays user's roles:

```jsx
// In Header.tsx - roles appear as badges in profile dropdown
{
    user.roles && user.roles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
            {user.roles.map((role) => (
                <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                    {getRoleDisplay(role)}
                </span>
            ))}
        </div>
    );
}
```

Users can now:

1. See their current role(s) in the header profile menu
2. Change roles from profile settings (if admin)
3. Automatically route to correct dashboard on login

## Next Steps

1. ✅ Run `ROLE_SETUP.sql` to create all roles
2. ✅ Run role assignment examples to add roles to test users
3. ✅ Test user login - should route to correct dashboard
4. ✅ Verify role display in header
5. ✅ Update any custom permission logic to use new role system
6. ✅ Document any additional custom roles your system needs

## Support

For issues or questions about the role system, check:

- Backend constants: `project/app/users/role_constants.py`
- Frontend utilities: `project/spa/src/types/roles.ts`
- Role routing component: `project/spa/src/components/RoleBasedRoute.tsx`
