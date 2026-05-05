#!/bin/bash
# ============================================================================
# CITC Portal - Role System: Quick Commands to Run
# Copy-paste these commands to get started immediately
# ============================================================================

# ============================================================================
# STEP 1: CREATE ROLES IN DATABASE (Choose one based on your OS)
# ============================================================================

# FOR WINDOWS USERS:
# Double-click: setup_roles.bat
# When prompted, enter: postgres citc_portal
# Press Enter twice

# FOR LINUX/MAC USERS:
bash setup_roles.sh postgres citc_portal

# FOR MANUAL SQL (Any platform):
# 1. Open your database tool (pgAdmin, DBeaver, psql, etc.)
# 2. Copy all text from: ROLE_SETUP.sql
# 3. Paste and execute


# ============================================================================
# STEP 2: VERIFY ROLES WERE CREATED
# ============================================================================

# Run this SQL query:
# SELECT * FROM users_role ORDER BY rank;
# 
# Should show 11 roles:
# - super_admin (rank 1)
# - admin (rank 2)
# - dean (rank 3)
# - chairman (rank 4)
# - registrar (rank 5)
# - faculty (rank 6)
# - instructor (rank 7)
# - event_coordinator (rank 8)
# - student_org_leader (rank 9)
# - staff (rank 10)
# - student (rank 11)


# ============================================================================
# STEP 3: ASSIGN ROLES TO TEST USERS
# ============================================================================

# Make user@email.com an ADMIN:
# INSERT INTO users_userrole (user_id, role_id)
# SELECT u.uuid, r.uuid FROM users_user u, users_role r
# WHERE u.email = 'user@email.com' AND r.name = 'admin';

# Make professor@email.com a FACULTY:
# INSERT INTO users_userrole (user_id, role_id)
# SELECT u.uuid, r.uuid FROM users_user u, users_role r
# WHERE u.email = 'professor@email.com' AND r.name = 'faculty';

# Make student@email.com a STUDENT:
# INSERT INTO users_userrole (user_id, role_id)
# SELECT u.uuid, r.uuid FROM users_user u, users_role r
# WHERE u.email = 'student@email.com' AND r.name = 'student';


# ============================================================================
# STEP 4: VERIFY USER ROLES WERE ASSIGNED
# ============================================================================

# Run this SQL query to see all user roles:
# SELECT u.email, STRING_AGG(r.name, ', ') as roles
# FROM users_user u
# LEFT JOIN users_userrole ur ON u.uuid = ur.user_id
# LEFT JOIN users_role r ON ur.role_id = r.uuid
# GROUP BY u.email
# ORDER BY u.email;


# ============================================================================
# STEP 5: UPDATE BACKEND USER SERIALIZER
# ============================================================================

# File: project/app/users/serializers.py
# Add this to your UserSerializer:
#
# class UserSerializer(serializers.ModelSerializer):
#     roles = serializers.SerializerMethodField()
#     
#     def get_roles(self, obj):
#         return list(obj.roles.values_list('name', flat=True))
#     
#     class Meta:
#         model = User
#         fields = ['uuid', 'email', 'first_name', 'last_name', 'roles', ...]


# ============================================================================
# STEP 6: UPDATE FRONTEND DASHBOARD
# ============================================================================

# File: project/spa/src/pages/Application/pages/dashboard/index.tsx
# Add this import at top:
# import { RoleBasedRoute } from '../../../components/RoleBasedRoute';
#
# Wrap your dashboard component:
# export default function Dashboard() {
#     return (
#         <RoleBasedRoute>
#             {/* Your existing dashboard content */}
#         </RoleBasedRoute>
#     );
# }


# ============================================================================
# STEP 7: RESTART SERVERS
# ============================================================================

# Terminal 1 - Django (from project folder):
python manage.py runserver

# Terminal 2 - React (from project/spa folder):
npm start


# ============================================================================
# STEP 8: TEST
# ============================================================================

# 1. Go to http://localhost:3000/login
# 2. Login as user@email.com (admin role)
# 3. Should see "Administrator" badge in header
# 4. Should auto-redirect to /dashboard/
# 
# 5. Logout and login as professor@email.com (faculty role)
# 6. Should see "Faculty Member" badge in header
# 7. Should auto-redirect to /lms/
#
# 8. Logout and login as student@email.com (student role)
# 9. Should see "Student" badge in header
# 10. Should auto-redirect to /dashboard/


# ============================================================================
# DONE! 🎉
# ============================================================================

# Your unified role system is now live!
# 
# All users with roles will:
# ✓ See their role(s) as badges in header
# ✓ Auto-route to correct dashboard on login
# ✓ Have access to only their role's apps
#
# For more info, see: README_UNIFIED_ROLES.md
