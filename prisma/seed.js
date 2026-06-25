// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma client with the adapter
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Starting seeding...');

  // Clean existing data (order matters due to foreign keys)
  await prisma.activityLog.deleteMany();
  await prisma.userDepartment.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.facultyProfile.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.department.deleteMany();

  console.log('✓ Cleaned existing data');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ==========================================
  // Create Permissions
  // ==========================================
  const permissions = await Promise.all([
    // User Management
    prisma.permission.create({
      data: {
        name: 'CREATE_USER',
        description: 'Can create new users',
        module: 'USER_MANAGEMENT',
        action: 'CREATE',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'READ_USER',
        description: 'Can view users',
        module: 'USER_MANAGEMENT',
        action: 'READ',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'UPDATE_USER',
        description: 'Can update users',
        module: 'USER_MANAGEMENT',
        action: 'UPDATE',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'DELETE_USER',
        description: 'Can delete users',
        module: 'USER_MANAGEMENT',
        action: 'DELETE',
      },
    }),
    // Student Management
    prisma.permission.create({
      data: {
        name: 'CREATE_STUDENT',
        description: 'Can create student profiles',
        module: 'STUDENT_MANAGEMENT',
        action: 'CREATE',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'READ_STUDENT',
        description: 'Can view student profiles',
        module: 'STUDENT_MANAGEMENT',
        action: 'READ',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'UPDATE_STUDENT',
        description: 'Can update student profiles',
        module: 'STUDENT_MANAGEMENT',
        action: 'UPDATE',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'DELETE_STUDENT',
        description: 'Can delete student profiles',
        module: 'STUDENT_MANAGEMENT',
        action: 'DELETE',
      },
    }),
    // Department Management
    prisma.permission.create({
      data: {
        name: 'CREATE_DEPARTMENT',
        description: 'Can create departments',
        module: 'DEPARTMENT_MANAGEMENT',
        action: 'CREATE',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'READ_DEPARTMENT',
        description: 'Can view departments',
        module: 'DEPARTMENT_MANAGEMENT',
        action: 'READ',
      },
    }),
    // Role Management
    prisma.permission.create({
      data: {
        name: 'MANAGE_ROLES',
        description: 'Can manage roles and permissions',
        module: 'ROLE_MANAGEMENT',
        action: 'UPDATE',
      },
    }),
  ]);

  console.log('✓ Created permissions');

  // ==========================================
  // Create Roles
  // ==========================================
  const systemAdminRole = await prisma.role.create({
    data: {
      name: 'System Administrator',
      description: 'Full system access',
      userLevel: 'SYSTEM_ADMIN',
    },
  });

  const adminRole = await prisma.role.create({
    data: {
      name: 'Administrator',
      description: 'Administrative access',
      userLevel: 'ADMIN',
    },
  });

  const coordinatorRole = await prisma.role.create({
    data: {
      name: 'Coordinator',
      description: 'Department coordinator',
      userLevel: 'COORDINATOR',
    },
  });

  const facultyRole = await prisma.role.create({
    data: {
      name: 'Faculty',
      description: 'Faculty member',
      userLevel: 'FACULTY',
    },
  });

  const studentRole = await prisma.role.create({
    data: {
      name: 'Student',
      description: 'Student user',
      userLevel: 'STUDENT',
    },
  });

  console.log('✓ Created roles');

  // ==========================================
  // Assign Permissions to Roles
  // ==========================================
  
  // System Admin - All permissions
  for (const permission of permissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: systemAdminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Admin - Most permissions (except MANAGE_ROLES)
  const adminPermissions = permissions.filter(p => p.name !== 'MANAGE_ROLES');
  for (const permission of adminPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Coordinator - Limited permissions
  const coordinatorPermissions = permissions.filter(p => 
    ['READ_USER', 'CREATE_STUDENT', 'READ_STUDENT', 'UPDATE_STUDENT', 
     'READ_DEPARTMENT', 'CREATE_DEPARTMENT'].includes(p.name)
  );
  for (const permission of coordinatorPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: coordinatorRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Faculty - Read only permissions
  const facultyPermissions = permissions.filter(p => 
    ['READ_STUDENT', 'READ_DEPARTMENT', 'READ_USER'].includes(p.name)
  );
  for (const permission of facultyPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: facultyRole.id,
        permissionId: permission.id,
      },
    });
  }

  // Student - Minimal permissions
  const studentPermissions = permissions.filter(p => 
    ['READ_STUDENT', 'READ_DEPARTMENT'].includes(p.name)
  );
  for (const permission of studentPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: studentRole.id,
        permissionId: permission.id,
      },
    });
  }

  console.log('✓ Assigned permissions to roles');

  // ==========================================
  // Create Departments
  // ==========================================
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Computer Science and Engineering',
        code: 'CSE',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Electrical Engineering',
        code: 'EE',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Mechanical Engineering',
        code: 'ME',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Civil Engineering',
        code: 'CE',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Business Administration',
        code: 'BBA',
      },
    }),
  ]);

  console.log('✓ Created departments');

  // ==========================================
  // Create Users
  // ==========================================
  
  // System Admin
  const systemAdmin = await prisma.user.create({
    data: {
      email: 'admin@evanshisolution.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      phone: '+1234567890',
      userLevel: 'SYSTEM_ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
      roleId: systemAdminRole.id,
    },
  });

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: 'director@evanshisolution.com',
      password: hashedPassword,
      firstName: 'Director',
      lastName: 'Admin',
      phone: '+1234567891',
      userLevel: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
      roleId: adminRole.id,
    },
  });

  // Coordinator
  const coordinator = await prisma.user.create({
    data: {
      email: 'coordinator@evanshisolution.com',
      password: hashedPassword,
      firstName: 'Department',
      lastName: 'Coordinator',
      phone: '+1234567892',
      userLevel: 'COORDINATOR',
      status: 'ACTIVE',
      emailVerified: new Date(),
      roleId: coordinatorRole.id,
    },
  });

  // Faculty Users
  const faculty1 = await prisma.user.create({
    data: {
      email: 'john.faculty@evanshisolution.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1234567893',
      userLevel: 'FACULTY',
      status: 'ACTIVE',
      emailVerified: new Date(),
      roleId: facultyRole.id,
    },
  });

  const faculty2 = await prisma.user.create({
    data: {
      email: 'jane.faculty@evanshisolution.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+1234567894',
      userLevel: 'FACULTY',
      status: 'ACTIVE',
      emailVerified: new Date(),
      roleId: facultyRole.id,
    },
  });

  // Student Users
  const student1 = await prisma.user.create({
    data: {
      email: 'alice.student@evanshisolution.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '+1234567895',
      userLevel: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: new Date(),
      roleId: studentRole.id,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'bob.student@evanshisolution.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Williams',
      phone: '+1234567896',
      userLevel: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: new Date(),
      roleId: studentRole.id,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'charlie.student@evanshisolution.com',
      password: hashedPassword,
      firstName: 'Charlie',
      lastName: 'Brown',
      phone: '+1234567897',
      userLevel: 'STUDENT',
      status: 'ACTIVE',
      emailVerified: new Date(),
      roleId: studentRole.id,
    },
  });

  console.log('✓ Created users');

  // ==========================================
  // Assign Users to Departments (Faculty/Staff)
  // ==========================================
  
  // Coordinator assigned to CSE department
  await prisma.userDepartment.create({
    data: {
      userId: coordinator.id,
      departmentId: departments[0].id,
      isPrimary: true,
      assignedBy: systemAdmin.id,
    },
  });

  // Faculty1 assigned to CSE and EE
  await prisma.userDepartment.create({
    data: {
      userId: faculty1.id,
      departmentId: departments[0].id,
      isPrimary: true,
      assignedBy: admin.id,
    },
  });

  await prisma.userDepartment.create({
    data: {
      userId: faculty1.id,
      departmentId: departments[1].id,
      isPrimary: false,
      assignedBy: admin.id,
    },
  });

  // Faculty2 assigned to ME
  await prisma.userDepartment.create({
    data: {
      userId: faculty2.id,
      departmentId: departments[2].id,
      isPrimary: true,
      assignedBy: admin.id,
    },
  });

  console.log('✓ Assigned users to departments');

  // ==========================================
  // Create Student Profiles
  // ==========================================
  await prisma.studentProfile.create({
    data: {
      userId: student1.id,
      rollNumber: 'CSE2024001',
      enrollmentNo: 'ENR2024001',
      dateOfBirth: new Date('2002-05-15'),
      gender: 'Female',
      address: '123 Main St, City',
      bloodGroup: 'A+',
      guardianName: 'Robert Johnson',
      guardianPhone: '+1234567800',
      admissionDate: new Date('2024-08-01'),
      currentSemester: 2,
      departmentId: departments[0].id,
      program: 'B.Tech',
    },
  });

  await prisma.studentProfile.create({
    data: {
      userId: student2.id,
      rollNumber: 'EE2024001',
      enrollmentNo: 'ENR2024002',
      dateOfBirth: new Date('2001-11-20'),
      gender: 'Male',
      address: '456 Oak Ave, City',
      bloodGroup: 'B+',
      guardianName: 'Mary Williams',
      guardianPhone: '+1234567801',
      admissionDate: new Date('2024-08-01'),
      currentSemester: 2,
      departmentId: departments[1].id,
      program: 'B.Tech',
    },
  });

  await prisma.studentProfile.create({
    data: {
      userId: student3.id,
      rollNumber: 'CSE2024002',
      enrollmentNo: 'ENR2024003',
      dateOfBirth: new Date('2002-03-10'),
      gender: 'Male',
      address: '789 Pine Rd, City',
      bloodGroup: 'O+',
      guardianName: 'Sarah Brown',
      guardianPhone: '+1234567802',
      admissionDate: new Date('2024-08-01'),
      currentSemester: 2,
      departmentId: departments[0].id,
      program: 'B.Tech',
    },
  });

  console.log('✓ Created student profiles');

  // ==========================================
  // Create Faculty Profiles
  // ==========================================
  await prisma.facultyProfile.create({
    data: {
      userId: faculty1.id,
      employeeId: 'FAC2024001',
      designation: 'Professor',
      specialization: 'Artificial Intelligence',
      dateOfJoining: new Date('2020-01-15'),
      qualification: 'Ph.D. Computer Science',
      experience: 15,
      bio: 'Experienced professor with expertise in AI and Machine Learning.',
    },
  });

  await prisma.facultyProfile.create({
    data: {
      userId: faculty2.id,
      employeeId: 'FAC2024002',
      designation: 'Associate Professor',
      specialization: 'Thermal Engineering',
      dateOfJoining: new Date('2021-06-01'),
      qualification: 'Ph.D. Mechanical Engineering',
      experience: 10,
      bio: 'Dedicated researcher in thermal sciences and energy systems.',
    },
  });

  console.log('✓ Created faculty profiles');

  // ==========================================
  // Create Sample Activity Logs
  // ==========================================
  await prisma.activityLog.create({
    data: {
      userId: systemAdmin.id,
      action: 'LOGIN',
      module: 'AUTH',
      details: { browser: 'Chrome', os: 'Windows', ipAddress: '192.168.1.1' },
      ipAddress: '192.168.1.1',
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: 'CREATE_USER',
      module: 'USER_MANAGEMENT',
      details: { createdUser: 'John Smith', role: 'FACULTY' },
      ipAddress: '192.168.1.2',
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: student1.id,
      action: 'LOGIN',
      module: 'AUTH',
      details: { browser: 'Firefox', os: 'MacOS', ipAddress: '192.168.1.10' },
      ipAddress: '192.168.1.10',
    },
  });

  console.log('✓ Created activity logs');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📧 Test Accounts:');
  console.log('---------------------------');
  console.log('System Admin: admin@evanshisolution.com / password123');
  console.log('Admin: director@evanshisolution.com / password123');
  console.log('Coordinator: coordinator@evanshisolution.com / password123');
  console.log('Faculty: john.faculty@evanshisolution.com / password123');
  console.log('Student: alice.student@evanshisolution.com / password123');
  console.log('---------------------------');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });