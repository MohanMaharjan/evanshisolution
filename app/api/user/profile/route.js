// src/app/api/user/profile/route.js

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Simple ID generator
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const formData = await request.formData();
    
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const avatar = formData.get('avatar');

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return Response.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check email uniqueness
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.trim(),
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      return Response.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Handle avatar upload
    let avatarUrl = undefined;
    
    if (avatar && typeof avatar !== 'string' && avatar.size > 0) {
      try {
        const bytes = await avatar.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = avatar.name || 'avatar.jpg';
        const ext = filename.split('.').pop() || 'jpg';
        const uniqueName = `avatar-${generateId()}.${ext}`;
        
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars');
        await mkdir(uploadDir, { recursive: true });
        
        const filePath = join(uploadDir, uniqueName);
        await writeFile(filePath, buffer);
        
        avatarUrl = `/uploads/avatars/${uniqueName}`;
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
      }
    }

    // Prepare update data
    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    };

    // Only update avatar if a new one was uploaded
    if (avatarUrl) {
      updateData.avatar = avatarUrl;
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: 'PROFILE_UPDATE',
        module: 'PROFILE',
        details: { updatedFields: Object.keys(updateData) },
      },
    });

    return Response.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return Response.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}