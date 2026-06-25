import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: { id: true, name: true },
        },
        userDepartments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        studentProfile: true,
        facultyProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Transform to include department
    let department = null;
    if (user.userDepartments && user.userDepartments.length > 0) {
      const primaryDept = user.userDepartments.find((ud) => ud.isPrimary);
      department = primaryDept
        ? primaryDept.department
        : user.userDepartments[0].department;
    }

    const { userDepartments, ...userWithoutDepartments } = user;

    return NextResponse.json({
      user: {
        ...userWithoutDepartments,
        department,
      },
    });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const body = {};
    
    for (const [key, value] of formData.entries()) {
      if (key === 'avatar') {
        body.avatar = value; // File object
      } else {
        body[key] = value;
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone || null,
      status: body.status || 'ACTIVE',
    };

    // roleId is required, so always update it
    if (body.roleId && body.roleId !== '') {
      updateData.roleId = parseInt(body.roleId);
    }

    if (body.password && body.password.length > 0) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    // Handle avatar upload
    const avatarFile = formData.get('avatar');
    const removeAvatar = body.removeAvatar === 'true';

    if (removeAvatar) {
      // Remove avatar
      if (existingUser.avatar) {
        const oldPath = path.join(process.cwd(), 'public', existingUser.avatar);
        try {
          await unlink(oldPath);
        } catch (e) {
          console.log('Old avatar not found');
        }
      }
      updateData.avatar = null;
    } else if (avatarFile && avatarFile.size > 0) {
      // Upload new avatar
      try {
        // Delete old avatar
        if (existingUser.avatar) {
          const oldPath = path.join(process.cwd(), 'public', existingUser.avatar);
          try {
            await unlink(oldPath);
          } catch (e) {
            console.log('Old avatar not found');
          }
        }

        const uploadDir = path.join(process.cwd(), 'public/uploads/avatars');
        await mkdir(uploadDir, { recursive: true });
        
        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = path.extname(avatarFile.name);
        const filename = `user-${userId}-${Date.now()}${ext}`;
        const filepath = path.join(uploadDir, filename);
        
        await writeFile(filepath, buffer);
        
        updateData.avatar = `/uploads/avatars/${filename}`;
      } catch (uploadError) {
        console.error('Avatar upload failed:', uploadError);
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Handle department assignment
    if (body.departmentId !== undefined) {
      // Remove existing department assignments
      await prisma.userDepartment.deleteMany({
        where: { userId },
      });

      // Add new department if provided
      if (body.departmentId && body.departmentId !== '' && body.departmentId !== 'null') {
        await prisma.userDepartment.create({
          data: {
            userId,
            departmentId: parseInt(body.departmentId),
            isPrimary: true,
          },
        });
      }
    }

    // Fetch user with relations
    const userWithRelations = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: { id: true, name: true },
        },
        userDepartments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform to include department
    let department = null;
    if (userWithRelations?.userDepartments?.length > 0) {
      const primaryDept = userWithRelations.userDepartments.find((ud) => ud.isPrimary);
      department = primaryDept
        ? primaryDept.department
        : userWithRelations.userDepartments[0].department;
    }

    const { userDepartments, ...userWithoutDepartments } = userWithRelations || {};

    return NextResponse.json({
      user: {
        ...userWithoutDepartments,
        department,
      },
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Failed to update user:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Get user to delete avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete avatar file
    if (user.avatar) {
      const avatarPath = path.join(process.cwd(), 'public', user.avatar);
      try {
        await unlink(avatarPath);
      } catch (e) {
        console.log('Avatar not found');
      }
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}