// app/api/batches/[id]/students/[studentId]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ==================== GET - Fetch single student ====================
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, studentId } = await params;
    const batchId = parseInt(id);
    const sId = parseInt(studentId);

    if (isNaN(batchId) || isNaN(sId)) {
      return NextResponse.json({ error: 'Invalid batch or student ID' }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        id: sId,
        batchId: batchId,
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

    if (!student) {
      return NextResponse.json({ error: 'Student not found in this batch' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== PUT - Update a student ====================
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, studentId } = await params;
    const batchId = parseInt(id);
    const sId = parseInt(studentId);

    if (isNaN(batchId) || isNaN(sId)) {
      return NextResponse.json({ error: 'Invalid batch or student ID' }, { status: 400 });
    }

    // Verify the student exists and belongs to the batch
    const existingStudent = await prisma.student.findFirst({
      where: {
        id: sId,
        batchId: batchId,
      },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found in this batch' }, { status: 404 });
    }

    // Parse request body
    const contentType = request.headers.get('content-type') || '';
    let updateData = {};

    if (contentType.includes('application/json')) {
      updateData = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (!['id', 'batchId', 'createdAt', 'updatedAt', 'userId'].includes(key)) {
          updateData[key] = value === '' ? null : value;
        }
      }
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
    }

    // Validate fields
    if (updateData.email !== undefined) {
      if (!updateData.email || !/^\S+@\S+\.\S+$/.test(updateData.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      // Check for duplicate email
      const duplicateEmail = await prisma.student.findFirst({
        where: {
          email: updateData.email,
          NOT: { id: sId },
        },
      });
      if (duplicateEmail) {
        return NextResponse.json({ error: 'Email already in use by another student' }, { status: 409 });
      }
    }

    if (updateData.phone !== undefined) {
      if (updateData.phone && updateData.phone.replace(/\D/g, '').length < 10) {
        return NextResponse.json({ error: 'Phone must be at least 10 digits' }, { status: 400 });
      }
      // Check for duplicate phone
      const duplicatePhone = await prisma.student.findFirst({
        where: {
          phone: updateData.phone,
          NOT: { id: sId },
        },
      });
      if (duplicatePhone) {
        return NextResponse.json({ error: 'Phone already in use by another student' }, { status: 409 });
      }
    }

    if (updateData.enrollmentNo !== undefined) {
      if (updateData.enrollmentNo) {
        const duplicateEnrollment = await prisma.student.findFirst({
          where: {
            enrollmentNo: updateData.enrollmentNo,
            NOT: { id: sId },
          },
        });
        if (duplicateEnrollment) {
          return NextResponse.json({ error: 'Enrollment number already in use' }, { status: 409 });
        }
      }
    }

    if (updateData.examRollNumber !== undefined) {
      if (updateData.examRollNumber) {
        const duplicateExamRoll = await prisma.student.findFirst({
          where: {
            examRollNumber: updateData.examRollNumber,
            NOT: { id: sId },
          },
        });
        if (duplicateExamRoll) {
          return NextResponse.json({ error: 'Exam roll number already in use' }, { status: 409 });
        }
      }
    }

    // Handle date fields
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.enrollmentDate) {
      updateData.enrollmentDate = new Date(updateData.enrollmentDate);
    }

    // Handle department ID
    if (updateData.departmentId !== undefined) {
      if (updateData.departmentId) {
        const dept = await prisma.department.findUnique({
          where: { id: parseInt(updateData.departmentId) },
        });
        if (!dept) {
          return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }
        updateData.departmentId = parseInt(updateData.departmentId);
      } else {
        updateData.departmentId = null;
      }
    }

    // Remove undefined and protected fields
    const protectedFields = ['id', 'batchId', 'createdAt', 'updatedAt', 'userId'];
    const cleanedData = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && !protectedFields.includes(key)) {
        cleanedData[key] = value;
      }
    }

    if (Object.keys(cleanedData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const student = await prisma.student.update({
      where: { id: sId },
      data: cleanedData,
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        batch: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
      student,
    });
  } catch (error) {
    console.error('Error updating student:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return NextResponse.json(
        { error: `A student with this ${field} already exists` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== DELETE - Remove student from batch ====================
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, studentId } = await params;
    const batchId = parseInt(id);
    const sId = parseInt(studentId);

    if (isNaN(batchId) || isNaN(sId)) {
      return NextResponse.json({ error: 'Invalid batch or student ID' }, { status: 400 });
    }

    // Verify the student exists in this batch
    const student = await prisma.student.findFirst({
      where: {
        id: sId,
        batchId: batchId,
      },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found in this batch' }, { status: 404 });
    }

    // Use a transaction to ensure both deletions succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete associated user if exists
      if (student.userId) {
        await tx.user.delete({
          where: { id: student.userId },
        });
      }

      // Delete the student
      await tx.student.delete({
        where: { id: sId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Student and associated user deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting student:', error);

    // Handle Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}