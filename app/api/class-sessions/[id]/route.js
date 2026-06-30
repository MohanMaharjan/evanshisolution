// app/api/class-sessions/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to get ID from params (handles both Promise and direct object)
async function getId(params) {
  const resolved = await params;
  return parseInt(resolved.id);
}

// GET /api/class-sessions/[id] - Get single class session
export async function GET(request, context) {
  try {
    const id = await getId(context.params);

    const classSession = await prisma.classSession.findUnique({
      where: { id },
      include: {
        attendances: {
          include: {
            student: {
              select: { id: true, name: true, rollNo: true },
            },
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            code: true,
            course: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        faculty: {
          select: { id: true, name: true },
        },
      },
    });

    if (!classSession) {
      return NextResponse.json({ error: 'Class session not found' }, { status: 404 });
    }

    return NextResponse.json({ classSession });
  } catch (error) {
    console.error('Error fetching class session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch class session' },
      { status: 500 }
    );
  }
}

// PUT /api/class-sessions/[id] - Update class session
export async function PUT(request, context) {
  try {
    const id = await getId(context.params);
    const body = await request.json();
    const {
      title,
      date,
      startTime,
      endTime,
      syllabusCovered,
      notes,
      materialUrl,
      sessionType,
      facultyId,
      attendances,
    } = body;

    // Check if session exists
    const existing = await prisma.classSession.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Class session not found' }, { status: 404 });
    }

    // Update the session
    await prisma.classSession.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existing.title,
        date: date ? new Date(date) : existing.date,
        startTime: startTime ? new Date(startTime) : existing.startTime,
        endTime: endTime ? new Date(endTime) : existing.endTime,
        syllabusCovered: syllabusCovered !== undefined ? syllabusCovered : existing.syllabusCovered,
        notes: notes !== undefined ? notes : existing.notes,
        materialUrl: materialUrl !== undefined ? materialUrl : existing.materialUrl,
        sessionType: sessionType || existing.sessionType,
        facultyId: facultyId !== undefined ? (facultyId ? parseInt(facultyId) : null) : existing.facultyId,
      },
    });

    // Handle attendances if provided
    if (attendances && Array.isArray(attendances)) {
      await prisma.attendance.deleteMany({ where: { classSessionId: id } });

      if (attendances.length > 0) {
        await prisma.attendance.createMany({
          data: attendances.map((att) => ({
            studentId: parseInt(att.studentId),
            status: att.status || 'present',
            remarks: att.remarks || '',
            classSessionId: id,
            classroomId: existing.classroomId,
          })),
        });
      }
    }

    // Fetch the updated session
    const classSession = await prisma.classSession.findUnique({
      where: { id },
      include: {
        attendances: {
          include: {
            student: {
              select: { id: true, name: true, rollNo: true },
            },
          },
        },
        classroom: {
          select: { id: true, name: true, code: true },
        },
        faculty: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ classSession });
  } catch (error) {
    console.error('Error updating class session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update class session' },
      { status: 500 }
    );
  }
}

// PATCH /api/class-sessions/[id] - Partial update
export async function PATCH(request, context) {
  try {
    const id = await getId(context.params);
    const body = await request.json();

    const existing = await prisma.classSession.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Class session not found' }, { status: 404 });
    }

    const classSession = await prisma.classSession.update({
      where: { id },
      data: body,
      include: {
        attendances: {
          include: {
            student: {
              select: { id: true, name: true, rollNo: true },
            },
          },
        },
        classroom: {
          select: { id: true, name: true, code: true },
        },
        faculty: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ classSession });
  } catch (error) {
    console.error('Error updating class session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update class session' },
      { status: 500 }
    );
  }
}

// DELETE /api/class-sessions/[id] - Delete class session
export async function DELETE(request, context) {
  try {
    const id = await getId(context.params);

    const existing = await prisma.classSession.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Class session not found' }, { status: 404 });
    }

    // Delete attendances first
    await prisma.attendance.deleteMany({ where: { classSessionId: id } });

    // Delete the session
    await prisma.classSession.delete({ where: { id } });

    return NextResponse.json({ message: 'Class session deleted successfully' });
  } catch (error) {
    console.error('Error deleting class session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete class session' },
      { status: 500 }
    );
  }
}