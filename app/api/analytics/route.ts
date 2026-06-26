import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '';
    const role = searchParams.get('role') || 'student';

    // Get all classes with courses
    const classes = await prisma.class.findMany({
      include: {
        course: true,
        enrollments: {
          include: { attendance: true, student: true },
        },
        assignments: {
          include: { submissions: true },
        },
      },
    });

    const subjects = classes.map(c => c.course.courseName);
    const subjectCodes = classes.map(c => c.course.courseCode);

    // ---- Attendance Trend (last 4 months by subject) ----
    const months = ['Aug', 'Sep', 'Oct', 'Nov'];
    const monthOffsets = [3, 2, 1, 0]; // months ago

    const attendanceTrend = classes.slice(0, 3).map((cls, ci) => {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
      const data = monthOffsets.map(offset => {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - offset, 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        let total = 0;
        let present = 0;
        for (const en of cls.enrollments) {
          for (const att of en.attendance) {
            const d = new Date(att.attendanceDate);
            if (d >= monthStart && d < monthEnd) {
              total++;
              if (att.status === 'present' || att.status === 'late') present++;
            }
          }
        }
        return total > 0 ? Math.round((present / total) * 100) : 0;
      });
      return { label: cls.course.courseName, data, color: colors[ci] };
    });

    // ---- Grades by Subject ----
    const gradesBySubject = classes.map((cls, i) => {
      const colors = ['rgba(59,130,246,0.7)', 'rgba(239,68,68,0.7)', 'rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)', 'rgba(139,92,246,0.7)'];
      const borderColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
      const gradedSubs = cls.assignments.flatMap(a => a.submissions.filter(s => s.marks !== null));
      const avgScore = gradedSubs.length > 0
        ? Math.round(gradedSubs.reduce((sum, s) => sum + (s.marks || 0), 0) / gradedSubs.length)
        : 0;
      return { subject: cls.course.courseName, avg: avgScore, bg: colors[i], border: borderColors[i] };
    });

    // ---- Submission Rate ----
    let totalAssignments = 0;
    let totalSubmissions = 0;
    let lateSubmissions = 0;
    for (const cls of classes) {
      for (const assignment of cls.assignments) {
        const enrolledCount = cls.enrollments.length;
        totalAssignments += enrolledCount;
        totalSubmissions += assignment.submissions.length;
      }
    }
    const notSubmitted = Math.max(0, totalAssignments - totalSubmissions);
    const onTime = totalSubmissions - lateSubmissions;

    // ---- Total Stats ----
    const totalStudents = await prisma.student.count();
    const allAttendance = await prisma.attendance.findMany();
    const presentCount = allAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const avgAttendance = allAttendance.length > 0 ? Math.round((presentCount / allAttendance.length) * 100) : 0;

    // ---- Grade Distribution (Class-wide) ----
    const allSubmissions = await prisma.submission.findMany({
      where: { marks: { not: null } }
    });
    const gradeDistribution = [
      allSubmissions.filter(s => s.marks !== null && s.marks >= 90).length,
      allSubmissions.filter(s => s.marks !== null && s.marks >= 80 && s.marks < 90).length,
      allSubmissions.filter(s => s.marks !== null && s.marks >= 70 && s.marks < 80).length,
      allSubmissions.filter(s => s.marks !== null && s.marks >= 60 && s.marks < 70).length,
      allSubmissions.filter(s => s.marks !== null && s.marks < 60).length,
    ];

    return NextResponse.json({
      subjects,
      months,
      attendanceTrend,
      gradesBySubject,
      gradeDistribution,
      submissionRate: {
        onTime: Math.max(0, onTime),
        late: lateSubmissions,
        notSubmitted,
      },
      totalStats: {
        totalStudents,
        avgAttendance,
        submitRate: totalAssignments > 0 ? Math.round((totalSubmissions / totalAssignments) * 100) : 0,
        totalClasses: classes.length,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
