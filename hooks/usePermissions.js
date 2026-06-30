// hooks/usePermissions.js
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, useMemo } from 'react';

// Admin roles that should have full access
const ADMIN_ROLES = ['SYSTEM_ADMIN', 'ADMIN', 'System Administrator', 'Administrator'];

// Module-level cache
let cachedDefaultPermissions = null;
let permissionsFetchPromise = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Resource name mapping (singular to plural, and vice versa)
const RESOURCE_MAP = {
  // Standard resources
  'course': 'COURSE',
  'courses': 'COURSE',
  'student': 'STUDENT',
  'students': 'STUDENT',
  'department': 'DEPARTMENT',
  'departments': 'DEPARTMENT',
  'role': 'ROLE',
  'roles': 'ROLE',
  'user': 'USER',
  'users': 'USER',
  'batch': 'BATCH',
  'batches': 'BATCH',
  'faculty': 'FACULTY',
  'faculties': 'FACULTY',
  'classroom': 'CLASSROOM',
  'classrooms': 'CLASSROOM',
  'exam': 'EXAM',
  'exams': 'EXAM',
  'attendance': 'ATTENDANCE',
  'routine': 'ROUTINE',
  'routines': 'ROUTINE',
  'setting': 'SETTING',
  'settings': 'SETTING',
  'report': 'REPORT',
  'reports': 'REPORT',
};

// Action mapping (lowercase to uppercase)
const ACTION_MAP = {
  'read': 'READ',
  'view': 'READ',
  'create': 'CREATE',
  'add': 'CREATE',
  'update': 'UPDATE',
  'edit': 'UPDATE',
  'delete': 'DELETE',
  'remove': 'DELETE',
  'manage': 'MANAGE',
  'import': 'IMPORT',
  'export': 'EXPORT',
};

export function usePermissions() {
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Normalize a permission string to "RESOURCE:ACTION" format
   */
  const normalizePermission = (perm) => {
    if (!perm) return '';
    
    if (typeof perm !== 'string') {
      if (perm && perm.resource && perm.action) {
        return `${String(perm.resource).toUpperCase()}:${String(perm.action).toUpperCase()}`;
      }
      return '';
    }

    // Already in "RESOURCE:ACTION" format
    if (perm.includes(':')) {
      const [resource, action] = perm.split(':');
      return `${resource.toUpperCase()}:${action.toUpperCase()}`;
    }

    // Convert "ACTION_RESOURCE" or "ACTION_RESOURCES" to "RESOURCE:ACTION"
    const match = perm.match(/^(CREATE|READ|UPDATE|DELETE|MANAGE|IMPORT|EXPORT)_(.+)$/i);
    if (match) {
      const action = match[1].toUpperCase();
      // Remove trailing 'S' for plural resources (ROLES -> ROLE)
      let resource = match[2].toUpperCase().replace(/S$/, '');
      return `${resource}:${action}`;
    }

    return perm.toUpperCase();
  };

  /**
   * Safely extract role name from session user
   */
  const getRoleName = useCallback((user) => {
    if (!user) return '';
    if (typeof user.role === 'string') return user.role;
    if (user.role && typeof user.role === 'object') {
      return user.role.name || user.role.id || '';
    }
    return '';
  }, []);

  const fetchDefaultPermissions = useCallback(async () => {
    if (cachedDefaultPermissions && Date.now() - lastFetchTime < CACHE_TTL) {
      return cachedDefaultPermissions;
    }

    if (permissionsFetchPromise) {
      return await permissionsFetchPromise;
    }

    permissionsFetchPromise = (async () => {
      try {
        const response = await fetch('/api/permissions/all');
        
        if (!response.ok) {
          console.warn('Failed to fetch permissions from API, using defaults');
          return getDefaultPermissions();
        }

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Failed to parse permissions response:', parseError);
          return getDefaultPermissions();
        }
        
        if (data.permissions && data.permissions.length > 0) {
          const formattedPerms = data.permissions
            .map(normalizePermission)
            .filter(Boolean);
          
          if (formattedPerms.length > 0) {
            cachedDefaultPermissions = formattedPerms;
            lastFetchTime = Date.now();
            return formattedPerms;
          }
        }
        
        console.log('No permissions from API, using defaults');
        return getDefaultPermissions();
      } catch (error) {
        console.error('Error fetching default permissions:', error);
        return getDefaultPermissions();
      }
    })();

    try {
      return await permissionsFetchPromise;
    } finally {
      setTimeout(() => {
        permissionsFetchPromise = null;
      }, CACHE_TTL);
    }
  }, []);

  function getDefaultPermissions() {
    const allResources = [
      'COURSE', 'STUDENT', 'DEPARTMENT', 'BATCH', 'USER',
      'FACULTY', 'ROLE', 'CLASSROOM', 'EXAM', 'ATTENDANCE',
      'ROUTINE', 'SETTING', 'REPORT'
    ];

    const allActions = ['READ', 'CREATE', 'UPDATE', 'DELETE'];

    const permissions = [];
    for (const resource of allResources) {
      for (const action of allActions) {
        permissions.push(`${resource}:${action}`);
      }
    }

    permissions.push('COURSE:IMPORT', 'COURSE:EXPORT', 'COURSE:MANAGE');
    permissions.push('STUDENT:MANAGE');
    permissions.push('ROLE:MANAGE');
    permissions.push('SETTING:MANAGE');
    permissions.push('REPORT:EXPORT');

    return permissions;
  }

  useEffect(() => {
    let mounted = true;

    async function loadPermissions() {
      if (!mounted) return;

      const defaults = await fetchDefaultPermissions();

      if (status === 'authenticated' && session?.user) {
        try {
          const userRoleName = getRoleName(session.user);
          
          // Check if user has admin role
          const isAdmin = ADMIN_ROLES.some(role => 
            userRoleName && userRoleName.toLowerCase() === role.toLowerCase()
          );

          if (isAdmin) {
            if (mounted) {
              setPermissions(defaults);
              setUserRole(userRoleName);
              setIsLoading(false);
            }
            return;
          }

          // Fetch user-specific permissions from API
          const response = await fetch('/api/user/permissions');

          if (!response.ok) {
            if (mounted) {
              setPermissions([]);
              setUserRole(userRoleName);
              setIsLoading(false);
            }
            return;
          }

          const data = await response.json();

          if (mounted) {
            if (data.permissions && data.permissions.length > 0) {
              const normalizedPermissions = data.permissions
                .map(normalizePermission)
                .filter(Boolean);
              setPermissions(normalizedPermissions);
            } else {
              setPermissions([]);
            }
            setUserRole(data.role || userRoleName);
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error fetching user permissions:', error);
          if (mounted) {
            setPermissions([]);
            setUserRole(getRoleName(session.user));
            setIsLoading(false);
          }
        }
      } else if (status === 'unauthenticated') {
        if (mounted) {
          setPermissions([]);
          setUserRole('');
          setIsLoading(false);
        }
      }
    }

    loadPermissions();

    return () => {
      mounted = false;
    };
  }, [session, status, fetchDefaultPermissions, getRoleName]);

  // Determine if user has full access - SAFELY
  const hasFullAccess = useMemo(() => {
    // Get role from multiple possible sources
    let roleName = '';
    
    if (userRole && typeof userRole === 'string') {
      roleName = userRole;
    } else if (session?.user) {
      roleName = getRoleName(session.user);
    }
    
    // Safety check - ensure roleName is a string before calling toLowerCase
    if (!roleName || typeof roleName !== 'string') {
      return false;
    }
    
    return ADMIN_ROLES.some(adminRole => 
      roleName.toLowerCase() === adminRole.toLowerCase()
    );
  }, [userRole, session, getRoleName]);

  /**
   * Check if user has a specific permission
   */
  const can = useCallback(
    (resource, action) => {
      // Full access for admins
      if (hasFullAccess) return true;

      // Normalize inputs
      const actionUpper = ACTION_MAP[action.toLowerCase()] || action.toUpperCase();
      const resourceUpper = RESOURCE_MAP[resource.toLowerCase()] || resource.toUpperCase();
      
      // Generate all possible permission formats to check
      const possibleFormats = [
        `${resourceUpper}:${actionUpper}`,           // BATCH:CREATE
        `${actionUpper}_${resourceUpper}`,           // CREATE_BATCH
      ];

      // Also check singular form (ROLES -> ROLE)
      const singularResource = resourceUpper.replace(/S$/, '');
      if (singularResource !== resourceUpper) {
        possibleFormats.push(
          `${singularResource}:${actionUpper}`,       // ROLE:CREATE
          `${actionUpper}_${singularResource}`,       // CREATE_ROLE
        );
      }

      // Also check plural form if singular was passed
      const pluralResource = resourceUpper.endsWith('S') ? resourceUpper : `${resourceUpper}S`;
      if (pluralResource !== resourceUpper) {
        possibleFormats.push(
          `${pluralResource}:${actionUpper}`,         // ROLES:CREATE
          `${actionUpper}_${pluralResource}`,         // CREATE_ROLES
        );
      }

      // Debug logging (remove in production)
      const hasPermission = possibleFormats.some(format => permissions.includes(format));
      
      if (!hasPermission && process.env.NODE_ENV === 'development') {
        console.log(`Permission check failed: can('${resource}', '${action}')`, {
          userPermissions: permissions,
          checkedFormats: possibleFormats,
          resourceUpper,
          actionUpper,
        });
      }

      return hasPermission;
    },
    [hasFullAccess, permissions]
  );

  /**
   * Check if user has any of the specified permissions
   */
  const hasAny = useCallback(
    (requiredPermissions) => {
      if (hasFullAccess) return true;
      return requiredPermissions.some((p) => {
        const [resource, action] = p.split(':');
        return can(resource, action);
      });
    },
    [hasFullAccess, can]
  );

  /**
   * Check if user has all of the specified permissions
   */
  const hasAll = useCallback(
    (requiredPermissions) => {
      if (hasFullAccess) return true;
      return requiredPermissions.every((p) => {
        const [resource, action] = p.split(':');
        return can(resource, action);
      });
    },
    [hasFullAccess, can]
  );

  // Convenience permission groups
  const permissionGroups = useMemo(
    () => ({
      courses: {
        view: can('courses', 'read'),
        create: can('courses', 'create'),
        update: can('courses', 'update'),
        delete: can('courses', 'delete'),
        manage: can('courses', 'manage'),
        import: can('courses', 'import'),
        export: can('courses', 'export'),
      },
      students: {
        view: can('students', 'read'),
        create: can('students', 'create'),
        update: can('students', 'update'),
        delete: can('students', 'delete'),
        manage: can('students', 'manage'),
      },
      faculty: {
        view: can('faculty', 'read'),
        create: can('faculty', 'create'),
        update: can('faculty', 'update'),
        delete: can('faculty', 'delete'),
      },
      departments: {
        view: can('departments', 'read'),
        create: can('departments', 'create'),
        update: can('departments', 'update'),
        delete: can('departments', 'delete'),
      },
      batches: {
        view: can('batches', 'read'),
        create: can('batches', 'create'),
        update: can('batches', 'update'),
        delete: can('batches', 'delete'),
      },
      roles: {
        view: can('roles', 'read'),
        create: can('roles', 'create'),
        update: can('roles', 'update'),
        delete: can('roles', 'delete'),
        manage: can('roles', 'manage'),
      },
      classrooms: {
        view: can('classrooms', 'read'),
        create: can('classrooms', 'create'),
        update: can('classrooms', 'update'),
        delete: can('classrooms', 'delete'),
      },
      exams: {
        view: can('exams', 'read'),
        create: can('exams', 'create'),
        update: can('exams', 'update'),
        delete: can('exams', 'delete'),
      },
      attendance: {
        view: can('attendance', 'read'),
        create: can('attendance', 'create'),
        update: can('attendance', 'update'),
        delete: can('attendance', 'delete'),
      },
      routines: {
        view: can('routines', 'read'),
        create: can('routines', 'create'),
        update: can('routines', 'update'),
        delete: can('routines', 'delete'),
      },
      settings: {
        view: can('settings', 'read'),
        update: can('settings', 'update'),
        manage: can('settings', 'manage'),
      },
      users: {
        view: can('users', 'read'),
        create: can('users', 'create'),
        update: can('users', 'update'),
        delete: can('users', 'delete'),
      },
      reports: {
        view: can('reports', 'read'),
        generate: can('reports', 'create'),
        export: can('reports', 'export'),
      },
    }),
    [can]
  );

  return {
    permissions,
    userRole,
    isLoading,
    can,
    hasFullAccess,
    hasAny,
    hasAll,
    permissionGroups,
  };
}

// Export constants for use in components
export const PERMISSION_MODULES = {
  COURSES: 'courses',
  STUDENTS: 'students',
  FACULTY: 'faculty',
  DEPARTMENTS: 'departments',
  BATCHES: 'batches',
  ROLES: 'roles',
  CLASSROOMS: 'classrooms',
  EXAMS: 'exams',
  ATTENDANCE: 'attendance',
  ROUTINES: 'routines',
  SETTINGS: 'settings',
  USERS: 'users',
  REPORTS: 'reports',
};

export const PERMISSION_ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  MANAGE: 'MANAGE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
};