// lib/sidebar-menu.js

/**
 * Get sidebar menu items based on user permissions only
 * This approach supports dynamically created roles
 */
export function getSidebarMenuForUser(role, permissions = [], userRoleId = null) {
  // Define all available menus with their required permissions
  const allMenus = {
    dashboard: {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'Home',
      requiredPermission: null,
      category: 'common',
    },
    profile: {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: 'User',
      requiredPermission: null,
      category: 'common',
    },
    users: {
      name: 'Users',
      href: '/dashboard/users',
      icon: 'Users',
      requiredPermission: 'MANAGE_USERS',
      category: 'admin',
      alternativePermissions: ['CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER'],
    },
    roles: {
      name: 'Roles & Permissions',
      href: '/dashboard/roles',
      icon: 'Shield',
      requiredPermission: 'MANAGE_ROLES',
      category: 'admin',
      alternativePermissions: ['CREATE_ROLES', 'DELETE_ROLES', 'READ_ROLES'],
    },
    departments: {
      name: 'Departments',
      href: '/dashboard/departments',
      icon: 'Building',
      requiredPermission: 'MANAGE_DEPARTMENTS',
      category: 'admin',
      alternativePermissions: ['CREATE_DEPARTMENT', 'READ_DEPARTMENT', 'UPDATE_DEPARTMENT', 'DELETE_DEPARTMENT'],
    },
    activityLogs: {
      name: 'Activity Logs',
      href: '/dashboard/activity-logs',
      icon: 'Clipboard',
      requiredPermission: 'VIEW_LOGS',
      category: 'admin',
    },
    settings: {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: 'Settings',
      requiredPermission: 'MANAGE_SETTINGS',
      category: 'admin',
    },
    students: {
      name: 'Students',
      href: '/dashboard/students',
      icon: 'GraduationCap',
      requiredPermission: 'VIEW_STUDENTS',
      category: 'coordinator',
      alternativePermissions: ['CREATE_STUDENT', 'READ_STUDENT', 'UPDATE_STUDENT', 'DELETE_STUDENT'],
    },
    faculty: {
      name: 'Faculty',
      href: '/dashboard/faculty',
      icon: 'Users',
      requiredPermission: 'VIEW_FACULTY',
      category: 'coordinator',
      alternativePermissions: ['CREATE_FACULTY', 'READ_FACULTY', 'UPDATE_FACULTY', 'DELETE_FACULTY'],
    },
    courses: {
      name: 'Courses',
      href: '/dashboard/courses',
      icon: 'BookOpen',
      requiredPermission: 'VIEW_COURSES',
      category: 'coordinator',
      alternativePermissions: ['CREATE_COURSE', 'READ_COURSE', 'UPDATE_COURSE', 'DELETE_COURSE'],
    },
    attendance: {
      name: 'Attendance',
      href: '/dashboard/attendance',
      icon: 'CheckSquare',
      requiredPermission: 'VIEW_ATTENDANCE',
      category: 'coordinator',
      alternativePermissions: ['MARK_ATTENDANCE', 'CREATE_ATTENDANCE'],
    },
    reports: {
      name: 'Reports',
      href: '/dashboard/reports',
      icon: 'FileText',
      requiredPermission: 'VIEW_REPORTS',
      category: 'coordinator',
      alternativePermissions: ['CREATE_REPORTS', 'EXPORT_REPORTS'],
    },
    myCourses: {
      name: 'My Courses',
      href: '/dashboard/my-courses',
      icon: 'BookOpen',
      requiredPermission: 'VIEW_COURSES',
      category: 'student',
    },
    results: {
      name: 'Results',
      href: '/dashboard/results',
      icon: 'GraduationCap',
      requiredPermission: 'VIEW_RESULTS',
      category: 'student',
    },
    library: {
      name: 'Library',
      href: '/dashboard/library',
      icon: 'Book',
      requiredPermission: 'VIEW_LIBRARY',
      category: 'student',
    },
  };

  // Helper function to check if user has a specific permission
  const hasPermission = (permissionName) => {
    if (!permissionName) return true;
    
    // Check if user has the exact permission
    if (permissions.includes(permissionName)) return true;
    
    // Check if user has ALL_ACCESS
    if (permissions.includes('ALL_ACCESS')) return true;
    
    // Check if user has any alternative permissions
    const menuItem = Object.values(allMenus).find(m => m.requiredPermission === permissionName);
    if (menuItem?.alternativePermissions) {
      return menuItem.alternativePermissions.some(p => permissions.includes(p));
    }
    
    return false;
  };

  // Helper function to get menu items by category based on permissions
  const getMenusByCategory = (category) => {
    return Object.values(allMenus)
      .filter(menu => menu.category === category)
      .filter(menu => hasPermission(menu.requiredPermission));
  };

  console.log('Permissions:', permissions);
  console.log('Available permissions count:', permissions.length);

  // Start with common menus (always visible)
  let menus = [...getMenusByCategory('common')];

  // Check for ALL_ACCESS permission - show everything
  if (permissions.includes('ALL_ACCESS')) {
    console.log('ALL_ACCESS detected - showing all menus');
    menus = [
      ...menus,
      ...getMenusByCategory('admin'),
      ...getMenusByCategory('coordinator'),
      ...getMenusByCategory('faculty'),
      ...getMenusByCategory('student'),
    ];
    return menus;
  }

  // Check for admin permissions
  const hasAdminAccess = permissions.some(p => 
    p.includes('MANAGE_') || 
    p.includes('CREATE_') || 
    p.includes('DELETE_') ||
    p.includes('UPDATE_') ||
    p.includes('SYSTEM_ADMIN')
  );

  if (hasAdminAccess) {
    console.log('Admin permissions detected - showing admin menus');
    menus = [...menus, ...getMenusByCategory('admin')];
  }

  // Check for coordinator permissions
  const hasCoordinatorAccess = permissions.some(p => 
    p.includes('VIEW_STUDENTS') || 
    p.includes('VIEW_FACULTY') || 
    p.includes('VIEW_COURSES') ||
    p.includes('MANAGE_COURSES')
  );

  if (hasCoordinatorAccess) {
    console.log('Coordinator permissions detected - showing coordinator menus');
    menus = [...menus, ...getMenusByCategory('coordinator')];
  }

  // Check for faculty permissions
  const hasFacultyAccess = permissions.some(p => 
    p.includes('MARK_ATTENDANCE') || 
    p.includes('VIEW_REPORTS') ||
    p.includes('CREATE_REPORTS')
  );

  if (hasFacultyAccess) {
    console.log('Faculty permissions detected - showing faculty menus');
    menus = [...menus, ...getMenusByCategory('faculty')];
  }

  // Check for student permissions
  const hasStudentAccess = permissions.some(p => 
    p.includes('VIEW_RESULTS') || 
    p.includes('VIEW_LIBRARY') ||
    p.includes('ENROLL_COURSES')
  );

  if (hasStudentAccess) {
    console.log('Student permissions detected - showing student menus');
    menus = [...menus, ...getMenusByCategory('student')];
  }

  // If no menus found besides common, return common menus
  if (menus.length === 0) {
    console.log('No matching permissions found, returning common menus');
    return getMenusByCategory('common');
  }

  // Remove duplicates (in case a menu appears in multiple categories)
  const uniqueMenus = menus.reduce((acc, current) => {
    const exists = acc.some(item => item.href === current.href);
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, []);

  console.log('Final menus:', uniqueMenus.map(m => m.name));
  return uniqueMenus;
}

// Helper function to get role display name (for UI purposes only)
export function getRoleDisplayName(role) {
  let roleName = '';
  if (typeof role === 'string') {
    roleName = role;
  } else if (role?.name) {
    roleName = role.name;
  } else if (role?.roleName) {
    roleName = role.roleName;
  }
  
  if (!roleName) return 'Unknown';
  
  // Format role name for display
  return roleName
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to get role color (for UI purposes only)
export function getRoleColor(role) {
  let roleName = '';
  if (typeof role === 'string') {
    roleName = role;
  } else if (role?.name) {
    roleName = role.name;
  } else if (role?.roleName) {
    roleName = role.roleName;
  }
  
  const lowerRole = roleName.toLowerCase();
  
  // Predefined colors for common roles
  if (lowerRole.includes('system admin')) return 'bg-red-100 text-red-800';
  if (lowerRole.includes('admin')) return 'bg-purple-100 text-purple-800';
  if (lowerRole.includes('coordinator')) return 'bg-blue-100 text-blue-800';
  if (lowerRole.includes('counselor')) return 'bg-green-100 text-green-800';
  if (lowerRole.includes('librarian')) return 'bg-yellow-100 text-yellow-800';
  if (lowerRole.includes('faculty') || lowerRole.includes('teacher') || lowerRole.includes('instructor')) {
    return 'bg-indigo-100 text-indigo-800';
  }
  if (lowerRole.includes('student')) return 'bg-teal-100 text-teal-800';
  
  // For dynamic roles, assign a consistent color based on the role name
  const colors = [
    'bg-pink-100 text-pink-800',
    'bg-orange-100 text-orange-800',
    'bg-cyan-100 text-cyan-800',
    'bg-lime-100 text-lime-800',
    'bg-rose-100 text-rose-800',
    'bg-violet-100 text-violet-800',
    'bg-fuchsia-100 text-fuchsia-800',
    'bg-amber-100 text-amber-800',
  ];
  
  const hash = roleName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}