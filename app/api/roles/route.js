import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: { 
        permissions: {
          include: {
            permission: true
          }
        }, 
        users: true 
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Transform permissions to include permission details
    const transformedRoles = roles.map(role => ({
      ...role,
      permissions: role.permissions.map(rp => ({
        id: rp.id,
        roleId: rp.roleId,
        permissionId: rp.permissionId,
        permission: rp.permission,
        createdAt: rp.createdAt,
      })),
    }));
    
    return NextResponse.json({ roles: transformedRoles });
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const role = await prisma.role.create({
      data: { 
        name: body.name, 
        description: body.description,
      },
      include: { 
        permissions: {
          include: {
            permission: true
          }
        },
        users: true
      },
    });
    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error('Failed to create role:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}