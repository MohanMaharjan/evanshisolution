// src/lib/permissions.js

// Permission hierarchy - higher level includes lower level permissions
const USER_LEVEL_HIERARCHY = {
  SYSTEM_ADMIN: 7,
  ADMIN: 6,
  COORDINATOR: 5,
  COUNSELOR: 4,
  LIBRARIAN: 3,
  FACULTY: 2,
  STUDENT: 1,
};

// Data access scope based on user level
export const DATA_ACCESS_SCOPE = {
  SYSTEM_ADMIN: 'all', // Can see all data
  ADMIN: 'all', // Can see all data
  COORDINATOR: 'department', // Can see department data
  COUNSELOR: 'assigned', // Can see assigned students
  LIBRARIAN: 'library', // Can see library-related data
  FACULTY: 'class', // Can see class/subject data
  STUDENT: 'self', // Can only see own data
};

// Check if user has specific permission
export function hasPermission(userPermissions, permissionName) {
  return userPermissions?.includes(permissionName) || false;
}

// Check if user has any of the specified permissions
export function hasAnyPermission(userPermissions, permissionNames) {
  return permissionNames.some((name) => userPermissions?.includes(name));
}

// Check if user's level is at least the required level
export function hasMinLevel(userLevel, requiredLevel) {
  const userRank = USER_LEVEL_HIERARCHY[userLevel] || 0;
  const requiredRank = USER_LEVEL_HIERARCHY[requiredLevel] || 0;
  return userRank >= requiredRank;
}

// Check if user can access another user's data
export function canAccessUserData(currentUser, targetUser) {
  // Can always access own data
  if (currentUser.id === targetUser.id) return true;

  // System admin and admin can access all
  if (['SYSTEM_ADMIN', 'ADMIN'].includes(currentUser.userLevel)) return true;

  // Coordinator can access department users
  if (currentUser.userLevel === 'COORDINATOR') {
    // This would need department matching logic
    return true; // Simplified for now
  }

  // Counselor can access assigned students
  if (currentUser.userLevel === 'COUNSELOR') {
    return targetUser.userLevel === 'STUDENT';
  }

  // Faculty can access their class students
  if (currentUser.userLevel === 'FACULTY') {
    return targetUser.userLevel === 'STUDENT';
  }

  return false;
}

// Get user filter based on access scope
export function getUserFilter(currentUser) {
  const scope = DATA_ACCESS_SCOPE[currentUser.userLevel];

  switch (scope) {
    case 'all':
      return {};
    case 'department':
      return {
        // Would filter by department
      };
    case 'assigned':
      return {
        userLevel: 'STUDENT',
        // Would filter by assigned counselor
      };
    case 'class':
      return {
        userLevel: 'STUDENT',
        // Would filter by class/subject
      };
    case 'self':
      return { id: parseInt(currentUser.id) };
    default:
      return { id: parseInt(currentUser.id) };
  }
}