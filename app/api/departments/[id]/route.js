// src/app/api/departments/[id]/route.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// PATCH - Update department status
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const departmentId = parseInt(id);

    if (isNaN(departmentId)) {
      return NextResponse.json(
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['active', 'inactive', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: active, inactive, or archived' },
        { status: 400 }
      );
    }

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Update status
    const department = await prisma.department.update({
      where: { id: departmentId },
      data: { status },
      include: {
        _count: {
          select: {
            userDepartments: true,
            courses: true,
            studentProfiles: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Department status updated successfully',
      department: {
        id: department.id,
        name: department.name,
        code: department.code,
        status: department.status,
        _count: {
          users: department._count?.userDepartments || 0,
          courses: department._count?.courses || 0,
          preadmissions: department._count?.studentProfiles || 0,
        },
      },
    });

  } catch (error) {
    console.error('Update department status error:', error);
    return NextResponse.json(
      { error: 'Failed to update department status: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT - Update full department
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const departmentId = parseInt(id);

    if (isNaN(departmentId)) {
      return NextResponse.json(
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      code, 
      description, 
      status, 
      headOfDepartmentId 
    } = body;

    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check for duplicates
    if (name || code) {
      const duplicate = await prisma.department.findFirst({
        where: {
          OR: [
            name ? { name: { equals: name.trim(), mode: 'insensitive' } } : {},
            code ? { code: { equals: code.toUpperCase().trim() } } : {},
          ],
          NOT: { id: departmentId },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { 
            error: `Department with ${duplicate.name === name?.trim() ? 'name' : 'code'} "${duplicate.name === name?.trim() ? duplicate.name : duplicate.code}" already exists` 
          },
          { status: 400 }
        );
      }
    }

    // Update department
    const department = await prisma.department.update({
      where: { id: departmentId },
      data: {
        name: name?.trim() || existingDepartment.name,
        code: code?.toUpperCase().trim() || existingDepartment.code,
        description: description !== undefined ? description : existingDepartment.description,
        status: status || existingDepartment.status,
        headId: headOfDepartmentId !== undefined 
          ? (headOfDepartmentId ? parseInt(headOfDepartmentId) : null)
          : existingDepartment.headId,
      },
      include: {
        _count: {
          select: {
            userDepartments: true,
            courses: true,
            studentProfiles: true,
          },
        },
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Department updated successfully',
      department: {
        ...department,
        _count: {
          users: department._count?.userDepartments || 0,
          courses: department._count?.courses || 0,
          preadmissions: department._count?.studentProfiles || 0,
        },
        headOfDepartment: department.head ? {
          ...department.head,
          name: `${department.head.firstName || ''} ${department.head.lastName || ''}`.trim(),
        } : null,
      },
    });

  } catch (error) {
    console.error('Update department error:', error);
    return NextResponse.json(
      { error: 'Failed to update department: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a department
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const departmentId = parseInt(id);

    if (isNaN(departmentId)) {
      return NextResponse.json(
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            userDepartments: true,
            courses: true,
            studentProfiles: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check for dependencies
    if (department._count.userDepartments > 0 || 
        department._count.courses > 0 || 
        department._count.studentProfiles > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete department with dependencies',
          details: {
            users: department._count.userDepartments,
            courses: department._count.courses,
            students: department._count.studentProfiles,
          },
        },
        { status: 409 }
      );
    }

    await prisma.department.delete({
      where: { id: departmentId },
    });

    return NextResponse.json({
      message: 'Department deleted successfully',
    });

  } catch (error) {
    console.error('Delete department error:', error);
    return NextResponse.json(
      { error: 'Failed to delete department: ' + error.message },
      { status: 500 }
    );
  }
}

// GET - Fetch a single department
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const departmentId = parseInt(id);

    if (isNaN(departmentId)) {
      return NextResponse.json(
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            userDepartments: true,
            courses: true,
            studentProfiles: true,
          },
        },
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      department: {
        ...department,
        _count: {
          users: department._count?.userDepartments || 0,
          courses: department._count?.courses || 0,
          preadmissions: department._count?.studentProfiles || 0,
        },
        headOfDepartment: department.head ? {
          ...department.head,
          name: `${department.head.firstName || ''} ${department.head.lastName || ''}`.trim(),
        } : null,
      },
    });

  } catch (error) {
    console.error('Fetch department error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department: ' + error.message },
      { status: 500 }
    );
  }
}