import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });

    if (!user?.studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentId = user.studentProfile.id;

    // Find the first active enrollment (any class this student is enrolled in)
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId, status: 'active' },
      include: { class: { include: { course: true } } },
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'No active class enrollment found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance already marked today
    const existing = await prisma.attendance.findUnique({
      where: {
        enrollmentId_attendanceDate: {
          enrollmentId: enrollment.id,
          attendanceDate: today,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyMarked: true,
        className: enrollment.class.course.courseName,
        classCode: enrollment.class.course.courseCode,
        time: today.toLocaleTimeString('en-IN', { timeStyle: 'short' }),
        status: existing.status,
      });
    }

    // Mark attendance as present
    await prisma.attendance.create({
      data: {
        enrollmentId: enrollment.id,
        classId: enrollment.classId,
        attendanceDate: today,
        status: 'present',
      },
    });

    return NextResponse.json({
      success: true,
      alreadyMarked: false,
      className: enrollment.class.course.courseName,
      classCode: enrollment.class.course.courseCode,
      time: new Date().toLocaleTimeString('en-IN', { timeStyle: 'short' }),
      status: 'present',
    });
  } catch (error) {
    console.error('QR Scan error:', error);
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
  }
}
