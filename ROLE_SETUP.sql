-- ============================================================================
-- CITC Portal - Unified Role System Setup
-- Run these SQL commands to set up standardized roles across all apps
-- ============================================================================

-- Step 1: Clear existing roles (OPTIONAL - only if you want to start fresh)
-- WARNING: This will delete existing role assignments!
-- DELETE FROM users_userrole;
-- DELETE FROM users_role;

-- ============================================================================
-- Step 2: Create all standardized roles with proper hierarchy
-- Lower rank = higher authority
-- ============================================================================

-- Super Admin (Rank 1 - Highest Authority)
INSERT INTO users_role (uuid, name, rank) 
VALUES (gen_random_uuid(), 'super_admin', 1)
ON CONFLICT DO NOTHING;

-- Admin (Rank 2)
INSERT INTO users_role (uuid, name, rank) 
VALUES (gen_random_uuid(), 'admin', 2)
ON CONFLICT DO NOTHING;

-- Dean (Rank 3)
INSERT INTO users_role (uuid, name, rank) 
VALUES (gen_random_uuid(), 'dean', 3)
ON CONFLICT DO NOTHING;

-- Chairman (Rank 4)
INSERT INTO users_role (uuid, name, rank) 
VALUES (gen_random_uuid(), 'chairman', 4)
ON CONFLICT DO NOTHING;

-- Registrar (Rank 5)
INSERT INTO users_role (uuid, name, rank) 
VALUES (gen_random_uuid(), 'registrar', 5)
ON CONFLICT DO NOTHING;

-- Faculty (Rank 6)
INSERT INTO users_role (uuid, name, rank) 
VALUES (gen_random_uuid(), 'faculty', 6)
ON CONFLICT DO NOTHING;

-- Instructor (Rank 7)
INSERT INTO users_role (uuid, name, rank) 
VALUES (gen_random_uuid(), 'instructor', 7)
ON CONFLICT DO NOTHING;

-- Event Coordinator (Rank 8)
INSERT INTO users_role (uuid, name, rank) 
VALUES (gen_random_uuid(), 'event_coordinator', 8)
ON CONFLICT DO NOTHING;

-- Student Organization Leader (Rank 9)
INSERT INTO users_role (uuid, name, rank) 
VALUES (gen_random_uuid(), 'student_org_leader', 9)
ON CONFLICT DO NOTHING;

-- Staff (Rank 10)
INSERT INTO users_role (uuid, name, rank) 
VALUES (gen_random_uuid(), 'staff', 10)
ON CONFLICT DO NOTHING;

-- Student (Rank 11 - Lowest Authority)
INSERT INTO users_role (uuid, name, rank) 
VALUES (gen_random_uuid(), 'student', 11)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Step 3: Get role IDs for assignment (OPTIONAL - For reference)
-- ============================================================================

-- Run this query to see all available roles:
-- SELECT uuid, name, rank FROM users_role ORDER BY rank;

-- ============================================================================
-- Step 4: Assign roles to users
-- Replace 'user_uuid_here' with actual user UUIDs
-- ============================================================================

-- Example: Make a user an Admin
-- INSERT INTO users_userrole (user_id, role_id)
-- VALUES (
--   (SELECT uuid FROM users_user WHERE email = 'admin@example.com'),
--   (SELECT uuid FROM users_role WHERE name = 'admin')
-- );

-- Example: Make a user a Faculty Member
-- INSERT INTO users_userrole (user_id, role_id)
-- VALUES (
--   (SELECT uuid FROM users_user WHERE email = 'faculty@example.com'),
--   (SELECT uuid FROM users_role WHERE name = 'faculty')
-- );

-- Example: Make a user a Student
-- INSERT INTO users_userrole (user_id, role_id)
-- VALUES (
--   (SELECT uuid FROM users_user WHERE email = 'student@example.com'),
--   (SELECT uuid FROM users_role WHERE name = 'student')
-- );

-- ============================================================================
-- Step 5: Verify roles were created
-- ============================================================================

SELECT 
    id, 
    uuid, 
    name, 
    rank 
FROM users_role 
ORDER BY rank;

-- ============================================================================
-- Step 6: View user roles (after assignment)
-- ============================================================================

-- Run this to see which users have which roles:
-- SELECT 
--     u.email,
--     u.first_name,
--     u.last_name,
--     r.name as role,
--     r.rank
-- FROM users_user u
-- LEFT JOIN users_userrole ur ON u.uuid = ur.user_id
-- LEFT JOIN users_role r ON ur.role_id = r.uuid
-- ORDER BY u.email, r.rank;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================
-- 1. All roles are now standardized across CITC Portal, UniEventify, and Syllabease
-- 2. Users assigned the same role will have access to the same apps and dashboards
-- 3. Role hierarchy is based on rank (lower = more authority)
-- 4. When a user logs in, they are routed to their role-specific dashboard
-- 5. Admin users can manage roles for users with lower authority (higher rank value)
--
-- DASHBOARD MAPPINGS BY ROLE:
-- super_admin → /admin/ (Full system access)
-- admin → /dashboard/ (Full CITC Portal access)
-- dean → /dashboard/ (Department administration)
-- chairman → /dashboard/ (Department management)
-- faculty → /lms/ (Teaching & course management)
-- instructor → /lms/ (Teaching & course management)
-- registrar → /admin/apps/ (Registration management)
-- student → /dashboard/ (Student portal)
-- event_coordinator → /unieventify/app/ (Event management)
-- student_org_leader → /unieventify/app/ (Organization & event management)
-- staff → /dashboard/ (Support staff portal)
--
-- ============================================================================
