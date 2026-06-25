// app/api/users/route.js

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const roleId = searchParams.get('roleId');
    const status = searchParams.get('status');

    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (roleId && roleId !== '') where.roleId = parseInt(roleId);
    if (status && status !== '') where.status = status;

    // Fetch users with correct relations based on your schema
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          // Use userDepartments instead of department
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
          // Include profiles if needed
          studentProfile: {
            select: {
              rollNumber: true,
              enrollmentNo: true,
              program: true,
            },
          },
          facultyProfile: {
            select: {
              employeeId: true,
              designation: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Transform the data to include department from userDepartments
    const transformedUsers = users.map((user) => {
      // Get the primary department or first department
      let department = null;
      if (user.userDepartments && user.userDepartments.length > 0) {
        const primaryDept = user.userDepartments.find((ud) => ud.isPrimary);
        department = primaryDept
          ? primaryDept.department
          : user.userDepartments[0].department;
      }

      // Remove userDepartments from the response
      const { userDepartments, ...userWithoutDepartments } = user;

      return {
        ...userWithoutDepartments,
        department,
      };
    });

    // Add avatar URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const usersWithAvatar = transformedUsers.map((user) => ({
      ...user,
      avatarUrl: user.avatar ? `${baseUrl}${user.avatar}` : null,
    }));

    return NextResponse.json({
      users: usersWithAvatar,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
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

    // Validate required fields
    if (!body.email || !body.password || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Prepare user data
    const userData = {
      email: body.email,
      password: hashedPassword,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone || null,
      status: body.status || 'ACTIVE',
      roleId: parseInt(body.roleId), // roleId is required in your schema
    };

    // Create user
    const user = await prisma.user.create({
      data: userData,
    });

    // Handle department assignment if provided
    if (body.departmentId && body.departmentId !== '') {
      await prisma.userDepartment.create({
        data: {
          userId: user.id,
          departmentId: parseInt(body.departmentId),
          isPrimary: true,
        },
      });
    }

    // Handle avatar upload
    const avatarFile = formData.get('avatar');
    if (avatarFile && avatarFile.size > 0) {
      try {
        const uploadDir = path.join(process.cwd(), 'public/uploads/avatars');
        await mkdir(uploadDir, { recursive: true });
        
        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const ext = path.extname(avatarFile.name);
        const filename = `user-${user.id}-${Date.now()}${ext}`;
        const filepath = path.join(uploadDir, filename);
        
        await writeFile(filepath, buffer);
        
        const avatarPath = `/uploads/avatars/${filename}`;
        await prisma.user.update({
          where: { id: user.id },
          data: { avatar: avatarPath },
        });
        
        user.avatar = avatarPath;
      } catch (uploadError) {
        console.error('Avatar upload failed:', uploadError);
      }
    }

    // Fetch user with relations
    const userWithRelations = await prisma.user.findUnique({
      where: { id: user.id },
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

    return NextResponse.json(
      {
        user: {
          ...userWithoutDepartments,
          department,
        },
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}