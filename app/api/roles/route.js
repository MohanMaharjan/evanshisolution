import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all roles
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await prisma.role.findMany({
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
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Format roles for frontend
    const formattedRoles = roles.map((role) => ({
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
    }));

    return NextResponse.json({
      roles: formattedRoles,
      count: formattedRoles.length,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST - Create a new role
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role already exists' },
        { status: 409 }
      );
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissionIds?.length > 0 ? {
          create: permissionIds.map((permissionId) => ({
            permission: { connect: { id: parseInt(permissionId) } },
          })),
        } : undefined,
      },
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
      message: 'Role created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}