import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // Build where clause
    const whereClause = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Get departments with correct includes based on schema
    const departments = await prisma.department.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            userDepartments: true,
            students: true,
            courses: true,
            courseLists: true,
          },
        },
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        userDepartments: {
          select: {
            userId: true,
            isPrimary: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          take: 5,
        },
        // FIXED: Correct field names from Student model
        students: {
          select: {
            id: true,
            userId: true,
            name: true,
            email: true,
            phone: true,
            rollNo: true,           // Fixed: was rollNumber
            enrollmentNo: true,
            enrollmentDate: true,   // Fixed: was admissionDate
            status: true,
            gender: true,
            dateOfBirth: true,
            bloodGroup: true,
            guardianName: true,
            guardianContact: true,
            guardianEmail: true,
            emergencyContact: true,
          },
          take: 5,
        },
        courses: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true,
          },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform the response
    const departmentsWithCounts = departments.map((dept) => {
      const { userDepartments, students, courses, courseLists, _count, ...rest } = dept;
      
      const userCount = _count?.userDepartments || 0;
      const studentCount = _count?.students || 0;
      const courseCount = _count?.courses || 0;
      const courseListCount = _count?.courseLists || 0;

      const headName = dept.head 
        ? `${dept.head.firstName} ${dept.head.lastName}`.trim() 
        : null;

      return {
        ...rest,
        head: dept.head ? {
          ...dept.head,
          name: headName,
        } : null,
        _count: {
          users: userCount,
          students: studentCount,
          courses: courseCount,
          courseLists: courseListCount,
        },
        userDepartments: userDepartments.map((ud) => ({
          userId: ud.userId,
          isPrimary: ud.isPrimary,
          user: ud.user,
        })),
        students: students,
        courses: courses,
      };
    });

    const total = await prisma.department.count({ where: whereClause });

    return NextResponse.json({
      departments: departmentsWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, description, headId, status = 'active' } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if department with same name exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { code: { equals: code.toUpperCase(), mode: 'insensitive' } },
        ],
      },
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department with this name or code already exists' },
        { status: 409 }
      );
    }

    // If headId is provided, verify the user exists
    let headUser = null;
    if (headId) {
      headUser = await prisma.user.findUnique({
        where: { id: parseInt(headId) },
      });
      if (!headUser) {
        return NextResponse.json(
          { error: 'Head user not found' },
          { status: 404 }
        );
      }
    }

    const department = await prisma.department.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || null,
        headId: headId ? parseInt(headId) : null,
        status,
      },
      include: {
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            userDepartments: true,
            students: true,
            courses: true,
            courseLists: true,
          },
        },
      },
    });

    const formattedDepartment = {
      ...department,
      head: department.head ? {
        ...department.head,
        name: `${department.head.firstName} ${department.head.lastName}`.trim(),
      } : null,
    };

    return NextResponse.json(
      {
        department: formattedDepartment,
        message: 'Department created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}