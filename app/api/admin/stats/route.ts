import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const [totalStudents, totalFaculty, totalClasses, totalNotices] = await Promise.all([
      prisma.student.count(),
      prisma.faculty.count(),
      prisma.class.count(),
      prisma.notice.count(),
    ]);

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        studentProfile: true,
        facultyProfile: true,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [attendanceMarkedToday, submissionsThisWeek] = await Promise.all([
      prisma.attendance.count({ where: { attendanceDate: { gte: today } } }),
      prisma.submission.count({ where: { submittedAt: { gte: weekAgo } } }),
    ]);

    return NextResponse.json({
      totalStudents,
      totalFaculty,
      totalClasses,
      totalNotices,
      recentUsers: recentUsers.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        department: u.studentProfile?.department || u.facultyProfile?.department || 'Administration',
      })),
      platformStats: {
        attendanceMarkedToday,
        submissionsThisWeek,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
