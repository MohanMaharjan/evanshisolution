// src/app/api/profile/route.js

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id');

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        role: true,
        studentProfile: true,
        facultyProfile: true,
        counselorProfile: true,
        coordinatorProfile: true,
        librarianProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const userId = request.headers.get('x-user-id');
    const body = await request.json();

    const { firstName, lastName, phone, ...profileData } = body;

    // Update basic user info
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        firstName,
        lastName,
        phone,
      },
      include: {
        role: true,
        studentProfile: true,
        facultyProfile: true,
      },
    });

    // Update profile based on user level
    if (updatedUser.userLevel === 'STUDENT' && updatedUser.studentProfile) {
      await prisma.studentProfile.update({
        where: { userId