import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            enrollments: {
              include: {
                attendance: true,
                Class: { include: { course: true } },
              },
            },
            submissions: {
              where: { status: 'graded' },
            },
          },
        },
        faculty: {
          include: {
            classes: {
              include: {
                enrollments: true,
                course: true,
              },
            },
          },
        },
        notices: true,
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.role === 'student' && user.student) {
      const profile = user.student;

      // Calculate overall attendance
      let totalClasses = 0;
      let presentClasses = 0;
      for (const enrollment of profile.enrollments) {
        totalClasses += enrollment.attendance.length;
        presentClasses += enrollment.attendance.filter(a => a.status === 'present' || a.status === 'late').length;
      }
      const attendancePct = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

      // Calculate CGPA from graded submissions
      const gradedSubs = profile.submissions.filter(s => s.marks !== null);
      let cgpa = 0;
      if (gradedSubs.length > 0) {
        const avgMark = gradedSubs.reduce((sum, s) => sum + (s.marks || 0), 0) / gradedSubs.length;
        // Convert 0-100 marks to 10-point CGPA
        cgpa = Math.round((avgMark / 10) * 10) / 10;
        cgpa = Math.min(10, Math.max(0, cgpa));
      }

      const totalAssignments = await prisma.assignment.count({
        where: { Class: { enrollments: { some: { studentId: profile.id } } } },
      });
      const submitted = await prisma.submission.count({
        where: { studentId: profile.id },
      });

      return NextResponse.json({
        role: 'student',
        attendance: attendancePct,
        cgpa: cgpa.toFixed(1),
        submissions: submitted,
        totalAssignments,
        studentId: profile.studentId,
        semester: profile.semester,
        department: profile.department,
      });
    }

    if (user.role === 'faculty' && user.faculty) {
      const profile = user.faculty;
      const classesCount = profile.classes.length;

      // Count unique students enrolled
      const studentIds = new Set<string>();
      for (const cls of profile.classes) {
        for (const en of cls.enrollments) studentIds.add(en.studentId);
      }

      const noticesPosted = user.notices.length;

      return NextResponse.json({
        role: 'faculty',
        classesCount,
        totalStudents: studentIds.size,
        noticesPosted,
        employeeId: profile.employeeId,
        department: profile.department,
      });
    }

    // Admin
    const totalUsers = await prisma.user.count();
    const adminNotices = user.notices.length;
    
    return NextResponse.json({ 
      role: 'admin', 
      department: 'Administration',
      totalUsers,
      systemStatus: 'Online',
      noticesPosted: adminNotices,
      accessLevel: 'Super Admin'
    });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, currentPassword, newPassword } = await req.json();

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    // Support either the stored hash or the standard default demo passwords if the hash is still 'hashed_password'
    const isDefault = user.passwordHash === 'hashed_password';
    const isMatch = currentPassword === user.passwordHash || 
                    (isDefault && (currentPassword === 'student123' || currentPassword === 'faculty123' || currentPassword === 'admin123'));

    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
    }

    // Update password in database
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPassword }
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

