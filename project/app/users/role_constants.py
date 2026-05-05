"""
Unified Role System for CITC Portal
All apps (CITC Portal, UniEventify, Syllabease) use these standardized roles
"""

from enum import Enum

class RoleChoices(str, Enum):
    """Standard role choices for the entire CITC ecosystem"""
    SUPER_ADMIN = 'super_admin'
    ADMIN = 'admin'
    DEAN = 'dean'
    CHAIRMAN = 'chairman'
    FACULTY = 'faculty'
    INSTRUCTOR = 'instructor'
    STUDENT = 'student'
    REGISTRAR = 'registrar'
    EVENT_COORDINATOR = 'event_coordinator'
    STUDENT_ORG_LEADER = 'student_org_leader'
    STAFF = 'staff'

# Role hierarchy (lower rank = higher authority)
ROLE_HIERARCHY = {
    RoleChoices.SUPER_ADMIN: 1,
    RoleChoices.ADMIN: 2,
    RoleChoices.DEAN: 3,
    RoleChoices.CHAIRMAN: 4,
    RoleChoices.REGISTRAR: 5,
    RoleChoices.FACULTY: 6,
    RoleChoices.INSTRUCTOR: 7,
    RoleChoices.EVENT_COORDINATOR: 8,
    RoleChoices.STUDENT_ORG_LEADER: 9,
    RoleChoices.STAFF: 10,
    RoleChoices.STUDENT: 11,
}

# Role descriptions for UI
ROLE_DESCRIPTIONS = {
    RoleChoices.SUPER_ADMIN: 'System Administrator with full access',
    RoleChoices.ADMIN: 'Administrator with full access to all apps',
    RoleChoices.DEAN: 'Dean - College/Faculty Administrator',
    RoleChoices.CHAIRMAN: 'Department Chairman',
    RoleChoices.FACULTY: 'Faculty Member',
    RoleChoices.INSTRUCTOR: 'Instructor/Lecturer',
    RoleChoices.STUDENT: 'Student',
    RoleChoices.REGISTRAR: 'Registrar Staff',
    RoleChoices.EVENT_COORDINATOR: 'Event Coordinator',
    RoleChoices.STUDENT_ORG_LEADER: 'Student Organization Leader',
    RoleChoices.STAFF: 'Support Staff',
}

# Dashboard routes by role
ROLE_DASHBOARDS = {
    RoleChoices.SUPER_ADMIN: '/admin/',
    RoleChoices.ADMIN: '/dashboard/',
    RoleChoices.DEAN: '/dashboard/',
    RoleChoices.CHAIRMAN: '/dashboard/',
    RoleChoices.FACULTY: '/lms/',
    RoleChoices.INSTRUCTOR: '/lms/',
    RoleChoices.STUDENT: '/dashboard/',
    RoleChoices.REGISTRAR: '/admin/apps/',
    RoleChoices.EVENT_COORDINATOR: '/unieventify/app/',
    RoleChoices.STUDENT_ORG_LEADER: '/unieventify/app/',
    RoleChoices.STAFF: '/dashboard/',
}

# App access permissions by role
ROLE_APPS_ACCESS = {
    RoleChoices.SUPER_ADMIN: ['citc_portal', 'lms', 'syllabease', 'unieventify', 'consultation', 'evaluation'],
    RoleChoices.ADMIN: ['citc_portal', 'lms', 'syllabease', 'unieventify', 'consultation', 'evaluation'],
    RoleChoices.DEAN: ['citc_portal', 'lms', 'syllabease', 'unieventify', 'consultation', 'evaluation'],
    RoleChoices.CHAIRMAN: ['lms', 'syllabease', 'unieventify'],
    RoleChoices.FACULTY: ['lms', 'syllabease', 'unieventify', 'consultation'],
    RoleChoices.INSTRUCTOR: ['lms', 'syllabease', 'unieventify'],
    RoleChoices.STUDENT: ['lms', 'unieventify'],
    RoleChoices.REGISTRAR: ['lms', 'citc_portal'],
    RoleChoices.EVENT_COORDINATOR: ['unieventify'],
    RoleChoices.STUDENT_ORG_LEADER: ['unieventify'],
    RoleChoices.STAFF: ['citc_portal'],
}


def get_role_display(role: str) -> str:
    """Get human-readable display name for role"""
    return ROLE_DESCRIPTIONS.get(role, role)


def get_dashboard_for_role(role: str) -> str:
    """Get primary dashboard URL for role"""
    return ROLE_DASHBOARDS.get(role, '/dashboard/')


def get_role_rank(role: str) -> int:
    """Get rank/authority level of role (lower = higher authority)"""
    return ROLE_HIERARCHY.get(role, 999)


def can_manage_role(user_role: str, target_role: str) -> bool:
    """Check if user can manage/create the target role based on their role"""
    user_rank = get_role_rank(user_role)
    target_rank = get_role_rank(target_role)
    return user_rank <= target_rank
