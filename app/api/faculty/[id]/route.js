// app/api/faculty/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

// ==================== HELPERS ====================
async function uploadFile(file, folder, prefix = 'faculty') {
  if (!file || !(file instanceof File) || file.size === 0) return null;
  
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop();
    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'faculty', folder);
    
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
    
    return `/uploads/faculty/${folder}/${filename}`;
  } catch (error) {
    console.error(`Error uploading ${folder}:`, error);
    return null;
  }
}

async function deleteFile(filePath) {
  if (!filePath) return;
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await unlink(fullPath).catch(() => {});
  } catch (error) {
    console.warn('Failed to delete file:', filePath);
  }
}

// ==================== GET - Fetch single faculty ====================
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const facultyId = parseInt(id);

    if (isNaN(facultyId)) {
      return NextResponse.json({ error: 'Invalid faculty ID' }, { status: 400 });
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: {
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

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    const facultyWithName = {
      ...faculty,
      user: faculty.user ? {
        ...faculty.user,
        name: `${faculty.user.firstName || ''} ${faculty.user.lastName || ''}`.trim(),
      } : null,
    };

    return NextResponse.json({
      success: true,
      faculty: facultyWithName,
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== PUT - Update faculty ====================
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const fid = parseInt(id);

    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid faculty ID' }, { status: 400 });
    }

    const existing = await prisma.faculty.findUnique({
      where: { id: fid },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const email = formData.get('email')?.toLowerCase();
    const phone = formData.get('phone');
    const address = formData.get('address');
    const designation = formData.get('designation');
    const qualification = formData.get('qualification');
    const specialization = formData.get('specialization');
    const status = formData.get('status');
    const joinedDate = formData.get('joinedDate');
    const profilePicture = formData.get('profilePicture');
    const cv = formData.get('cv');

    // Check for duplicate email
    if (email && email !== existing.email) {
      const duplicate = await prisma.faculty.findFirst({
        where: { email, NOT: { id: fid } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Another faculty with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Check for duplicate phone
    if (phone && phone !== existing.phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const duplicate = await prisma.faculty.findFirst({
        where: { phone: cleanPhone, NOT: { id: fid } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Another faculty with this phone already exists' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone ? phone.replace(/\D/g, '') : null;
    if (address !== undefined) updateData.address = address || null;
    if (designation !== undefined) updateData.designation = designation || null;
    if (qualification !== undefined) updateData.qualification = qualification || null;
    if (specialization !== undefined) updateData.specialization = specialization || null;
    if (status) updateData.status = status;
    if (joinedDate) updateData.joinedDate = new Date(joinedDate);

    // Handle profile picture
    if (profilePicture && profilePicture instanceof File && profilePicture.size > 0) {
      if (existing.profilePicture) await deleteFile(existing.profilePicture);
      const photoPath = await uploadFile(profilePicture, 'photos');
      if (photoPath) updateData.profilePicture = photoPath;
    }

    // Handle CV
    if (cv && cv instanceof File && cv.size > 0) {
      if (existing.cv) await deleteFile(existing.cv);
      const cvPath = await uploadFile(cv, 'cv');
      if (cvPath) updateData.cv = cvPath;
    }

    // Update faculty
    const faculty = await prisma.faculty.update({
      where: { id: fid },
      data: updateData,
      include: {
        user: {
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

    // Update linked user
    if (existing.userId) {
      const userUpdate = {};
      
      if (name) {
        const nameParts = name.trim().split(' ');
        userUpdate.firstName = nameParts[0] || '';
        userUpdate.lastName = nameParts.slice(1).join(' ') || '';
      }
      
      if (email) userUpdate.email = email;
      if (phone !== undefined) userUpdate.phone = phone ? phone.replace(/\D/g, '') : null;
      if (updateData.profilePicture) userUpdate.avatar = updateData.profilePicture;

      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({
          where: { id: existing.userId },
          data: userUpdate,
        });
      }
    }

    const facultyWithName = {
      ...faculty,
      user: faculty.user ? {
        ...faculty.user,
        name: `${faculty.user.firstName || ''} ${faculty.user.lastName || ''}`.trim(),
      } : null,
    };

    return NextResponse.json({
      success: true,
      faculty: facultyWithName,
      message: 'Faculty updated successfully',
    });
  } catch (error) {
    console.error('Error updating faculty:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== DELETE - Delete faculty ====================
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const fid = parseInt(id);

    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid faculty ID' }, { status: 400 });
    }

    // Find faculty - REMOVED invalid relations
    const faculty = await prisma.faculty.findUnique({
      where: { id: fid },
      include: {
        user: true,
        userDepartment: true,
      },
    });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    // Delete files and records in transaction
    await prisma.$transaction(async (tx) => {
      // Delete faculty record
      await tx.faculty.delete({ where: { id: fid } });

      // Delete associated user if exists
      if (faculty.userId) {
        await tx.user.delete({ where: { id: faculty.userId } });
      }
    });

    // Clean up files after successful DB deletion
    if (faculty.profilePicture) {
      await deleteFile(faculty.profilePicture);
    }
    if (faculty.cv) {
      await deleteFile(faculty.cv);
    }

    return NextResponse.json({
      success: true,
      message: 'Faculty and associated user deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting faculty:', error);
    
    if (error.code === 'P2003' || error.code === 'P2014') {
      return NextResponse.json(
        { error: 'Cannot delete faculty with existing relations. Remove all dependencies first.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}