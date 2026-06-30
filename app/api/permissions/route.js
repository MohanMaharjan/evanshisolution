import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all permissions
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        name: true,
        module: true,
        action: true,
        description: true,
      },
      orderBy: [
        { module: 'asc' },
        { action: 'asc' },
      ],
    });

    return NextResponse.json({
      permissions: permissions.map(p => ({
        ...p,
        // Keep the same structure
      })),
      count: permissions.length,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// POST - Create a new permission
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, module, action, description } = body;

    if (!name || !module || !action) {
      return NextResponse.json(
        { error: 'Name, module, and action are required' },
        { status: 400 }
      );
    }

    // Check if permission already exists
    const existing = await prisma.permission.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Permission already exists' },
        { status: 409 }
      );
    }

    const permission = await prisma.permission.create({
      data: {
        name,
        module,
        action,
        description,
      },
    });

    return NextResponse.json({
      permission,
      message: 'Permission created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Failed to create permission' },
      { status: 500 }
    );
  }
}