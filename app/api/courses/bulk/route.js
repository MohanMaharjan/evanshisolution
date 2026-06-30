// app/api/courses/bulk/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courses, isCourseImport } = body;

    if (!courses || !Array.isArray(courses) || courses.length === 0) {
      return NextResponse.json(
        { error: 'No courses provided' },
        { status: 400 }
      );
    }

    console.log(`📚 Bulk importing ${courses.length} courses`);

    const results = [];
    const errors = [];

    // Process each course
    for (const [index, courseData] of courses.entries()) {
      try {
        const {
          name,
          code,
          credits,
          description,
          lecture,
          tutorial,
          practical,
          noncredit,
          courseType,
          semester,
          syllabus,
          departmentId,
        } = courseData;

        // Validate required fields
        if (!name || !code) {
          errors.push(`Row ${index + 1}: Name and code are required`);
          continue;
        }

        // Check if course code already exists
        const existingCourse = await prisma.course.findUnique({
          where: { code: code },
        });

        if (existingCourse) {
          errors.push(`Row ${index + 1}: Course code "${code}" already exists`);
          continue;
        }

        // Create the course
        const createData = {
          name,
          code,
          credits: credits ? parseInt(credits) : null,
          description: description || null,
          lecture: lecture ? parseInt(lecture) : null,
          tutorial: tutorial ? parseInt(tutorial) : null,
          practical: practical ? parseInt(practical) : null,
          noncredit: noncredit || false,
          courseType: courseType || 'core',
          semester: semester || 'semester1',
          syllabus: syllabus || null,
        };

        if (departmentId) {
          createData.departmentId = parseInt(departmentId);
        }

        const course = await prisma.course.create({
          data: createData,
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        results.push(course);
      } catch (error) {
        console.error(`Error creating course at row ${index + 1}:`, error);
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${results.length} courses`,
      imported: results.length,
      failed: errors.length,
      courses: results,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in bulk import:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}