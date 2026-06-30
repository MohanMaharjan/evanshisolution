import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE - Remove a permission from a role
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, permissionId } = await params;
    const roleId = parseInt(id);
    const permId = parseInt(permissionId);

    if (isNaN(roleId) || isNaN(permId)) {
      return NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Check if role permission exists
    const rolePermission = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permId,
        },
      },
    });

    if (!rolePermission) {
      return NextResponse.json(
        { error: 'Permission not assigned to this role' },
        { status: 404 }
      );
    }

    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Permission removed successfully',
    });
  } catch (error) {
    console.error('Error removing permission:', error);
    return NextResponse.json(
      { error: 'Failed to remove permission' },
      { status: 500 }
    );
  }
}