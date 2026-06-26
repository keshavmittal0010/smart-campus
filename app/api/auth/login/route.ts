import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user in DB
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
        facultyProfile: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // In a real app, use bcrypt.compare(password, user.passwordHash)
    // Here we are skipping the strict password check for demo purposes
    // since the mock seed uses 'hashed_password'

    const payload = {
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      avatar: user.firstName.substring(0, 2).toUpperCase(),
      profile: user.studentProfile || user.facultyProfile
    };

    // Instead of actual JWT via cookies for this MVP, we return the payload
    // and let the client manage it in localStorage (like before) to ensure smooth transition.
    // In production, you would sign a JWT here and set an HTTP-only cookie.
    
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
