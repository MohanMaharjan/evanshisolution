// src/app/api/auth/change-password/route.js

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json(
        { error: 'Please log in to change your password' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return Response.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return Response.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return Response.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'PASSWORD_CHANGE',
        module: 'PROFILE',
        details: { timestamp: new Date().toISOString() },
      },
    });

    return Response.json({ 
      message: 'Password changed successfully' 
    });

  } catch (error) {
    console.error('Password change error:', error);
    return Response.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}