import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch Faculty Profile
    const faculty = await prisma.faculty.findUnique({
      where: { userId },
      include: {
        classes: {
          include: {
            course: true,
            enrollments: {
              include: {
                student: {
                  include: {
                    user: true
                  }
                },
                attendance: true
              }
            },
            assignments: {
              include: {
                submissions: {
                  include: {
                    student: {
                      include: { user: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty profile not found' }, { status: 404 });
    }

    // Static schedules and room mapping for courses
    const courseRooms: Record<string, string> = {
      'CS301': 'LH-301',
      'CS302': 'LH-204',
      'CS303': 'LH-301',
      'CS304': 'LH-202',
      'CS305': 'LH-301'
    };

    // 2. Map Classes details
    const classes = faculty.classes.map(c => ({
      id: c.id,
      name: c.course.courseName,
      code: c.course.courseCode,
      section: c.section,
      semester: `${c.course.semester}th`,
      enrolled: c.enrollments.length,
      room: courseRooms[c.course.courseCode] || 'LH-101'
    }));

    // 3. Calculate Quick Stats
    // Today's classes count
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = daysOfWeek[new Date().getDay()];
    const scheduleConfig: Record<string, string[]> = {
      'CS301': ['Monday', 'Tuesday', 'Thursday', 'Friday'],
      'CS302': ['Monday', 'Wednesday', 'Friday'],
      'CS303': ['Wednesday', 'Friday', 'Monday'],
      'CS304': ['Tuesday', 'Thursday', 'Wednesday'],
      'CS305': ['Tuesday', 'Thursday', 'Saturday']
    };
    
    let todaysClassesCount = 0;
    faculty.classes.forEach(c => {
      const days = scheduleConfig[c.course.courseCode] || [];
      if (days.includes(todayName)) todaysClassesCount++;
    });

    // Total unique students taught by this faculty
    const studentIds = new Set<string>();
    faculty.classes.forEach(c => {
      c.enrollments.forEach(e => studentIds.add(e.studentId));
    });
    const totalStudentsTaught = studentIds.size;

    // Pending Grading Submissions count
    let pendingGradingCount = 0;
    const allSubmissions: any[] = [];
    faculty.classes.forEach(c => {
      c.assignments.forEach(a => {
        a.submissions.forEach(s => {
          allSubmissions.push(s);
          if (s.status === 'submitted') {
            pendingGradingCount++;
          }
        });
      });
    });

    // Average Attendance across all classes
    let totalClassesHeld = 0;
    let totalAttended = 0;
    faculty.classes.forEach(c => {
      c.enrollments.forEach(e => {
        totalClassesHeld += e.attendance.length;
        totalAttended += e.attendance.filter(a => a.status === 'present' || a.status === 'late').length;
      });
    });
    const avgAttendancePct = totalClassesHeld > 0 
      ? Math.round((totalAttended / totalClassesHeld) * 100) 
      : 79; // fallback

    const quickStats = [
      { label: "Today's Classes", value: todaysClassesCount, icon: '📅', color: 'blue' },
      { label: 'Pending Grading', value: pendingGradingCount, icon: '📝', color: 'orange' },
      { label: 'Avg Attendance', value: `${avgAttendancePct}%`, icon: '✅', color: 'green' },
      { label: 'Total Students', value: totalStudentsTaught, icon: '🎓', color: 'purple' },
    ];

    // 4. Mapped Recent Submissions
    // Sort all submissions in faculty's assignments by submittedAt desc
    allSubmissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

    const recentSubmissions = allSubmissions.map(s => {
      const diffMs = Date.now() - s.submittedAt.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      let timeStr = 'Just now';
      if (diffHrs > 0 && diffHrs < 24) {
        timeStr = `${diffHrs}h ago`;
      } else if (diffHrs >= 24) {
        timeStr = `${Math.floor(diffHrs / 24)}d ago`;
      }

      // We need to fetch the assignment details (we can attach it during compile)
      const assignmentTitle = faculty.classes
        .flatMap(c => c.assignments)
        .find(a => a.id === s.assignmentId)?.title || 'Assignment';

      return {
        id: s.id,
        student: `${s.student.user.firstName} ${s.student.user.lastName}`,
        roll: s.student.studentId,
        assignment: assignmentTitle,
        submitted: timeStr,
        status: s.status, // 'submitted' or 'graded'
        marks: s.marks
      };
    }).slice(0, 5);

    // 5. Today's Attendance Quick View (Latest attendance records or all students in first class)
    const firstClass = faculty.classes[0];
    const attendanceToday: any[] = [];
    if (firstClass) {
      firstClass.enrollments.forEach(e => {
        // Find if they have attendance marked today
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAttendance = e.attendance.find(a => 
          a.attendanceDate.toISOString().split('T')[0] === todayStr
        );
        
        if (todayAttendance) {
          attendanceToday.push({
            name: `${e.student.user.firstName} ${e.student.user.lastName}`,
            roll: e.student.studentId,
            status: todayAttendance.status
          });
        }
      });
    }

    return NextResponse.json({
      classes,
      quickStats,
      recentSubmissions,
      attendanceToday: attendanceToday.slice(0, 5)
    });

  } catch (error) {
    console.error('Faculty dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
