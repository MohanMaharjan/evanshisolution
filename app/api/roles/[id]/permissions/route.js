import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Assign a permission to a role
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { error: 'Invalid role ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { permissionId } = body;

    if (!permissionId) {
      return NextResponse.json(
        { error: 'Permission ID is required' },
        { status: 400 }
      );
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if permission exists
    const permission = await prisma.permission.findUnique({
      where: { id: parseInt(permissionId) },
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check if already assigned
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: parseInt(permissionId),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Permission already assigned to this role' },
        { status: 409 }
      );
    }

    const rolePermission = await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId: parseInt(permissionId),
      },
      include: {
        permission: {
          select: {
            id: true,
            name: true,
            module: true,
            action: true,
          },
        },
      },
    });

    return NextResponse.json({
      rolePermission: {
        id: rolePermission.id,
        permissionId: rolePermission.permission.id,
        name: rolePermission.permission.name,
        module: rolePermission.permission.module,
        action: rolePermission.permission.action,
      },
      message: 'Permission assigned successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error assigning permission:', error);
    return NextResponse.json(
      { error: 'Failed to assign permission' },
      { status: 500 }
    );
  }
}