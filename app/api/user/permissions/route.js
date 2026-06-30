import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let permissions = [];

    // Check for both possible admin role names
    const isSystemAdmin = 
      user.role.name === 'SYSTEM_ADMIN' || 
      user.role.name === 'System Administrator';

    if (isSystemAdmin) {
      // Get all permissions from the database
      const allPermissions = await prisma.permission.findMany({
        select: {
          module: true,
          action: true,
        },
        orderBy: {
          module: 'asc',
        },
      });
      
      // Convert to lowercase format for consistency
      permissions = allPermissions.map((p) => {
        const module = p.module.toLowerCase();
        const action = p.action.toLowerCase();
        return `${module}:${action}`;
      });
    } else {
      // Get user's specific permissions - convert to lowercase
      permissions = user.role.permissions.map((rp) => {
        const module = rp.permission.module.toLowerCase();
        const action = rp.permission.action.toLowerCase();
        return `${module}:${action}`;
      });
    }

    // Remove duplicates
    permissions = [...new Set(permissions)];

    console.log(
      `✅ Returning ${permissions.length} permissions for user ${user.email} (${user.role.name})`
    );
    console.log('📋 Permissions:', permissions);

    return NextResponse.json({
      permissions,
      role: user.role.name,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error fetching user permissions:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}