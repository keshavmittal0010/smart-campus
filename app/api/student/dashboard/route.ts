import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch Student profile
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        enrollments: {
          include: {
            Class: {
              include: {
                course: true,
                faculty: {
                  include: { user: true }
                }
              }
            },
            attendance: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // 2. Calculate Attendance Stat
    let totalAttended = 0;
    let totalClasses = 0;
    student.enrollments.forEach(e => {
      totalClasses += e.attendance.length;
      totalAttended += e.attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    });
    const attendancePct = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

    // 3. Get Assignments & Submissions
    const classIds = student.enrollments.map(e => e.classId);
    
    const assignments = await prisma.assignment.findMany({
      where: { classId: { in: classIds } },
      include: {
        submissions: {
          where: { studentId: student.id }
        },
        Class: {
          include: { course: true }
        }
      }
    });

    const pendingAssignmentsCount = assignments.filter(a => a.submissions.length === 0).length;

    // 4. Calculate CGPA based on grades
    const gradedEnrollments = student.enrollments.filter(e => e.grade !== null);
    const cgpa = gradedEnrollments.length > 0
      ? (gradedEnrollments.reduce((sum, e) => sum + (e.grade ?? 0), 0) / gradedEnrollments.length).toFixed(2)
      : '0.00';

    // 5. Notices
    const notices = await prisma.notice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true
      }
    });

    const noticesCount = notices.length;

    // Stats array for frontend
    const stats = [
      { label: 'Attendance', value: `${attendancePct}%`, change: 'Real-time', up: true, icon: '✅', color: 'green' },
      { label: 'Assignments Due', value: String(pendingAssignmentsCount), change: 'Pending', up: false, icon: '📝', color: 'orange' },
      { label: 'CGPA', value: String(cgpa), change: 'Cumulative', up: true, icon: '⭐', color: 'purple' },
      { label: 'Notices Unread', value: String(noticesCount), change: 'Latest', up: false, icon: '📢', color: 'blue' },
    ];

    // 6. Today's Classes (Based on weekly schedule mapping)
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = daysOfWeek[new Date().getDay()];
    
    // Static mapping of course schedules (matching seed database)
    const scheduleConfig: Record<string, Array<{ time: string; day: string; room: string; duration: number }>> = {
      'CS301': [ // Data Structures
        { time: '09:00 AM', day: 'Monday', room: 'LH-301', duration: 1 },
        { time: '02:00 PM', day: 'Tuesday', room: 'LH-204', duration: 1 },
        { time: '09:00 AM', day: 'Thursday', room: 'LH-301', duration: 1 },
        { time: '02:00 PM', day: 'Friday', room: 'PL-101', duration: 2 } // Lab
      ],
      'CS302': [ // Operating Systems
        { time: '11:00 AM', day: 'Monday', room: 'LH-204', duration: 1 },
        { time: '09:00 AM', day: 'Wednesday', room: 'LH-205', duration: 1 },
        { time: '11:00 AM', day: 'Friday', room: 'LH-301', duration: 1 }
      ],
      'CS303': [ // DBMS
        { time: '11:00 AM', day: 'Wednesday', room: 'LH-301', duration: 1 },
        { time: '09:00 AM', day: 'Friday', room: 'LH-205', duration: 1 },
        { time: '02:00 PM', day: 'Monday', room: 'CL-102', duration: 2 } // Lab
      ],
      'CS304': [ // Computer Networks
        { time: '09:00 AM', day: 'Tuesday', room: 'LH-202', duration: 1 },
        { time: '02:00 PM', day: 'Thursday', room: 'LH-204', duration: 1 },
        { time: '02:00 PM', day: 'Wednesday', room: 'NL-101', duration: 2 } // Lab
      ],
      'CS305': [ // Software Engineering
        { time: '11:00 AM', day: 'Tuesday', room: 'LH-301', duration: 1 },
        { time: '11:00 AM', day: 'Thursday', room: 'LH-202', duration: 1 },
        { time: '10:00 AM', day: 'Saturday', room: 'LH-202', duration: 1 }
      ]
    };

    // Color palette for subjects
    const subjectColors: Record<string, string> = {
      'CS301': '#3b82f6', // blue
      'CS302': '#10b981', // green
      'CS303': '#8b5cf6', // purple
      'CS304': '#f59e0b', // orange
      'CS305': '#ef4444', // red
    };

    const todayClasses: any[] = [];
    student.enrollments.forEach(enrollment => {
      const courseCode = enrollment.Class.course.courseCode;
      const schedules = scheduleConfig[courseCode] || [];
      const classColor = subjectColors[courseCode] || '#6b7280';
      
      schedules.forEach(sched => {
        if (sched.day === todayName) {
          todayClasses.push({
            time: sched.time,
            subject: enrollment.Class.course.courseName,
            room: sched.room,
            faculty: enrollment.Class.faculty ? `Prof. ${enrollment.Class.faculty.user.lastName}` : 'N/A',
            color: classColor,
            status: 'upcoming'
          });
        }
      });
    });

    // Sort classes by time
    todayClasses.sort((a, b) => a.time.localeCompare(b.time));

    // 7. Recent Assignments mapped to frontend format
    const recentAssignments = assignments.map(a => {
      const submission = a.submissions[0];
      const isSubmitted = !!submission;
      let status = 'pending';
      let marks = null;
      
      if (isSubmitted) {
        status = submission.status;
        marks = submission.marks;
      }

      return {
        subject: a.Class.course.courseName,
        title: a.title,
        due: a.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status,
        marks
      };
    }).slice(0, 4);

    // 8. Notices mapped
    const formattedNotices = notices.map(n => {
      // calculate relative time
      const diffMs = Date.now() - n.createdAt.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      let timeStr = 'Just now';
      if (diffHrs > 0 && diffHrs < 24) {
        timeStr = `${diffHrs}h ago`;
      } else if (diffHrs >= 24) {
        timeStr = `${Math.floor(diffHrs / 24)}d ago`;
      }

      return {
        title: n.title,
        priority: n.priority,
        time: timeStr
      };
    });

    // Subject attendance breakdown
    const attendanceSubjects = student.enrollments.map(e => {
      const attended = e.attendance.filter(a => a.status === 'present' || a.status === 'late').length;
      const total = e.attendance.length;
      const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

      return {
        name: e.Class.course.courseName,
        pct,
        color: subjectColors[e.Class.course.courseCode] || '#6b7280'
      };
    });

    return NextResponse.json({
      stats,
      todayClasses,
      recentAssignments,
      notices: formattedNotices,
      attendanceSubjects
    });

  } catch (error) {
    console.error('Student dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
