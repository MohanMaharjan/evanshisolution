// lib/sidebar-menu.js

export function getSidebarMenuForUser(role, permissions = [], userRoleId = null) {
  // Normalize permissions for consistent matching
  const normalizedPerms = permissions.map(p => String(p).toUpperCase().trim());
  
  // Check if user is system admin
  const isSystemAdmin = 
    normalizedPerms.includes('SYSTEM_ADMIN') ||
    normalizedPerms.includes('ADMIN') ||
    String(role || '').toUpperCase().includes('SYSTEM_ADMIN') ||
    String(role || '').toUpperCase().includes('ADMIN');

  // Helper: check if user has any of the given permissions
  const hasAny = (...perms) => {
    if (isSystemAdmin) return true;
    if (normalizedPerms.includes('ALL_ACCESS')) return true;
    return perms.some(p => normalizedPerms.includes(p.toUpperCase().trim()));
  };

  // Helper: check if user has permission matching a pattern
  const hasPattern = (pattern) => {
    if (isSystemAdmin) return true;
    if (normalizedPerms.includes('ALL_ACCESS')) return true;
    return normalizedPerms.some(p => p.includes(pattern.toUpperCase()));
  };

  // Define all possible menus with their required permissions
  const menuDefinitions = [
    // Common (always visible)
    { name: 'Dashboard', href: '/dashboard', icon: 'Home', show: true },
    { name: 'Profile', href: '/dashboard/profile', icon: 'User', show: true },
    
    // Users
    { name: 'Users', href: '/dashboard/users', icon: 'Users', 
      show: hasAny('MANAGE_USERS', 'CREATE_USER', 'READ_USER', 'UPDATE_USER', 'DELETE_USER') || hasPattern('_USER') },
    
    // Roles & Permissions
    { name: 'Roles & Permissions', href: '/dashboard/roles', icon: 'Shield', 
      show: hasAny('MANAGE_ROLES', 'CREATE_ROLES', 'READ_ROLES', 'UPDATE_ROLES', 'DELETE_ROLES') || hasPattern('_ROLE') },
    
    // Departments
    { name: 'Departments', href: '/dashboard/departments', icon: 'Building', 
      show: hasAny('MANAGE_DEPARTMENTS', 'CREATE_DEPARTMENT', 'READ_DEPARTMENT', 'UPDATE_DEPARTMENT', 'DELETE_DEPARTMENT') || hasPattern('_DEPARTMENT') },
    
    // Batches
    { name: 'Batches', href: '/dashboard/batch', icon: 'Layers', 
      show: hasAny('MANAGE_BATCH', 'CREATE_BATCH', 'READ_BATCH', 'UPDATE_BATCH', 'DELETE_BATCH') || hasPattern('_BATCH') },
    
    // Faculty
    { name: 'Faculty', href: '/dashboard/faculty', icon: 'UserCheck', 
      show: hasAny('MANAGE_FACULTY', 'CREATE_FACULTY', 'READ_FACULTY', 'UPDATE_FACULTY', 'DELETE_FACULTY', 'VIEW_FACULTY') || hasPattern('_FACULTY') },
    
    // Classroom
    { name: 'Classrooms', href: '/dashboard/classroom', icon: 'Layers', 
      show: hasAny('MANAGE_CLASSROOM', 'CREATE_CLASSROOM', 'READ_CLASSROOM', 'UPDATE_CLASSROOM', 'DELETE_CLASSROOM', 'VIEW_CLASSROOM') || hasPattern('_CLASSROOM') },
    
   
    
    
    
    // Library
    { name: 'Library', href: '/dashboard/library', icon: 'Book', 
      show: hasAny('VIEW_LIBRARY', 'READ_LIBRARY', 'MANAGE_LIBRARY') },
  ];

  // Filter only visible menus
  const visibleMenus = menuDefinitions.filter(menu => menu.show);

  // Log for debugging
  if (typeof window !== 'undefined') {
    console.log('=== SIDEBAR MENU ===');
    console.log('Role:', role);
    console.log('Permissions:', normalizedPerms);
    console.log('System Admin:', isSystemAdmin);
    console.log('Visible menus:', visibleMenus.map(m => m.name));
  }

  return visibleMenus.map(({ name, href, icon }) => ({ name, href, icon }));
}

// Helper function to get role display name
export function getRoleDisplayName(role) {
  let roleName = '';
  if (typeof role === 'string') roleName = role;
  else if (role?.name) roleName = role.name;
  else if (role?.roleName) roleName = role.roleName;

  if (!roleName) return 'Unknown';

  return roleName
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to get role color
export function getRoleColor(role) {
  let roleName = '';
  if (typeof role === 'string') roleName = role;
  else if (role?.name) roleName = role.name;

  const lower = roleName.toLowerCase();

  if (lower.includes('system admin')) return 'bg-red-100 text-red-800';
  if (lower.includes('admin')) return 'bg-purple-100 text-purple-800';
  if (lower.includes('coordinator')) return 'bg-blue-100 text-blue-800';
  if (lower.includes('counselor')) return 'bg-green-100 text-green-800';
  if (lower.includes('librarian')) return 'bg-yellow-100 text-yellow-800';
  if (lower.includes('faculty') || lower.includes('teacher') || lower.includes('instructor')) {
    return 'bg-indigo-100 text-indigo-800';
  }
  if (lower.includes('student')) return 'bg-teal-100 text-teal-800';
  if (lower.includes('accountant')) return 'bg-orange-100 text-orange-800';
  if (lower.includes('it')) return 'bg-cyan-100 text-cyan-800';

  const colors = [
    'bg-pink-100 text-pink-800',
    'bg-rose-100 text-rose-800',
    'bg-violet-100 text-violet-800',
    'bg-fuchsia-100 text-fuchsia-800',
    'bg-amber-100 text-amber-800',
    'bg-lime-100 text-lime-800',
    'bg-emerald-100 text-emerald-800',
    'bg-sky-100 text-sky-800',
  ];

  const hash = roleName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}