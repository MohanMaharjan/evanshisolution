import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
  try {
    const { id, permissionId } = await params;
    
    await prisma.rolePermission.deleteMany({
      where: { 
        roleId: parseInt(id), 
        permissionId: parseInt(permissionId) 
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove permission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}