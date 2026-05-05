/**
 * Unified Role System for CITC Portal
 * All apps use these standardized roles
 */

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DEAN = 'dean',
  CHAIRMAN = 'chairman',
  FACULTY = 'faculty',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
  REGISTRAR = 'registrar',
  EVENT_COORDINATOR = 'event_coordinator',
  STUDENT_ORG_LEADER = 'student_org_leader',
  STAFF = 'staff',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 1,
  [Role.ADMIN]: 2,
  [Role.DEAN]: 3,
  [Role.CHAIRMAN]: 4,
  [Role.REGISTRAR]: 5,
  [Role.FACULTY]: 6,
  [Role.INSTRUCTOR]: 7,
  [Role.EVENT_COORDINATOR]: 8,
  [Role.STUDENT_ORG_LEADER]: 9,
  [Role.STAFF]: 10,
  [Role.STUDENT]: 11,
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'System Administrator with full access',
  [Role.ADMIN]: 'Administrator with full access to all apps',
  [Role.DEAN]: 'Dean - College/Faculty Administrator',
  [Role.CHAIRMAN]: 'Department Chairman',
  [Role.FACULTY]: 'Faculty Member',
  [Role.INSTRUCTOR]: 'Instructor/Lecturer',
  [Role.STUDENT]: 'Student',
  [Role.REGISTRAR]: 'Registrar Staff',
  [Role.EVENT_COORDINATOR]: 'Event Coordinator',
  [Role.STUDENT_ORG_LEADER]: 'Student Organization Leader',
  [Role.STAFF]: 'Support Staff',
};

/**
 * Primary dashboard route for each role
 * This is where users are redirected after login
 */
export const ROLE_DASHBOARDS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: '/admin/',
  [Role.ADMIN]: '/dashboard/',
  [Role.DEAN]: '/dashboard/',
  [Role.CHAIRMAN]: '/dashboard/',
  [Role.FACULTY]: '/lms/',
  [Role.INSTRUCTOR]: '/lms/',
  [Role.STUDENT]: '/dashboard/',
  [Role.REGISTRAR]: '/admin/apps/',
  [Role.EVENT_COORDINATOR]: '/unieventify/app/',
  [Role.STUDENT_ORG_LEADER]: '/unieventify/app/',
  [Role.STAFF]: '/dashboard/',
};

/**
 * Apps accessible by each role
 */
export const ROLE_APPS_ACCESS: Record<Role, string[]> = {
  [Role.SUPER_ADMIN]: ['citc_portal', 'lms', 'syllabease', 'unieventify', 'consultation', 'evaluation'],
  [Role.ADMIN]: ['citc_portal', 'lms', 'syllabease', 'unieventify', 'consultation', 'evaluation'],
  [Role.DEAN]: ['citc_portal', 'lms', 'syllabease', 'unieventify', 'consultation', 'evaluation'],
  [Role.CHAIRMAN]: ['lms', 'syllabease', 'unieventify'],
  [Role.FACULTY]: ['lms', 'syllabease', 'unieventify', 'consultation'],
  [Role.INSTRUCTOR]: ['lms', 'syllabease', 'unieventify'],
  [Role.STUDENT]: ['lms', 'unieventify'],
  [Role.REGISTRAR]: ['lms', 'citc_portal'],
  [Role.EVENT_COORDINATOR]: ['unieventify'],
  [Role.STUDENT_ORG_LEADER]: ['unieventify'],
  [Role.STAFF]: ['citc_portal'],
};

/**
 * Get human-readable display name for role
 */
export function getRoleDisplay(role: string): string {
  return ROLE_DESCRIPTIONS[role as Role] || role;
}

/**
 * Get primary dashboard URL for role
 */
export function getDashboardForRole(role: string): string {
  return ROLE_DASHBOARDS[role as Role] || '/dashboard/';
}

/**
 * Get rank/authority level of role (lower = higher authority)
 */
export function getRoleRank(role: string): number {
  return ROLE_HIERARCHY[role as Role] || 999;
}

/**
 * Check if user can manage/assign the target role based on their role
 */
export function canManageRole(userRole: string, targetRole: string): boolean {
  const userRank = getRoleRank(userRole);
  const targetRank = getRoleRank(targetRole);
  return userRank <= targetRank;
}

/**
 * Check if user has access to app
 */
export function hasAppAccess(role: string, appName: string): boolean {
  const accessibleApps = ROLE_APPS_ACCESS[role as Role];
  return accessibleApps ? accessibleApps.includes(appName) : false;
}
