import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = parseInt(id);

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = parseInt(id);
    const body = await request.json();

    console.log('Updating course:', courseId, 'with data:', body); // Debug log

    // Remove fields that shouldn't be updated directly
    const { id: _, createdAt, updatedAt, department, ...updateData } = body;

    // Convert numeric fields
    if (updateData.credits !== undefined)
      updateData.credits = updateData.credits
        ? parseInt(updateData.credits)
        : null;
    if (updateData.lecture !== undefined)
      updateData.lecture = updateData.lecture
        ? parseInt(updateData.lecture)
        : null;
    if (updateData.tutorial !== undefined)
      updateData.tutorial = updateData.tutorial
        ? parseInt(updateData.tutorial)
        : null;
    if (updateData.practical !== undefined)
      updateData.practical = updateData.practical
        ? parseInt(updateData.practical)
        : null;
    if (updateData.departmentId !== undefined)
      updateData.departmentId = updateData.departmentId
        ? parseInt(updateData.departmentId)
        : null;

    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error updating course:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const courseId = parseInt(id);

    console.log('Deleting course:', courseId); // Debug log

    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting course:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}