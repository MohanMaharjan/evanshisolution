// app/api/batches/route.js
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

    // Admin roles get full access
    const adminRoles = ['SYSTEM_ADMIN', 'ADMIN', 'System Administrator', 'Administrator'];
    if (adminRoles.some(role => user.role.name.toLowerCase() === role.toLowerCase())) {
      return true;
    }

    // Check multiple permission formats
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

// ==================== GET ALL BATCHES ====================
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
    }

    const userId = session.user.id || session.user.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session - No user ID' }, { status: 401 });
    }

    // Check permission
    const hasPermission = await checkBatchPermission(userId, 'READ');
    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'Access denied - Insufficient permissions',
        required: 'READ_BATCH'
      }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const departmentId = searchParams.get('departmentId') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    // Build where clause
    const where = {};
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    
    if (status !== 'all') {
      where.status = status;
    }
    
    if (departmentId !== 'all') {
      where.departments = {
        some: { id: parseInt(departmentId) },
      };
    }

    // Get total count
    const total = await prisma.batch.count({ where });

    // Get batches
    const batches = await prisma.batch.findMany({
      where,
      include: {
        _count: {
          select: {
            students: true,
            courseLists: true,
            departments: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      batches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('GET /api/batches error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== CREATE BATCH ====================
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
    }

    const userId = session.user.id || session.user.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session - No user ID' }, { status: 401 });
    }

    // Check permission
    const hasPermission = await checkBatchPermission(userId, 'CREATE');
    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'Access denied - Insufficient permissions',
        required: 'CREATE_BATCH'
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, startDate, endDate, status = 'active', departmentIds = [] } = body;

    // Validation
    const errors = [];
    if (!name?.trim()) errors.push('Batch name is required');
    if (!startDate) errors.push('Start date is required');
    if (!endDate) errors.push('End date is required');
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      errors.push('End date must be after start date');
    }
    
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 });
    }

    // Check for duplicate name
    const existingBatch = await prisma.batch.findUnique({
      where: { name: name.trim() },
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: 'A batch with this name already exists' },
        { status: 409 }
      );
    }

    // Validate departments if provided
    if (departmentIds.length > 0) {
      const departments = await prisma.department.findMany({
        where: { id: { in: departmentIds.map(id => parseInt(id)) } },
      });

      if (departments.length !== departmentIds.length) {
        return NextResponse.json(
          { error: 'One or more departments not found' },
          { status: 400 }
        );
      }
    }

    // Create batch
    const batch = await prisma.batch.create({
      data: {
        name: name.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
        departments: {
          connect: departmentIds.map(id => ({ id: parseInt(id) })),
        },
      },
      include: {
        _count: {
          select: {
            students: true,
            courseLists: true,
            departments: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Log activity
    await logActivity(userId, 'CREATE', 'batch_management', {
      batchId: batch.id,
      batchName: batch.name,
    });

    return NextResponse.json({
      success: true,
      message: 'Batch created successfully',
      batch,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/batches error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}