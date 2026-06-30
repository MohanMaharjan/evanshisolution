// app/api/batches/[id]/students/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ==================== GET - Fetch all students in a batch ====================
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const batchId = parseInt(id);

    if (isNaN(batchId)) {
      return NextResponse.json({ error: 'Invalid batch ID' }, { status: 400 });
    }

    // Check if batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    // Build where clause
    const where = { batchId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { enrollmentNo: { contains: search, mode: 'insensitive' } },
        { rollNo: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.student.count({ where });

    // Fetch students with relations
    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rollNo: true,
        enrollmentNo: true,
        address: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        guardianName: true,
        guardianContact: true,
        guardianEmail: true,
        emergencyContact: true,
        examRollNumber: true,
        status: true,
        enrollmentDate: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        batch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching batch students:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== POST - Create students in a batch ====================
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const batchId = parseInt(id);

    if (isNaN(batchId)) {
      return NextResponse.json({ error: 'Invalid batch ID' }, { status: 400 });
    }

    // Check if batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        departments: {
          select: { id: true, name: true },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { students } = body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No students provided. Expected { students: [...] }' }, { status: 400 });
    }

    const createdStudents = [];
    const errors = [];

    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      const {
        name,
        email,
        phone,
        rollNo,
        address,
        enrollmentNo,
        dateOfBirth,
        gender,
        bloodGroup,
        guardianName,
        guardianContact,
        guardianEmail,
        emergencyContact,
        examRollNumber,
        departmentId,
      } = studentData;

      // Validate required fields
      if (!name?.trim()) {
        errors.push(`Student ${i + 1}: Name is required`);
        continue;
      }
      if (!email?.trim()) {
        errors.push(`Student ${i + 1} (${name}): Email is required`);
        continue;
      }
      if (!phone?.trim()) {
        errors.push(`Student ${i + 1} (${name}): Phone is required`);
        continue;
      }

      // Check for duplicate email
      const existingEmail = await prisma.student.findUnique({
        where: { email: email.trim() },
      });

      if (existingEmail) {
        errors.push(`Student ${i + 1} (${name}): Email "${email}" already exists`);
        continue;
      }

      // Check for duplicate phone
      if (phone.trim()) {
        const existingPhone = await prisma.student.findUnique({
          where: { phone: phone.trim() },
        });

        if (existingPhone) {
          errors.push(`Student ${i + 1} (${name}): Phone "${phone}" already exists`);
          continue;
        }
      }

      // Check for duplicate enrollment number
      if (enrollmentNo?.trim()) {
        const existingEnrollment = await prisma.student.findUnique({
          where: { enrollmentNo: enrollmentNo.trim() },
        });

        if (existingEnrollment) {
          errors.push(`Student ${i + 1} (${name}): Enrollment No "${enrollmentNo}" already exists`);
          continue;
        }
      }

      // Check for duplicate exam roll number
      if (examRollNumber?.trim()) {
        const existingExamRoll = await prisma.student.findUnique({
          where: { examRollNumber: examRollNumber.trim() },
        });

        if (existingExamRoll) {
          errors.push(`Student ${i + 1} (${name}): Exam Roll No "${examRollNumber}" already exists`);
          continue;
        }
      }

      // Validate department if provided
      let finalDepartmentId = null;
      if (departmentId) {
        const dept = await prisma.department.findUnique({
          where: { id: parseInt(departmentId) },
        });
        if (dept) {
          finalDepartmentId = parseInt(departmentId);
        } else {
          errors.push(`Student ${i + 1} (${name}): Department ID "${departmentId}" not found`);
        }
      }

      // Auto-assign to first batch department if no department specified
      if (!finalDepartmentId && batch.departments.length > 0) {
        finalDepartmentId = batch.departments[0].id;
      }

      try {
        const student = await prisma.student.create({
          data: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            rollNo: rollNo?.trim() || null,
            address: address?.trim() || null,
            enrollmentNo: enrollmentNo?.trim() || null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            gender: gender || null,
            bloodGroup: bloodGroup?.trim() || null,
            guardianName: guardianName?.trim() || null,
            guardianContact: guardianContact?.trim() || null,
            guardianEmail: guardianEmail?.trim() || null,
            emergencyContact: emergencyContact?.trim() || null,
            examRollNumber: examRollNumber?.trim() || null,
            batchId: batchId,
            departmentId: finalDepartmentId,
            status: 'active',
          },
          include: {
            department: {
              select: { id: true, name: true, code: true },
            },
            batch: {
              select: { id: true, name: true },
            },
          },
        });

        createdStudents.push(student);
      } catch (createError) {
        console.error(`Error creating student ${name}:`, createError);
        errors.push(`Student ${i + 1} (${name}): Database error - ${createError.message}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        students: createdStudents,
        message: `${createdStudents.length} student(s) created successfully`,
        errors: errors.length > 0 ? errors : undefined,
        totalProcessed: students.length,
        totalCreated: createdStudents.length,
        totalFailed: errors.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/batches/[id]/students:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}