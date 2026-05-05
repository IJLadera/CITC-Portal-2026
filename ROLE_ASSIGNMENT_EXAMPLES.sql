-- ============================================================================
-- CITC Portal - Quick Role Assignment Examples
-- Use these commands to quickly set up test users with specific roles
-- ============================================================================

-- ============================================================================
-- SETUP: First, ensure all roles exist (run ROLE_SETUP.sql first!)
-- ============================================================================

-- ============================================================================
-- SCENARIO 1: Promote an existing user to Admin
-- ============================================================================

-- Find the user UUID:
SELECT uuid, email, first_name, last_name FROM users_user WHERE email = 'user@example.com';

-- Assign admin role (replace 'user_uuid' with actual UUID):
-- INSERT INTO users_userrole (user_id, role_id)
-- VALUES (
--   'user_uuid',
--   (SELECT uuid FROM users_role WHERE name = 'admin')
-- );

-- ============================================================================
-- SCENARIO 2: Create test users with different roles
-- ============================================================================

-- EXAMPLE: Admin User
-- INSERT INTO users_userrole (user_id, role_id)
-- SELECT 
--   u.uuid,
--   r.uuid
-- FROM users_user u, users_role r
-- WHERE u.email = 'admin@citc.edu.ph' AND r.name = 'admin';

-- EXAMPLE: Faculty User
-- INSERT INTO users_userrole (user_id, role_id)
-- SELECT 
--   u.uuid,
--   r.uuid
-- FROM users_user u, users_role r
-- WHERE u.email = 'prof.smith@citc.edu.ph' AND r.name = 'faculty';

-- EXAMPLE: Student User
-- INSERT INTO users_userrole (user_id, role_id)
-- SELECT 
--   u.uuid,
--   r.uuid
-- FROM users_user u, users_role r
-- WHERE u.email = 'student@citc.edu.ph' AND r.name = 'student';

-- ============================================================================
-- SCENARIO 3: View all user roles
-- ============================================================================

SELECT 
    u.email,
    u.first_name,
    u.last_name,
    STRING_AGG(r.name, ', ') as roles,
    STRING_AGG(r.rank::text, ', ') as ranks
FROM users_user u
LEFT JOIN users_userrole ur ON u.uuid = ur.user_id
LEFT JOIN users_role r ON ur.role_id = r.uuid
GROUP BY u.uuid, u.email, u.first_name, u.last_name
ORDER BY u.email;

-- ============================================================================
-- SCENARIO 4: View users by specific role
-- ============================================================================

-- View all Admin users:
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    r.name as role
FROM users_user u
JOIN users_userrole ur ON u.uuid = ur.user_id
JOIN users_role r ON ur.role_id = r.uuid
WHERE r.name = 'admin'
ORDER BY u.email;

-- ============================================================================
-- SCENARIO 5: Remove a role from a user
-- ============================================================================

-- DELETE FROM users_userrole
-- WHERE user_id = 'user_uuid'
--   AND role_id = (SELECT uuid FROM users_role WHERE name = 'admin');

-- ============================================================================
-- SCENARIO 6: Assign multiple roles to a user
-- ============================================================================

-- Make user both Faculty and Event Coordinator:
-- INSERT INTO users_userrole (user_id, role_id)
-- VALUES 
--   ((SELECT uuid FROM users_user WHERE email = 'user@example.com'),
--    (SELECT uuid FROM users_role WHERE name = 'faculty')),
--   ((SELECT uuid FROM users_user WHERE email = 'user@example.com'),
--    (SELECT uuid FROM users_role WHERE name = 'event_coordinator'));

-- ============================================================================
-- SCENARIO 7: Change user type flags based on roles
-- ============================================================================

-- Update is_student flag for all users with student role:
UPDATE users_user
SET is_student = true
WHERE uuid IN (
    SELECT u.uuid
    FROM users_user u
    JOIN users_userrole ur ON u.uuid = ur.user_id
    JOIN users_role r ON ur.role_id = r.uuid
    WHERE r.name = 'student'
);

-- Update is_employee flag for faculty/instructor:
UPDATE users_user
SET is_employee = true
WHERE uuid IN (
    SELECT u.uuid
    FROM users_user u
    JOIN users_userrole ur ON u.uuid = ur.user_id
    JOIN users_role r ON ur.role_id = r.uuid
    WHERE r.name IN ('faculty', 'instructor', 'admin', 'dean', 'chairman', 'registrar', 'staff')
);

-- ============================================================================
-- REFERENCE: Complete Role Mapping
-- ============================================================================

-- DASHBOARD ROUTES BY ROLE:
-- ┌────────────────────────┬──────────────────────────────────┐
-- │ Role                   │ Dashboard URL                    │
-- ├────────────────────────┼──────────────────────────────────┤
-- │ super_admin            │ /admin/                          │
-- │ admin                  │ /dashboard/                      │
-- │ dean                   │ /dashboard/                      │
-- │ chairman               │ /dashboard/                      │
-- │ faculty                │ /lms/                            │
-- │ instructor             │ /lms/                            │
-- │ student                │ /dashboard/                      │
-- │ registrar              │ /admin/apps/                     │
-- │ event_coordinator      │ /unieventify/app/                │
-- │ student_org_leader     │ /unieventify/app/                │
-- │ staff                  │ /dashboard/                      │
-- └────────────────────────┴──────────────────────────────────┘

-- APP ACCESS BY ROLE:
-- ┌────────────────────────┬─────────────────────────────────────┐
-- │ Role                   │ Accessible Apps                     │
-- ├────────────────────────┼─────────────────────────────────────┤
-- │ super_admin            │ All apps                            │
-- │ admin                  │ All apps                            │
-- │ dean                   │ All apps                            │
-- │ chairman               │ LMS, Syllabease, UniEventify        │
-- │ faculty                │ LMS, Syllabease, UniEventify        │
-- │ instructor             │ LMS, Syllabease, UniEventify        │
-- │ registrar              │ LMS, CITC Portal                    │
-- │ student                │ LMS, UniEventify                    │
-- │ event_coordinator      │ UniEventify only                    │
-- │ student_org_leader     │ UniEventify only                    │
-- │ staff                  │ CITC Portal                         │
-- └────────────────────────┴─────────────────────────────────────┘

-- ============================================================================
