// app/api/exam-types/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const examTypes = await prisma.examType.findMany({ 
      orderBy: { createdAt: 'desc' } 
    });
    return NextResponse.json({ examTypes, success: true });
  } catch (error) {
    console.error('GET error:', error.message);
    return NextResponse.json({ 
      examTypes: [], 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, code, weightage, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name required', success: false }, { status: 400 });
    }
    if (!code?.trim()) {
      return NextResponse.json({ error: 'Code required', success: false }, { status: 400 });
    }

    // Check for existing
    const existing = await prisma.examType.findFirst({ 
      where: { 
        OR: [
          { name: name.trim() }, 
          { code: code.trim().toUpperCase() }
        ] 
      } 
    });
    
    if (existing) {
      return NextResponse.json({ error: 'Already exists', success: false }, { status: 409 });
    }

    const examType = await prisma.examType.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        weightage: weightage ? parseFloat(weightage) : null,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(examType, { status: 201 });
  } catch (error) {
    console.error('POST error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Server error', success: false }, 
      { status: 500 }
    );
  }
}