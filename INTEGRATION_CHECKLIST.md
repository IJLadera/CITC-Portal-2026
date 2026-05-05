# CITC Portal Role System - Integration Checklist

Use this checklist to complete the role system implementation.

## Phase 1: Database Setup ✓ (Files Ready)

- [ ] Run SQL role creation script
  - Windows: Double-click `setup_roles.bat` and enter: `postgres citc_portal`
  - Linux/Mac: `bash setup_roles.sh postgres citc_portal`
  - Or copy SQL from `ROLE_SETUP.sql` and run manually

- [ ] Verify roles were created
  ```sql
  SELECT * FROM users_role ORDER BY rank;
  ```
  Should show 11 roles from super_admin to student

- [ ] Assign roles to test users (use `ROLE_ASSIGNMENT_EXAMPLES.sql`)
  - Create admin user
  - Create faculty user
  - Create student user

- [ ] Verify user role assignments
  ```sql
  SELECT u.email, STRING_AGG(r.name, ', ') as roles
  FROM users_user u
  LEFT JOIN users_userrole ur ON u.uuid = ur.user_id
  LEFT JOIN users_role r ON ur.role_id = r.uuid
  GROUP BY u.email;
  ```

---

## Phase 2: Backend Integration

### Ensure User Serializer Returns Roles

- [ ] Open `project/app/users/serializers.py`
- [ ] Check if user serializers include roles
- [ ] Update to include roles as list:
  ```python
  class UserSerializer(serializers.ModelSerializer):
      roles = serializers.SerializerMethodField()
      
      def get_roles(self, obj):
          return list(obj.roles.values_list('name', flat=True))
      
      class Meta:
          model = User
          fields = [..., 'roles']
  ```

### Update Login Response

- [ ] Check login endpoint (likely in `authentication/Login/views.py`)
- [ ] Ensure it returns user with roles
- [ ] Test API endpoint: `GET /api/auth/user/`
- [ ] Response should include `"roles": ["admin"]` or similar

### (Optional) Create Role Migration

- [ ] If needed, migrate boolean flags to roles:
  ```python
  # Migrate is_student → student role
  for user in User.objects.filter(is_student=True):
      role, _ = Role.objects.get_or_create(
          name='student',
          defaults={'rank': 11}
      )
      UserRole.objects.get_or_create(user=user, role=role)
  ```

---

## Phase 3: Frontend Integration

### Update Authentication State

- [ ] Check `store.tsx` or Redux state management
- [ ] Verify user object in Redux includes roles array
- [ ] If needed, add roles to initial state when user logs in

### Integrate Role-Based Routing

- [ ] Update `spa/src/pages/Application/pages/dashboard/index.tsx`
- [ ] Import `RoleBasedRoute` component:
  ```typescript
  import { RoleBasedRoute } from "../../../components/RoleBasedRoute";
  ```
- [ ] Wrap dashboard component:
  ```typescript
  export default function Dashboard() {
      return (
          <RoleBasedRoute>
              {/* Dashboard content */}
          </RoleBasedRoute>
      );
  }
  ```

### Test Role Display

- [ ] Login with a user that has roles
- [ ] Check header profile dropdown
- [ ] Should see role badges like "Faculty Member", "Student"
- [ ] Verify correct role display using `getRoleDisplay()`

### Test Dashboard Routing

- [ ] Login with admin user → should route to `/dashboard/`
- [ ] Login with faculty user → should route to `/lms/`
- [ ] Login with student user → should route to `/dashboard/`
- [ ] Check browser console for any routing errors

---

## Phase 4: Testing

### User Login Flow

- [ ] Create test users with different roles
- [ ] Test login for each role:
  - [ ] super_admin → `/admin/` dashboard
  - [ ] admin → `/dashboard/` dashboard
  - [ ] dean → `/dashboard/` dashboard
  - [ ] chairman → `/dashboard/` dashboard
  - [ ] faculty → `/lms/` dashboard
  - [ ] instructor → `/lms/` dashboard
  - [ ] student → `/dashboard/` dashboard
  - [ ] registrar → `/admin/apps/` dashboard
  - [ ] event_coordinator → `/unieventify/app/` dashboard
  - [ ] student_org_leader → `/unieventify/app/` dashboard
  - [ ] staff → `/dashboard/` dashboard

### Role Display

- [ ] Each user sees their role(s) as badges in header
- [ ] Role name is human-readable (e.g., "Faculty Member" not "faculty")
- [ ] Multiple roles display as separate badges if assigned

### App Access

- [ ] Test that users can only access apps for their role
- [ ] Faculty can access: LMS, Syllabease, UniEventify, Consultation
- [ ] Student can access: LMS, UniEventify
- [ ] Admin can access: all apps
- [ ] Registrar can access: LMS, CITC Portal

### Notifications

- [ ] Verify combined notification dropdown works
- [ ] Roles don't affect notifications functionality

---

## Phase 5: Production Deployment

- [ ] Backup database before deploying
- [ ] Run role setup script on production database
- [ ] Test with production users
- [ ] Monitor logs for any permission errors
- [ ] Update documentation for administrators

---

## Phase 6: User Documentation

- [ ] Document the role system for system administrators
- [ ] Create user guide for changing roles
- [ ] Document which apps each role can access
- [ ] Create troubleshooting guide

---

## Troubleshooting

### Issue: User logs in but doesn't route to correct dashboard

**Check:**

1. User has role assigned: `SELECT * FROM users_userrole WHERE user_id = 'uuid'`
2. Role exists: `SELECT * FROM users_role WHERE name = 'admin'`
3. Redux state has roles: Open browser DevTools → Redux tab
4. Check browser console for routing errors

**Solution:**

1. Assign role to user if missing
2. Clear browser cache (Ctrl+Shift+Delete)
3. Hard refresh (Ctrl+Shift+R)
4. Check network tab in DevTools - verify API returns roles

### Issue: Role badges don't show in header

**Check:**

1. User object has roles array in Redux
2. Component imported `getRoleDisplay` function
3. Check browser console for errors
4. API response includes roles

**Solution:**

1. Verify serializer returns roles
2. Test API endpoint manually
3. Check Redux state in DevTools

### Issue: User can access apps they shouldn't

**Check:**

1. Permission decorators on backend views
2. Frontend app access validation
3. User's actual role assignment
4. App access list for that role

**Solution:**

1. Review permission classes
2. Test API endpoints with different users
3. Check `ROLE_APPS_ACCESS` mapping

---

## Files to Reference

| File                                              | Purpose            | Status    |
| ------------------------------------------------- | ------------------ | --------- |
| `ROLE_SYSTEM_DOCUMENTATION.md`                    | Complete guide     | ✓ Ready   |
| `ROLE_SYSTEM_QUICK_REFERENCE.md`                  | Quick lookup       | ✓ Ready   |
| `ROLE_SETUP.sql`                                  | Create roles       | ✓ Ready   |
| `ROLE_ASSIGNMENT_EXAMPLES.sql`                    | Assign roles       | ✓ Ready   |
| `project/app/users/role_constants.py`             | Backend constants  | ✓ Ready   |
| `spa/src/types/roles.ts`                          | Frontend utilities | ✓ Ready   |
| `spa/src/components/RoleBasedRoute.tsx`           | Role routing       | ✓ Ready   |
| `spa/src/pages/Application/components/Header.tsx` | Header with roles  | ✓ Updated |

---

## Estimated Timeline

- **Phase 1 (Database)**: 15 minutes
- **Phase 2 (Backend)**: 30 minutes
- **Phase 3 (Frontend)**: 30 minutes
- **Phase 4 (Testing)**: 45 minutes
- **Phase 5 (Deployment)**: 30 minutes
- **Total**: ~2.5 hours

---

## Next: Start with Phase 1

👉 **First Step**: Run `setup_roles.bat` (Windows) or `setup_roles.sh`
(Linux/Mac)

Then follow checklist items in order.

Good luck! 🚀
