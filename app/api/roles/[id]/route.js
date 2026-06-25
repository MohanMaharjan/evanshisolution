import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: { 
        permissions: {
          include: {
            permission: true
          }
        }, 
        users: true 
      },
    });
    
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
    
    return NextResponse.json({ role });
  } catch (error) {
    console.error('Failed to fetch role:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const role = await prisma.role.update({
      where: { id: parseInt(id) },
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
    
    return NextResponse.json({ role });
  } catch (error) {
    console.error('Failed to update role:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.role.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete role:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}