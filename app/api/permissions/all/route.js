import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Fetch all permissions (for default permissions)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    // Allow unauthenticated requests for default permissions
    // This ensures the frontend can get permissions even without a session
    if (!session) {
      // Return default permissions for unauthenticated users
      return NextResponse.json({
        permissions: getDefaultPermissions(),
        count: getDefaultPermissions().length,
        message: 'Using default permissions (unauthenticated)'
      });
    }

    // Fetch all permissions from database
    const permissions = await prisma.permission.findMany({
      select: {
        resource: true,
        action: true,
        description: true,
      },
      // FIXED: Order by resource and action instead of name
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    // Format permissions as strings in the format expected by usePermissions hook
    // The hook expects: module:action (e.g., batches:READ)
    const formattedPermissions = permissions.map(
      (p) => `${p.resource}:${p.action}`
    );

    // If no permissions exist in database, return default permissions
    if (formattedPermissions.length === 0) {
      const defaults = getDefaultPermissions();
      return NextResponse.json({
        permissions: defaults,
        count: defaults.length,
        message: 'Using default permissions (database empty)'
      });
    }

    return NextResponse.json({
      permissions: formattedPermissions,
      count: formattedPermissions.length,
      message: 'Permissions fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching all permissions:', error);
    
    // Return default permissions on error to prevent frontend crashes
    const defaults = getDefaultPermissions();
    return NextResponse.json({
      permissions: defaults,
      count: defaults.length,
      message: 'Using default permissions (error occurred)',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Helper function to get default permissions
function getDefaultPermissions() {
  return [
    // Batch permissions
    'batches:READ',
    'batches:CREATE',
    'batches:UPDATE',
    'batches:DELETE',
    'batches:MANAGE',
    
    // Course permissions
    'courses:READ',
    'courses:CREATE',
    'courses:UPDATE',
    'courses:DELETE',
    'courses:MANAGE',
    'courses:IMPORT',
    'courses:EXPORT',
    
    // Student permissions
    'students:READ',
    'students:CREATE',
    'students:UPDATE',
    'students:DELETE',
    'students:MANAGE',
    
    // Department permissions
    'departments:READ',
    'departments:CREATE',
    'departments:UPDATE',
    'departments:DELETE',
    'departments:MANAGE',
    
    // Faculty permissions
    'faculty:READ',
    'faculty:CREATE',
    'faculty:UPDATE',
    'faculty:DELETE',
    
    // User permissions
    'users:READ',
    'users:CREATE',
    'users:UPDATE',
    'users:DELETE',
    'users:MANAGE',
    
    // Classroom permissions
    'classrooms:READ',
    'classrooms:CREATE',
    'classrooms:UPDATE',
    'classrooms:DELETE',
    
    // Exam permissions
    'exams:READ',
    'exams:CREATE',
    'exams:UPDATE',
    'exams:DELETE',
    
    // Attendance permissions
    'attendance:READ',
    'attendance:CREATE',
    'attendance:UPDATE',
    'attendance:DELETE',
    
    // Routine permissions
    'routines:READ',
    'routines:CREATE',
    'routines:UPDATE',
    'routines:DELETE',
    
    // Settings permissions
    'settings:READ',
    'settings:UPDATE',
    'settings:MANAGE',
    
    // Report permissions
    'reports:READ',
    'reports:CREATE',
    'reports:EXPORT',
  ];
}