import { UserProfile, UserRole } from '../types';

type PermissionUser = Pick<UserProfile, 'role' | 'enabled'> | null | undefined;

export function isEnabledRole(user: PermissionUser, role: UserRole): boolean {
  return user?.enabled === true && user.role === role;
}

export function isEnabledStaff(user: PermissionUser): boolean {
  return user?.enabled === true && (user.role === 'staff' || user.role === 'admin');
}

export function isEnabledAdmin(user: PermissionUser): boolean {
  return isEnabledRole(user, 'admin');
}

export function canCreateMealPlan(user: PermissionUser): boolean {
  return isEnabledStaff(user);
}

export function canUsePlanMutationTools(user: PermissionUser): boolean {
  return isEnabledStaff(user);
}

export function canAccessAdminRoute(pathname: string, user: PermissionUser): boolean {
  if (user?.enabled !== true) return false;

  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  if (normalizedPath === '/admin') return true;
  if (normalizedPath === '/admin/users') return isEnabledAdmin(user);

  return isEnabledStaff(user);
}
