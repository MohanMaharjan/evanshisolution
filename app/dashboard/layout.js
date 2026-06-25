// app/dashboard/layout.js

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Sidebar from '@/components/layout/Sidebar';
import MobileSidebar from '@/components/layout/MobileSidebar';
import { getSidebarMenuForUser } from '@/lib/sidebar-menu';
import { Loader2, AlertCircle, Menu } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState(null);

  // Generate menu items based on role and permissions
  const menuItems = useMemo(() => {
    if (!session?.user) return [];
    
    const user = session.user;
    
    // Get role name - handle both object and string
    let roleName = '';
    let permissions = [];
    
    try {
      const role = user.role;
      
      if (role) {
        if (typeof role === 'object' && role !== null && role.name) {
          // Role is an object like {id, name, permissions}
          roleName = role.name;
          permissions = Array.isArray(role.permissions) ? role.permissions : [];
        } else if (typeof role === 'string') {
          roleName = role;
        }
      }
      
      // Fallback to roleName if available
      if (!roleName && typeof user.roleName === 'string') {
        roleName = user.roleName;
      }
      
      // Also check for permissions at the user level
      if (permissions.length === 0 && Array.isArray(user.permissions)) {
        permissions = user.permissions;
      }
      
      // Convert permissions to array of strings if they're objects
      if (permissions.length > 0 && typeof permissions[0] === 'object') {
        permissions = permissions.map(p => p.name || p.action || '');
        permissions = permissions.filter(Boolean);
      }
      
    } catch (error) {
      console.error('Error processing user role/permissions:', error);
    }
    
    console.log('Processed role name:', roleName);
    console.log('Processed permissions:', permissions);
    
    const items = getSidebarMenuForUser(roleName, permissions);
    console.log('Generated menu items:', items.map(item => item.name));
    
    return items;
  }, [session]);

  // Create a safe user object to prevent rendering objects as React children
  const safeUser = useMemo(() => {
    if (!session?.user) return {};
    
    // Helper function to safely get string value
    const safeString = (value) => {
      if (typeof value === 'string') return value;
      if (value === null || value === undefined) return '';
      return '';
    };
    
    // Helper function to safely get role name
    const safeRoleName = () => {
      const role = session.user.role;
      if (!role) return '';
      
      if (typeof role === 'object' && role !== null && typeof role.name === 'string') {
        return role.name;
      }
      
      if (typeof role === 'string') {
        return role;
      }
      
      return safeString(session.user.roleName);
    };
    
    return {
      name: safeString(session.user.name),
      firstName: safeString(session.user.firstName),
      lastName: safeString(session.user.lastName),
      email: safeString(session.user.email),
      role: session.user.role, // Keep the original role object/string
      roleName: safeRoleName(),
    };
  }, [session?.user]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  }, [router]);

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Handle authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-sm text-gray-500">Redirecting to login...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Error Loading Dashboard</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Retry
            </button>
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar 
        menuItems={menuItems}
        pathname={pathname}
        user={safeUser}
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
      />

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <MobileSidebar
          menuItems={menuItems}
          pathname={pathname}
          user={safeUser}
          onClose={handleMobileMenuClose}
          onSignOut={handleSignOut}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0`}>
        {/* Mobile Header with Hamburger Menu */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Evanshi Solution</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>
        
        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}