// app/api/calendar-events/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');
    const semester = searchParams.get('semester');
    const type = searchParams.get('type');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const where = {};

    if (classroomId) {
      where.classroomId = parseInt(classroomId);
    }

    if (semester && semester !== 'all') {
      where.OR = [
        { semester: semester },
        { semester: 'all' },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate);
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      type = 'event',
      date,
      startTime,
      endTime,
      isRecurring = false,
      recurringDays = [],
      semester = 'all',
      classroomId,
    } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: 'Title and date are required' },
        { status: 400 }
      );
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description: description || '',
        type,
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        isRecurring,
        recurringDays: recurringDays || [],
        semester,
        classroomId: classroomId ? parseInt(classroomId) : null,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}