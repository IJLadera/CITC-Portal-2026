#!/bin/bash

# ============================================================================
# CITC Portal - Role System Quick Setup Script
# Automatically sets up standardized roles in your database
# ============================================================================

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CITC Portal - Unified Role System Setup                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# Check if database credentials are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${YELLOW}Usage: ./setup_roles.sh <username> <database_name> [password]${NC}"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./setup_roles.sh postgres citc_portal"
    echo "  ./setup_roles.sh postgres citc_portal mypassword"
    echo ""
    echo -e "${RED}No credentials provided. Running in DRY-RUN mode...${NC}"
    echo ""
    exit 1
fi

DB_USER=$1
DB_NAME=$2
DB_PASSWORD=${3:-}
DB_HOST=${4:-localhost}
DB_PORT=${5:-5432}

echo -e "${YELLOW}Database Configuration:${NC}"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo "  Host: $DB_HOST:$DB_PORT"
echo ""

# Build psql command
if [ -z "$DB_PASSWORD" ]; then
    PSQL_CMD="psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT"
else
    PSQL_CMD="PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT"
fi

echo -e "${YELLOW}Running role setup...${NC}"
echo ""

# Run the SQL setup
$PSQL_CMD -f ROLE_SETUP.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Roles created successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Assign roles to users using ROLE_ASSIGNMENT_EXAMPLES.sql"
    echo "  2. Restart your Django application"
    echo "  3. Login as a test user and verify role-based routing"
    echo ""
    echo -e "${YELLOW}To view all roles:${NC}"
    echo "  SELECT * FROM users_role ORDER BY rank;"
    echo ""
    echo -e "${YELLOW}To view user roles:${NC}"
    echo "  SELECT u.email, STRING_AGG(r.name, ', ') as roles"
    echo "  FROM users_user u"
    echo "  LEFT JOIN users_userrole ur ON u.uuid = ur.user_id"
    echo "  LEFT JOIN users_role r ON ur.role_id = r.uuid"
    echo "  GROUP BY u.email;"
else
    echo -e "${RED}✗ Error setting up roles!${NC}"
    exit 1
fi
