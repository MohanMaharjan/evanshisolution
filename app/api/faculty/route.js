// app/api/faculty/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// ==================== HELPERS ====================
async function uploadFile(file, folder) {
  if (!file || !(file instanceof File) || file.size === 0) return null;
  
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop();
    const filename = `${folder}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'faculty', folder);
    
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
    
    return `/uploads/faculty/${folder}/${filename}`;
  } catch (error) {
    console.error(`Error uploading ${folder}:`, error);
    return null;
  }
}

// ==================== GET - Fetch all faculty ====================
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const designation = searchParams.get('designation') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (designation && designation !== 'all') {
      where.designation = designation;
    }

    // Validate sort field
    const allowedSortFields = ['name', 'email', 'designation', 'joinedDate', 'createdAt', 'status'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const orderBy = { [validSortBy]: sortOrder };

    // Get faculty with user relation - FIXED: Use firstName and lastName
    const [facultyList, total] = await Promise.all([
      prisma.faculty.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,   // Changed from 'name'
              lastName: true,    // Changed from 'name'
              email: true,
              avatar: true,      // Changed from 'profilePicture'
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.faculty.count({ where }),
    ]);

    // Transform faculty to include full name for convenience
    const faculty = facultyList.map((f) => ({
      ...f,
      user: f.user ? {
        ...f.user,
        name: `${f.user.firstName || ''} ${f.user.lastName || ''}`.trim(),
      } : null,
    }));

    return NextResponse.json({
      success: true,
      faculty,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ==================== POST - Create faculty ====================
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const email = formData.get('email')?.toLowerCase();
    const phone = formData.get('phone');
    const address = formData.get('address');
    const joinedDate = formData.get('joinedDate');
    const designation = formData.get('designation');
    const qualification = formData.get('qualification');
    const specialization = formData.get('specialization');
    const status = formData.get('status') || 'active';
    const profilePicture = formData.get('profilePicture');
    const cv = formData.get('cv');

    // Validation
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Check for duplicates
    const existing = await prisma.faculty.findFirst({
      where: { OR: [{ email }, { phone: cleanPhone }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Faculty with this email or phone already exists' },
        { status: 409 }
      );
    }

    // Find FACULTY role
    const facultyRole = await prisma.role.findFirst({
      where: { name: { in: ['FACULTY', 'Faculty', 'faculty'] } },
    });

    if (!facultyRole) {
      return NextResponse.json(
        { error: 'FACULTY role not found. Please create it first.' },
        { status: 500 }
      );
    }

    // Hash password (use phone as default password)
    const hashedPassword = await bcrypt.hash(cleanPhone, 12);

    // Upload files
    const profilePicturePath = await uploadFile(profilePicture, 'photos');
    const cvPath = await uploadFile(cv, 'cv');

    // Split name into firstName and lastName for User model
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create user and faculty in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          firstName,           // User model uses firstName
          lastName,            // User model uses lastName
          email,
          phone: cleanPhone,
          password: hashedPassword,
          roleId: facultyRole.id,
          status: 'ACTIVE',    // User model uses ACTIVE/INACTIVE/SUSPENDED
          mustChangePassword: true,
          avatar: profilePicturePath,  // User model uses avatar
        },
      });

      // Create faculty
      const faculty = await tx.faculty.create({
        data: {
          name,                // Faculty model has name field
          email,
          phone: cleanPhone,
          address: address || null,
          joinedDate: joinedDate ? new Date(joinedDate) : new Date(),
          designation: designation || null,
          qualification: qualification || null,
          specialization: specialization || null,
          status,
          cv: cvPath,
          profilePicture: profilePicturePath,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return faculty;
    });

    // Add computed name for response
    const facultyWithName = {
      ...result,
      user: result.user ? {
        ...result.user,
        name: `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim(),
      } : null,
    };

    return NextResponse.json(
      {
        success: true,
        faculty: facultyWithName,
        message: `Faculty created successfully. Default password: ${cleanPhone}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating faculty:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}