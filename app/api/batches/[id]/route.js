// app/api/batches/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ==================== PERMISSION CHECKER ====================
async function checkBatchPermission(userId, action) {
  try {
    if (!userId) return false;
    
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) return false;

    const user = await prisma.user.findUnique({
      where: { id: userIdInt },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.role) return false;

    const adminRoles = ['SYSTEM_ADMIN', 'ADMIN', 'System Administrator', 'Administrator'];
    if (adminRoles.some(role => user.role.name.toLowerCase() === role.toLowerCase())) {
      return true;
    }

    const actionUpper = action.toUpperCase();
    const formats = [
      `${actionUpper}_BATCH`,
      `BATCH:${actionUpper}`,
      `${actionUpper}_BATCHS`,
      `batch_management:${actionUpper}`,
    ];

    return user.role.permissions.some(rp => 
      formats.some(f => (rp.permission.name || '').toUpperCase() === f)
    );
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

// ==================== ACTIVITY LOGGER ====================
async function logActivity(userId, action, module, details = {}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: parseInt(userId),
        action,
        module,
        details,
      },
    });
  } catch (error) {
    console.error('Activity log error:', error);
  }
}

// ==================== HELPER: Get user ID from session ====================
function getUserId(session) {
  return session?.user?.id || session?.user?.userId || null;
}

// ==================== GET SINGLE BATCH ====================
export async function GET(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const hasPermission = await checkBatchPermission(userId, 'READ');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // FIX: Await params before accessing
    const params = await context.params;
    const { id } = params;
    
    console.log('GET batch ID:', id); // Debug log
    
    const batchId = parseInt(id);
    if (isNaN(batchId)) {
      return NextResponse.json({ error: `Invalid batch ID: ${id}` }, { status: 400 });
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        _count: {
          select: {
            students: true,
            courseLists: true,
            departments: true,
          },
        },
        departments: {
          select: { id: true, name: true, code: true, status: true },
        },
        courseLists: {
          include: {
            course: {
              select: {
                id: true, name: true, code: true, credits: true, courseType: true,
              },
            },
          },
          orderBy: { semester: 'asc' },
        },
        students: {
          select: {
            id: true, name: true, email: true, enrollmentNo: true, rollNo: true, status: true,
          },
          take: 10,
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, batch });
  } catch (error) {
    console.error('GET /api/batches/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== UPDATE BATCH ====================
export async function PUT(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const hasPermission = await checkBatchPermission(userId, 'UPDATE');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // FIX: Await params before accessing
    const params = await context.params;
    const { id } = params;
    
    console.log('PUT batch ID:', id); // Debug log
    
    const batchId = parseInt(id);
    if (isNaN(batchId)) {
      return NextResponse.json({ error: `Invalid batch ID: ${id}` }, { status: 400 });
    }

    const body = await request.json();
    const { name, startDate, endDate, status, departmentIds } = body;

    // Check if batch exists
    const existingBatch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!existingBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Check duplicate name
    if (name && name.trim() !== existingBatch.name) {
      const duplicate = await prisma.batch.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          NOT: { id: batchId },
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'A batch with this name already exists' }, { status: 409 });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    
    if (status) {
      const validStatuses = ['active', 'inactive', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `Invalid status. Must be: ${validStatuses.join(', ')}` }, { status: 400 });
      }
      updateData.status = status;
    }

    // Date validation
    const finalStartDate = updateData.startDate || existingBatch.startDate;
    const finalEndDate = updateData.endDate || existingBatch.endDate;
    if (new Date(finalEndDate) <= new Date(finalStartDate)) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    // Department connections
    if (departmentIds !== undefined) {
      updateData.departments = {
        set: [],
        connect: departmentIds.map(id => ({ id: parseInt(id) })),
      };
    }

    const batch = await prisma.batch.update({
      where: { id: batchId },
      data: updateData,
      include: {
        _count: {
          select: { students: true, courseLists: true, departments: true },
        },
        departments: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await logActivity(userId, 'UPDATE', 'batch_management', {
      batchId: batch.id,
      batchName: batch.name,
      updates: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      message: 'Batch updated successfully',
      batch,
    });
  } catch (error) {
    console.error('PUT /api/batches/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== DELETE BATCH ====================
export async function DELETE(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const hasPermission = await checkBatchPermission(userId, 'DELETE');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // FIX: Await params before accessing
    const params = await context.params;
    const { id } = params;
    
    console.log('DELETE batch ID:', id); // Debug log
    
    const batchId = parseInt(id);
    if (isNaN(batchId)) {
      return NextResponse.json({ error: `Invalid batch ID: ${id}` }, { status: 400 });
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        _count: {
          select: { students: true, courseLists: true },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (batch._count.students > 0 || batch._count.courseLists > 0) {
      return NextResponse.json({
        error: 'Cannot delete batch with existing dependencies',
        details: {
          students: batch._count.students,
          courseLists: batch._count.courseLists,
          message: 'Remove all students and course lists before deleting',
        },
      }, { status: 409 });
    }

    await prisma.batch.delete({ where: { id: batchId } });

    await logActivity(userId, 'DELETE', 'batch_management', {
      batchId: batch.id,
      batchName: batch.name,
    });

    return NextResponse.json({
      success: true,
      message: 'Batch deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/batches/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== PATCH - UPDATE STATUS ====================
export async function PATCH(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const hasPermission = await checkBatchPermission(userId, 'UPDATE');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // FIX: Await params before accessing
    const params = await context.params;
    const { id } = params;
    
    console.log('PATCH batch ID:', id); // Debug log
    
    const batchId = parseInt(id);
    if (isNaN(batchId)) {
      return NextResponse.json({ error: `Invalid batch ID: ${id}` }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const validStatuses = ['active', 'inactive', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const batch = await prisma.batch.update({
      where: { id: batchId },
      data: { status },
      include: {
        _count: {
          select: { students: true, courseLists: true, departments: true },
        },
        departments: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Batch status updated successfully',
      batch,
    });
  } catch (error) {
    console.error('PATCH /api/batches/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}