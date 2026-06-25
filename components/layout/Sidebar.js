// components/Sidebar.jsx

'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Home,
  User,
  Users,
  Shield,
  Building,
  Clipboard,
  Settings,
  GraduationCap,
  BookOpen,
  CheckSquare,
  FileText,
  Book,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getRoleDisplayName, getRoleColor } from '@/lib/sidebar-menu';

const iconMap = {
  Home,
  User,
  Users,
  Shield,
  Building,
  Clipboard,
  Settings,
  GraduationCap,
  BookOpen,
  CheckSquare,
  FileText,
  Book,
};

export default function Sidebar({ menuItems, pathname, user, isCollapsed, onToggle }) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get initials safely
  const getInitials = () => {
    const firstName = typeof user?.firstName === 'string' ? user.firstName : '';
    const lastName = typeof user?.lastName === 'string' ? user.lastName : '';
    const name = typeof user?.name === 'string' ? user.name : '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    if (name) {
      const parts = name.split(' ').filter(Boolean);
      const firstInitial = parts[0]?.[0] || '';
      const secondInitial = parts[1]?.[0] || '';
      return `${firstInitial}${secondInitial}`.toUpperCase();
    }
    
    return 'U';
  };

  // Get display name safely
  const getDisplayName = () => {
    const name = typeof user?.name === 'string' ? user.name.trim() : '';
    const firstName = typeof user?.firstName === 'string' ? user.firstName.trim() : '';
    const lastName = typeof user?.lastName === 'string' ? user.lastName.trim() : '';
    
    if (name) return name;
    
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;
    
    return 'User';
  };

  // Get role display information safely
  const getRoleInfo = () => {
    let roleDisplayName = 'Unknown';
    let roleColor = 'bg-gray-100 text-gray-800';
    
    try {
      const userRole = user?.role;
      
      if (!userRole) {
        // Try roleName as fallback
        const roleName = user?.roleName;
        if (typeof roleName === 'string' && roleName.trim()) {
          roleDisplayName = getRoleDisplayName(roleName);
          roleColor = getRoleColor(roleName);
        }
      } else if (typeof userRole === 'object' && userRole !== null) {
        // Role is an object like {id, name, permissions}
        if (typeof userRole.name === 'string' && userRole.name.trim()) {
          roleDisplayName = getRoleDisplayName(userRole.name);
          roleColor = getRoleColor(userRole.name);
        }
      } else if (typeof userRole === 'string' && userRole.trim()) {
        // Role is a string
        roleDisplayName = getRoleDisplayName(userRole);
        roleColor = getRoleColor(userRole);
      } else if (typeof userRole === 'number') {
        // Role is a number (roleId)
        const roleName = user?.roleName;
        if (typeof roleName === 'string' && roleName.trim()) {
          roleDisplayName = getRoleDisplayName(roleName);
          roleColor = getRoleColor(roleName);
        }
      }
    } catch (error) {
      console.error('Error getting role info:', error);
    }
    
    return { roleDisplayName, roleColor };
  };

  const { roleDisplayName, roleColor } = getRoleInfo();
  const displayName = getDisplayName();
  const items = Array.isArray(menuItems) ? menuItems : [];

  return (
    <aside className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm">
        {/* Logo and Toggle */}
        <div className="flex items-center h-16 border-b border-gray-200 px-4">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-800 truncate flex-1">Evanshi Solution</h1>
          )}
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ${
              isCollapsed ? 'mx-auto' : 'ml-auto'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* User Info - Only show when expanded */}
        {!isCollapsed && (
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">{getInitials()}</span>
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate" title={displayName}>
                  {displayName}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleColor}`}>
                  {roleDisplayName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed User Avatar */}
        {isCollapsed && (
          <div className="flex justify-center py-4 border-b border-gray-200">
            <div 
              className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center" 
              title={displayName}
            >
              <span className="text-white font-medium text-sm">{getInitials()}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {items.map((item, index) => {
            const Icon = iconMap[item.icon] || Home;
            const isActive = pathname === item.href;

            return (
              <Link
                key={`${item.href}-${index}`}
                href={item.href}
                title={isCollapsed ? item.name : ''}
                className={`relative flex items-center rounded-md transition-colors group ${
                  isCollapsed 
                    ? 'justify-center px-2 py-3' 
                    : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                } ${!isCollapsed ? 'mr-3' : ''}`} />
                
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">{item.name}</span>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 inset-y-1 w-1 bg-blue-500 rounded-r-full" />
                )}
              </Link>
            );
          })}
          
          {/* Show message if no menu items */}
          {items.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400 text-center">
              No menu items available
            </div>
          )}
        </nav>

        {/* Sign Out Button */}
        <div className={`px-3 py-4 border-t border-gray-200 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={handleSignOut}
            title={isCollapsed ? 'Sign Out' : ''}
            className={`flex items-center text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors ${
              isCollapsed 
                ? 'justify-center p-3 w-auto' 
                : 'w-full px-3 py-2.5'
            }`}
          >
            <LogOut className={`h-5 w-5 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}