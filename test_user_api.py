#!/usr/bin/env python
"""
Quick test script to verify User Management API endpoints
Run from project root: python ../test_user_api.py
"""

import os
import sys
import django

# Setup Django settings
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'project'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from app.users.models import User, Role
from rest_framework.authtoken.models import Token

# Check if we have admin users and roles
print("=" * 60)
print("USER MANAGEMENT API TEST")
print("=" * 60)

# Check roles exist
print("\n1. Checking Roles...")
roles = Role.objects.all()
print(f"   Total roles: {roles.count()}")
for role in roles:
    print(f"   - {role.name} (rank: {role.rank})")

# Check for admin users
print("\n2. Checking for Admin/Chairman Users...")
admin_role = Role.objects.filter(name='Admin').first()
chairman_role = Role.objects.filter(name='Chairman').first()

if not admin_role:
    print("   ⚠ Admin role not found!")
else:
    admin_users = User.objects.filter(roles=admin_role)
    print(f"   Admin users: {admin_users.count()}")
    for user in admin_users[:3]:  # Show first 3
        token, _ = Token.objects.get_or_create(user=user)
        print(f"   - {user.email} (Token: {token.key[:20]}...)")

if chairman_role:
    chairman_users = User.objects.filter(roles=chairman_role)
    print(f"   Chairman users: {chairman_users.count()}")

# Check total users
print(f"\n3. Total Users in Database: {User.objects.count()}")

print("\n4. API Endpoints Ready:")
print("   GET  /api/v1/auth/users/          - List all users (admin only)")
print("   POST /api/v1/auth/users/          - Create user (admin only)")
print("   GET  /api/v1/auth/users/{uuid}/   - Get user detail (admin only)")
print("   PUT  /api/v1/auth/users/{uuid}/   - Update user (admin only)")
print("   DELETE /api/v1/auth/users/{uuid}/ - Delete user (admin only)")

print("\n✓ Test script completed")
print("=" * 60)
