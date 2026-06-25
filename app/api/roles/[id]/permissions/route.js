import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { permissionId } = await request.json();
    
    const rolePermission = await prisma.rolePermission.create({
      data: { 
        roleId: parseInt(id), 
        permissionId: parseInt(permissionId) 
      },
    });
    
    return NextResponse.json({ rolePermission }, { status: 201 });
  } catch (error) {
    console.error('Failed to assign permission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}