import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currentUserId = searchParams.get('userId') || '';

    // Get all students with their enrollments, attendance, and submissions
    const students = await prisma.student.findMany({
      include: {
        user: true,
        enrollments: {
          include: { attendance: true },
        },
        submissions: {
          where: { status: 'graded' },
        },
      },
    });

    const ranked = students.map(student => {
      // Calculate attendance %
      let totalClasses = 0;
      let presentClasses = 0;
      for (const en of student.enrollments) {
        totalClasses += en.attendance.length;
        presentClasses += en.attendance.filter(a => a.status === 'present' || a.status === 'late').length;
      }
      const attendancePct = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

      // Count on-time submissions (all graded submissions count as on-time for now)
      const onTimeSubmissions = student.submissions.length;

      // Sum marks earned
      const marksEarned = student.submissions.reduce((sum, s) => sum + (s.marks || 0), 0);

      // Points formula: attendance% × 10 + 50 per on-time submission + marks
      const points = Math.round(attendancePct * 10 + onTimeSubmissions * 50 + marksEarned);

      // Calculate streak (consecutive days present)
      const allDates = new Set<string>();
      for (const en of student.enrollments) {
        for (const att of en.attendance) {
          if (att.status === 'present' || att.status === 'late') {
            allDates.add(new Date(att.attendanceDate).toLocaleDateString('en-CA'));
          }
        }
      }
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toLocaleDateString('en-CA');
        if (allDates.has(key)) {
          streak++;
        } else {
          // If checking today (i = 0) and attendance is not yet marked, do not break the streak immediately
          if (i === 0) continue;
          break;
        }
      }

      const name = `${student.user.firstName} ${student.user.lastName}`;
      const avatar = `${student.user.firstName[0]}${student.user.lastName[0]}`;

      return {
        studentId: student.studentId,
        userId: student.userId,
        name,
        roll: student.studentId,
        avatar,
        attendance: attendancePct,
        submissions: onTimeSubmissions,
        points,
        streak,
        isCurrentUser: student.userId === currentUserId,
      };
    });

    // Sort by points descending, assign rank
    ranked.sort((a, b) => b.points - a.points);
    const withRank = ranked.map((s, i) => ({ ...s, rank: i + 1 }));

    return NextResponse.json({ leaderboard: withRank });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
