// app/api/exams/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    
    const where = {};
    if (batchId) where.batchId = parseInt(batchId);

    const exams = await prisma.exam.findMany({
      where,
      include: {
        examType: true,
        classroom: true,
        batch: true,
        department: true,
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ exams, success: true });
  } catch (error) {
    console.error('GET exams error:', error.message);
    return NextResponse.json({ exams: [], success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, examTypeId, batchId, departmentId, startDate, startTime, endTime, classroomId, status } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name required', success: false }, { status: 400 });
    }

    const data = {
      name: name.trim(),
      examTypeId: parseInt(examTypeId),
      status: status || 'scheduled',
    };

    if (batchId) data.batchId = parseInt(batchId);
    if (departmentId) data.departmentId = parseInt(departmentId);
    if (classroomId) data.classroomId = parseInt(classroomId);
    if (startDate) data.date = new Date(startDate);
    if (startTime) data.startTime = new Date(`1970-01-01T${startTime}:00`);
    if (endTime) data.endTime = new Date(`1970-01-01T${endTime}:00`);

    const exam = await prisma.exam.create({
      data,
      include: { examType: true, classroom: true, batch: true },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error('POST exam error:', error.message);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}