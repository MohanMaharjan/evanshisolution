import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const permission = await prisma.permission.update({
      where: { id: parseInt(id) },
      data: { 
        name: body.name, 
        description: body.description, 
        module: body.module, 
        action: body.action 
      },
    });
    
    return NextResponse.json({ permission });
  } catch (error) {
    console.error('Failed to update permission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.permission.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete permission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}