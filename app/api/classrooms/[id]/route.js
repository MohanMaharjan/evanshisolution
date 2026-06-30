// app/api/classrooms/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/classrooms/[id] - Get single classroom
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const classroom = await prisma.classroom.findUnique({
      where: { id: parseInt(id) },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            status: true,
            departments: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            credits: true,
            semester: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
          },
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                rollNo: true,
                enrollmentNo: true,
              },
            },
          },
        },
      },
    });

    if (!classroom) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ classroom });
  } catch (error) {
    console.error('Error fetching classroom:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch classroom' },
      { status: 500 }
    );
  }
}

// PUT /api/classrooms/[id] - Update classroom
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      code,
      capacity,
      status,
      semester,
      departmentId,
      courseId,
      facultyId,
    } = body;

    // Check if classroom exists
    const existing = await prisma.classroom.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 404 }
      );
    }

    // Check for duplicate code
    if (code && code !== existing.code) {
      const duplicate = await prisma.classroom.findFirst({
        where: { code, id: { not: parseInt(id) } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Classroom with this code already exists' },
          { status: 409 }
        );
      }
    }

    const classroom = await prisma.classroom.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existing.name,
        code: code !== undefined ? code : existing.code,
        capacity: capacity !== undefined ? (capacity ? parseInt(capacity) : null) : existing.capacity,
        status: status || existing.status,
        semester: semester || existing.semester,
        departmentId: departmentId !== undefined ? (departmentId ? parseInt(departmentId) : null) : existing.departmentId,
        courseId: courseId !== undefined ? (courseId ? parseInt(courseId) : null) : existing.courseId,
        facultyId: facultyId !== undefined ? (facultyId ? parseInt(facultyId) : null) : existing.facultyId,
      },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ classroom });
  } catch (error) {
    console.error('Error updating classroom:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update classroom' },
      { status: 500 }
    );
  }
}

// PATCH /api/classrooms/[id] - Partial update (for status toggle)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['active', 'inactive', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const classroom = await prisma.classroom.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    return NextResponse.json({ classroom });
  } catch (error) {
    console.error('Error updating classroom status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update classroom status' },
      { status: 500 }
    );
  }
}

// DELETE /api/classrooms/[id] - Delete classroom
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Check if classroom exists
    const existing = await prisma.classroom.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Classroom not found' },
        { status: 404 }
      );
    }

    // Delete related records first
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { classroomId: parseInt(id) } }),
      prisma.attendanceSummary.deleteMany({ where: { classroomId: parseInt(id) } }),
      prisma.classroomEnrollment.deleteMany({ where: { classroomId: parseInt(id) } }),
      prisma.classSession.deleteMany({ where: { classroomId: parseInt(id) } }),
      prisma.classroom.delete({ where: { id: parseInt(id) } }),
    ]);

    return NextResponse.json({ message: 'Classroom deleted successfully' });
  } catch (error) {
    console.error('Error deleting classroom:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete classroom' },
      { status: 500 }
    );
  }
}