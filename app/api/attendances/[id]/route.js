// app/api/attendances/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/attendances/[id] - Update attendance record
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, remarks, checkInTime, checkOutTime } = body;

    const existing = await prisma.attendance.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    const attendance = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: {
        status: status || existing.status,
        remarks: remarks !== undefined ? remarks : existing.remarks,
        checkInTime: checkInTime ? new Date(checkInTime) : existing.checkInTime,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : existing.checkOutTime,
      },
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update attendance' },
      { status: 500 }
    );
  }
}