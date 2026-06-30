// app/api/faculties/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/faculties - Fetch all faculties
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      where.userDepartment = {
        departmentId: parseInt(departmentId),
      };
    }

    const faculties = await prisma.faculty.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        designation: true,
        specialization: true,
        qualification: true,
        status: true,
        userDepartment: {
          select: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ faculties });
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch faculties' },
      { status: 500 }
    );
  }
}