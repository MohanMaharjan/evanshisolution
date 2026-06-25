// components/MobileSidebar.jsx

'use client';

import Link from 'next/link';
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
  X, 
  LogOut 
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
  Book 
};

export default function MobileSidebar({ menuItems = [], pathname = '', user = {}, onClose, onSignOut }) {
  
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

  // Get role display information safely - THIS IS THE KEY FIX
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
      console.error('Error getting role info in MobileSidebar:', error);
    }
    
    return { roleDisplayName, roleColor };
  };

  const { roleDisplayName, roleColor } = getRoleInfo();
  const displayName = getDisplayName();
  const items = Array.isArray(menuItems) ? menuItems : [];

  return (
    <div className="lg:hidden fixed inset-0 z-40 flex">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar panel */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
        {/* Close button */}
        <div className="absolute top-0 right-0 -mr-12 pt-2">
          <button
            type="button"
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6 text-white" aria-hidden="true" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center px-4">
            <h1 className="text-xl font-bold text-gray-800">Evanshi Solution</h1>
          </div>
          
          {/* User info */}
          <div className="mt-6 px-4">
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
                {/* This is where the error was - now rendering strings, not objects */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleColor}`}>
                  {roleDisplayName}
                </span>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="mt-6 px-3 space-y-1">
            {items.map((item, index) => {
              const IconComponent = iconMap[item.icon] || Home;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={`mobile-${item.href}-${index}`}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <IconComponent 
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} 
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Empty state */}
            {items.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-400 text-center">
                No menu items available
              </div>
            )}
          </nav>
        </div>
        
        {/* Sign out button */}
        <div className="flex-shrink-0 px-3 py-4 border-t border-gray-200">
          <button
            onClick={onSignOut}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}