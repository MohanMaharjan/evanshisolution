// app/api/exams/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.exam.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}