@echo off
REM ============================================================================
REM CITC Portal - Role System Quick Setup Script (Windows)
REM Automatically sets up standardized roles in your database
REM ============================================================================

setlocal enabledelayedexpansion

cls
echo ============================================================================
echo  CITC Portal - Unified Role System Setup (Windows)
echo ============================================================================
echo.

REM Check if database credentials are provided
if "%1"=="" (
    echo Usage: setup_roles.bat ^<username^> ^<database_name^> [password] [host] [port]
    echo.
    echo Examples:
    echo   setup_roles.bat postgres citc_portal
    echo   setup_roles.bat postgres citc_portal mypassword
    echo   setup_roles.bat postgres citc_portal mypassword localhost 5432
    echo.
    pause
    exit /b 1
)

set DB_USER=%1
set DB_NAME=%2
set DB_PASSWORD=%3
set DB_HOST=%4
set DB_PORT=%5

if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432

echo Database Configuration:
echo   User: %DB_USER%
echo   Database: %DB_NAME%
echo   Host: %DB_HOST%:%DB_PORT%
echo.

echo Running role setup...
echo.

REM Set password in environment if provided
if not "%DB_PASSWORD%"=="" (
    set PGPASSWORD=%DB_PASSWORD%
)

REM Run the SQL setup
if not "%DB_PASSWORD%"=="" (
    psql -U %DB_USER% -d %DB_NAME% -h %DB_HOST% -p %DB_PORT% -f ROLE_SETUP.sql
) else (
    psql -U %DB_USER% -d %DB_NAME% -h %DB_HOST% -p %DB_PORT% -f ROLE_SETUP.sql
)

if %errorlevel% equ 0 (
    echo.
    echo ✓ Roles created successfully!
    echo.
    echo Next steps:
    echo   1. Assign roles to users using ROLE_ASSIGNMENT_EXAMPLES.sql
    echo   2. Restart your Django application
    echo   3. Login as a test user and verify role-based routing
    echo.
    echo To view all roles:
    echo   SELECT * FROM users_role ORDER BY rank;
    echo.
    echo To view user roles:
    echo   SELECT u.email, STRING_AGG(r.name, ', ') as roles
    echo   FROM users_user u
    echo   LEFT JOIN users_userrole ur ON u.uuid = ur.user_id
    echo   LEFT JOIN users_role r ON ur.role_id = r.uuid
    echo   GROUP BY u.email;
) else (
    echo.
    echo ✗ Error setting up roles!
    pause
    exit /b 1
)

pause
