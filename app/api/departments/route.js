import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const department = await prisma.department.create({
      data: {
        name: body.name,
        code: body.code || null,
        headId: body.headId ? parseInt(body.headId) : null,
      },
    });
    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    console.error('Failed to create department:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create department' },
      { status: 500 }
    );
  }
}