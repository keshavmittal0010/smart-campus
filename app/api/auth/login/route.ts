import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user in DB
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          student: true,
          faculty: true
        }
      });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json({ error: 'Database connection failed. Please check server configuration.' }, { status: 503 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Support both bcrypt hashes and the plain demo password used in seed
    const isValidPassword =
      user.passwordHash === 'hashed_password'
        ? password === 'password123'
        : await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      avatar: user.firstName.substring(0, 2).toUpperCase(),
      profile: user.student || user.faculty
    };

    return NextResponse.json({
      message: 'Login successful',
      user: payload,
      token: 'mock_jwt_token_here'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

