import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch Student profile & enrollments
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        enrollments: {
          include: {
            class: {
              include: {
                course: true,
                faculty: {
                  include: { user: true }
                }
              }
            }
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Static mapping of course schedules (matching seed database)
    const scheduleConfig: Record<string, Array<{ time: string; day: string; room: string; duration: number }>> = {
      'CS301': [ // Data Structures
        { time: '09:00', day: 'Monday', room: 'LH-301', duration: 1 },
        { time: '14:00', day: 'Tuesday', room: 'LH-204', duration: 1 },
        { time: '09:00', day: 'Thursday', room: 'LH-301', duration: 1 },
        { time: '14:00', day: 'Friday', room: 'PL-101', duration: 2 } // Lab
      ],
      'CS302': [ // Operating Systems
        { time: '11:00', day: 'Monday', room: 'LH-204', duration: 1 },
        { time: '09:00', day: 'Wednesday', room: 'LH-205', duration: 1 },
        { time: '11:00', day: 'Friday', room: 'LH-301', duration: 1 }
      ],
      'CS303': [ // DBMS
        { time: '11:00', day: 'Wednesday', room: 'LH-301', duration: 1 },
        { time: '09:00', day: 'Friday', room: 'LH-205', duration: 1 },
        { time: '14:00', day: 'Monday', room: 'CL-102', duration: 2 } // Lab
      ],
      'CS304': [ // Computer Networks
        { time: '09:00', day: 'Tuesday', room: 'LH-202', duration: 1 },
        { time: '14:00', day: 'Thursday', room: 'LH-204', duration: 1 },
        { time: '14:00', day: 'Wednesday', room: 'NL-101', duration: 2 } // Lab
      ],
      'CS305': [ // Software Engineering
        { time: '11:00', day: 'Tuesday', room: 'LH-301', duration: 1 },
        { time: '11:00', day: 'Thursday', room: 'LH-202', duration: 1 },
        { time: '10:00', day: 'Saturday', room: 'LH-202', duration: 1 }
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

    // Build the weekly schedule grid
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const scheduleGrid: Record<string, Record<string, any>> = {};
    days.forEach(day => {
      scheduleGrid[day] = {};
    });

    const enrolledSubjects: Array<{ name: string; color: string }> = [];

    student.enrollments.forEach(enrollment => {
      const course = enrollment.class.course;
      const courseCode = course.courseCode;
      const schedules = scheduleConfig[courseCode] || [];
      const classColor = subjectColors[courseCode] || '#6b7280';

      enrolledSubjects.push({
        name: course.courseName,
        color: classColor
      });

      schedules.forEach(sched => {
        if (scheduleGrid[sched.day]) {
          // Add the class for each hour of its duration
          for (let i = 0; i < sched.duration; i++) {
            const [hourStr, minuteStr] = sched.time.split(':');
            const currentHour = parseInt(hourStr, 10) + i;
            const timeKey = `${currentHour.toString().padStart(2, '0')}:${minuteStr}`;
            
            if (scheduleGrid[sched.day]) {
              scheduleGrid[sched.day][timeKey] = {
                subject: course.courseName,
                code: courseCode,
                room: sched.room,
                faculty: enrollment.class.faculty ? `Prof. ${enrollment.class.faculty.user.lastName}` : 'N/A',
                color: classColor,
                duration: sched.duration,
                isContinuation: i > 0
              };
            }
          }
        }
      });
    });

    // Compile today's classes
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = daysOfWeek[new Date().getDay()];
    
    const todayClasses: any[] = [];
    student.enrollments.forEach(enrollment => {
      const courseCode = enrollment.class.course.courseCode;
      const schedules = scheduleConfig[courseCode] || [];
      const classColor = subjectColors[courseCode] || '#6b7280';

      schedules.forEach(sched => {
        if (sched.day === todayName) {
          // Convert 24h format in config to 12h for the UI if needed, or keep standard
          const [hour, minute] = sched.time.split(':');
          const hrInt = parseInt(hour, 10);
          const ampm = hrInt >= 12 ? 'PM' : 'AM';
          const hr12 = hrInt % 12 || 12;
          const time12 = `${hr12.toString().padStart(2, '0')}:${minute} ${ampm}`;

          todayClasses.push({
            time: time12,
            subject: enrollment.class.course.courseName,
            room: sched.room,
            faculty: enrollment.class.faculty ? `Prof. ${enrollment.class.faculty.user.lastName}` : 'N/A',
            color: classColor
          });
        }
      });
    });

    // Sort today's classes chronologically
    todayClasses.sort((a, b) => a.time.localeCompare(b.time));

    // Fallback if no classes scheduled today
    if (todayClasses.length === 0) {
      todayClasses.push(
        { time: '09:00 AM', subject: 'Data Structures', room: 'LH-301', faculty: 'Prof. Mehta', color: '#3b82f6' },
        { time: '11:00 AM', subject: 'Operating Systems', room: 'LH-204', faculty: 'Prof. Sharma', color: '#10b981' }
      );
    }

    return NextResponse.json({
      schedule: scheduleGrid,
      todayClasses,
      subjects: enrolledSubjects.length > 0 ? enrolledSubjects : [
        { name: 'Data Structures', color: '#3b82f6' },
        { name: 'Operating Systems', color: '#10b981' },
        { name: 'DBMS', color: '#8b5cf6' }
      ]
    });

  } catch (error) {
    console.error('Timetable API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
