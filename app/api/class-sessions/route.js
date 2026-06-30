// app/api/class-sessions/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/class-sessions - Fetch class sessions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');
    const date = searchParams.get('date');
    const facultyId = searchParams.get('facultyId');

    const where = {};

    if (classroomId) {
      where.classroomId = parseInt(classroomId);
    }

    // Fix date filtering - compare date strings instead of exact match
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
      where.date = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }

    if (facultyId) {
      where.facultyId = parseInt(facultyId);
    }

    const classSessions = await prisma.classSession.findMany({
      where,
      include: {
        attendances: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                rollNo: true,
              },
            },
          },
        },
        classroom: {
          select: {
            id: true,
            name: true,
            code: true,
            course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        faculty: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ classSessions });
  } catch (error) {
    console.error('Error fetching class sessions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch class sessions' },
      { status: 500 }
    );
  }
}

// POST /api/class-sessions - Create a class session
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      date,
      startTime,
      endTime,
      classroomId,
      facultyId,
      sessionType = 'regular',
      attendances = [],
    } = body;

    if (!title || !classroomId) {
      return NextResponse.json(
        { error: 'Title and classroomId are required' },
        { status: 400 }
      );
    }

    const classSession = await prisma.classSession.create({
      data: {
        title,
        date: date ? new Date(date) : new Date(),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        sessionType,
        classroomId: parseInt(classroomId),
        facultyId: facultyId ? parseInt(facultyId) : null,
        attendances: {
          create: attendances.map((att) => ({
            studentId: parseInt(att.studentId),
            status: att.status || 'present',
            remarks: att.remarks || '',
            classroomId: parseInt(classroomId),
          })),
        },
      },
      include: {
        attendances: true,
      },
    });

    return NextResponse.json({ classSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating class session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create class session' },
      { status: 500 }
    );
  }
}