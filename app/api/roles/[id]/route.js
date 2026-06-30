import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch a single role
export async function GET(request, { params }) {
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

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
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
        },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map((rp) => ({
          id: rp.permission.id,
          permissionId: rp.permission.id,
          name: rp.permission.name,
          module: rp.permission.module,
          action: rp.permission.action,
        })),
        users: role.users,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PUT - Update a role
export async function PUT(request, { params }) {
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
    const { name, description, permissionIds } = body;

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Update role with transaction
    const role = await prisma.$transaction(async (tx) => {
      // Update role details
      const updatedRole = await tx.role.update({
        where: { id: roleId },
        data: {
          name: name || existingRole.name,
          description: description !== undefined ? description : existingRole.description,
        },
      });

      // Update permissions if provided
      if (permissionIds !== undefined) {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId },
        });

        // Add new permissions
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId,
              permissionId: parseInt(permissionId),
            })),
          });
        }
      }

      return tx.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
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
          },
        },
      });
    });

    return NextResponse.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map((rp) => ({
          id: rp.permission.id,
          permissionId: rp.permission.id,
          name: rp.permission.name,
          module: rp.permission.module,
          action: rp.permission.action,
        })),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
      message: 'Role updated successfully',
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a role
export async function DELETE(request, { params }) {
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

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if role has users
    if (role._count.users > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete role with users',
          details: `This role has ${role._count.users} user(s) assigned`,
        },
        { status: 409 }
      );
    }

    await prisma.role.delete({
      where: { id: roleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}