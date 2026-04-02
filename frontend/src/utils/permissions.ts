export type UserRole = 'viewer' | 'engineer' | 'admin' | 'superadmin';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  viewer: [
    '/app',
    '/app/topology',
    '/app/devices',
    '/app/analytics',
    '/app/alerts'
  ],
  engineer: [
    '/app',
    '/app/topology',
    '/app/devices',
    '/app/analytics',
    '/app/prediction',
    '/app/alerts',
    '/app/settings'
  ],
  admin: [
    '/app',
    '/app/topology',
    '/app/devices',
    '/app/analytics',
    '/app/prediction',
    '/app/alerts',
    '/app/users',
    '/app/settings',
    '/app/audit'
  ],
  superadmin: [
    '/app',
    '/app/topology',
    '/app/devices',
    '/app/analytics',
    '/app/prediction',
    '/app/alerts',
    '/app/users',
    '/app/settings',
    '/app/audit'
  ]
};

/**
 * Checks if a user role has permission to access a specific path.
 * @param role The user's role.
 * @param path The requested application path.
 * @returns boolean
 */
export const hasPermission = (role: string | undefined, path: string): boolean => {
  if (!role) return false;
  
  const normalizedRole = role.toLowerCase() as UserRole;
  const permissions = ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.viewer;
  
  return permissions.some(p => {
    // Exact match
    if (path === p) return true;
    
    // For the root '/app', we don't want it to match everything else starting with '/app/'
    if (p === '/app') return false;
    
    // Prefix matching for sub-resources (e.g., /app/devices/123 matches /app/devices)
    return path.startsWith(p + '/');
  });
};
