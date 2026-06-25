// app/api/menus/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSidebarMenuForUser } from '@/lib/sidebar-menu';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user with role and permissions
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const permissions = user.role.permissions.map(rp => rp.permission.name);
    const role = {
      id: user.role.id,
      name: user.role.name,
    };

    // Get menu items based on permissions
    const menus = getSidebarMenuForUser(role, permissions);

    return NextResponse.json({
      menus,
      role,
      permissions,
    });
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menus' },
      { status: 500 }
    );
  }
}