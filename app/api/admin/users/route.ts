import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const role = searchParams.get('role') || undefined;
    const search = searchParams.get('search') || undefined;

    const where: any = {};
    if (role && role !== 'all') where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          studentProfile: true,
          facultyProfile: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        department: u.studentProfile?.department || u.facultyProfile?.department || 'Administration',
        semester: u.studentProfile?.semester || '—',
        studentId: u.studentProfile?.studentId,
        employeeId: u.facultyProfile?.employeeId,
        status: 'active', // Can be extended with a status field
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, role, department, semester, section } = body;

    if (!firstName || !lastName || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: 'changeme123', // Default password
        role,
        ...(role === 'student' && {
          studentProfile: {
            create: {
              studentId: `CS${Date.now().toString().slice(-5)}`,
              department: department || 'Computer Science',
              semester: semester || '1',
              section: section || 'A',
            },
          },
        }),
        ...(role === 'faculty' && {
          facultyProfile: {
            create: {
              employeeId: `EMP${Date.now().toString().slice(-4)}`,
              department: department || 'Computer Science',
            },
          },
        }),
      },
      include: { studentProfile: true, facultyProfile: true },
    });

    return NextResponse.json({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
    }, { status: 201 });
  } catch (error) {
    console.error('Admin users POST error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
