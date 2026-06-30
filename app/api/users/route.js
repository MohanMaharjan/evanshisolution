// app/api/users/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (role) {
      where.role = { name: role };
    }
    
    if (status) {
      where.status = status;
    }

    // Fetch users with correct relations based on your schema
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          userDepartments: {
            include: {
              department: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              rollNo: true,
              enrollmentNo: true,
              status: true,
              dateOfBirth: true,
              gender: true,
              address: true,
              bloodGroup: true,
              guardianName: true,
              guardianContact: true,
              guardianEmail: true,
              emergencyContact: true,
              examRollNumber: true,
              enrollmentDate: true,
            },
          },
          faculty: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              address: true,
              designation: true,
              specialization: true,
              qualification: true,
              joinedDate: true,       // ✅ Correct field name from schema
              cv: true,
              profilePicture: true,
              status: true,
              userId: true,
              userDepartmentId: true,
              createdAt: true,
              updatedAt: true,
              // Remove these as they don't exist in your schema:
              // dateOfJoining: true,  ❌ Doesn't exist
              // experience: true,     ❌ Doesn't exist
              // bio: true,            ❌ Doesn't exist
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}