// app/api/classrooms/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/classrooms - Fetch all classrooms with optional filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const status = searchParams.get('status');
    const include = searchParams.get('include')?.split(',') || [];

    const where = {};
    if (batchId) where.batchId = parseInt(batchId);
    if (status) where.status = status;

    const includeObj = {
      batch: include.includes('batch') ? {
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
      } : false,
      course: include.includes('course') ? {
        select: {
          id: true,
          name: true,
          code: true,
        },
      } : false,
      department: include.includes('department') ? {
        select: {
          id: true,
          name: true,
          code: true,
        },
      } : false,
      faculty: include.includes('faculty') ? {
        select: {
          id: true,
          name: true,
          email: true,
        },
      } : false,
    };

    const classrooms = await prisma.classroom.findMany({
      where,
      include: includeObj,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ classrooms });
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch classrooms' },
      { status: 500 }
    );
  }
}

// POST /api/classrooms - Create a new classroom
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      capacity,
      status = 'inactive',
      semester = 'semester1',
      batchId,
      departmentId,
      courseId,
      facultyId,
    } = body;

    // Validate required fields
    if (!name || !batchId) {
      return NextResponse.json(
        { error: 'Name and batchId are required' },
        { status: 400 }
      );
    }

    // Check if batch exists
    const batch = await prisma.batch.findUnique({
      where: { id: parseInt(batchId) },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check for duplicate code
    if (code) {
      const existing = await prisma.classroom.findFirst({
        where: { code },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Classroom with this code already exists' },
          { status: 409 }
        );
      }
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        code,
        capacity: capacity ? parseInt(capacity) : null,
        status,
        semester,
        batchId: parseInt(batchId),
        departmentId: departmentId ? parseInt(departmentId) : null,
        courseId: courseId ? parseInt(courseId) : null,
        facultyId: facultyId ? parseInt(facultyId) : null,
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

    return NextResponse.json({ classroom }, { status: 201 });
  } catch (error) {
    console.error('Error creating classroom:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create classroom' },
      { status: 500 }
    );
  }
}