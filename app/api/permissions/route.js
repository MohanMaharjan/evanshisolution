import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const permission = await prisma.permission.create({
      data: { 
        name: body.name, 
        description: body.description, 
        module: body.module, 
        action: body.action 
      },
    });
    return NextResponse.json({ permission }, { status: 201 });
  } catch (error) {
    console.error('Failed to create permission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}