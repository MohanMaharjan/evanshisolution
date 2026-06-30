// app/api/students/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'active';
    const departmentId = searchParams.get('departmentId') || 'all';
    const excludeIds = searchParams.get('excludeIds') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    // Build where clause
    const where = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { enrollmentNo: { contains: search, mode: 'insensitive' } },
        { rollNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (departmentId !== 'all') {
      where.departmentId = parseInt(departmentId);
    }

    // Exclude already assigned students
    if (excludeIds) {
      const idsToExclude = excludeIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (idsToExclude.length > 0) {
        where.id = { notIn: idsToExclude };
      }
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          enrollmentNo: true,
          rollNo: true,
          status: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}