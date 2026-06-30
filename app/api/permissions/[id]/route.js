import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch a single permission
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const permissionId = parseInt(id);

    if (isNaN(permissionId)) {
      return NextResponse.json(
        { error: 'Invalid permission ID' },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ permission });
  } catch (error) {
    console.error('Error fetching permission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permission' },
      { status: 500 }
    );
  }
}

// PUT - Update a permission
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const permissionId = parseInt(id);

    if (isNaN(permissionId)) {
      return NextResponse.json(
        { error: 'Invalid permission ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, module, action, description } = body;

    if (!name || !module || !action) {
      return NextResponse.json(
        { error: 'Name, module, and action are required' },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        name,
        module,
        action,
        description,
      },
    });

    return NextResponse.json({
      permission,
      message: 'Permission updated successfully',
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a permission
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const permissionId = parseInt(id);

    if (isNaN(permissionId)) {
      return NextResponse.json(
        { error: 'Invalid permission ID' },
        { status: 400 }
      );
    }

    // Check if permission is in use
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { permissionId },
    });

    if (rolePermissions.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete permission in use',
          details: `This permission is assigned to ${rolePermissions.length} role(s)`,
        },
        { status: 409 }
      );
    }

    await prisma.permission.delete({
      where: { id: permissionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Permission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { error: 'Failed to delete permission' },
      { status: 500 }
    );
  }
}