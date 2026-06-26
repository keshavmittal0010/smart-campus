import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch Faculty profile & assigned classes
    const faculty = await prisma.faculty.findUnique({
      where: { userId },
      include: {
        classes: {
          include: {
            course: true
          }
        }
      }
    });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty profile not found' }, { status: 404 });
    }

    // Static mapping of course schedules (matching student timetable config)
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

    const assignedCourses: Array<{ name: string; color: string; code: string }> = [];

    faculty.classes.forEach(classObj => {
      const course = classObj.course;
      const courseCode = course.courseCode;
      const schedules = scheduleConfig[courseCode] || [];
      const classColor = subjectColors[courseCode] || '#6b7280';

      assignedCourses.push({
        name: course.courseName,
        code: courseCode,
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
                name: course.courseName,
                code: courseCode,
                room: sched.room,
                section: classObj.section,
                color: classColor,
                duration: sched.duration,
                isContinuation: i > 0 // mark if it's the second hour
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
    faculty.classes.forEach(classObj => {
      const courseCode = classObj.course.courseCode;
      const schedules = scheduleConfig[courseCode] || [];
      const classColor = subjectColors[courseCode] || '#6b7280';

      schedules.forEach(sched => {
        if (sched.day === todayName) {
          todayClasses.push({
            time: sched.time,
            subject: classObj.course.courseName,
            name: classObj.course.courseName,
            code: courseCode,
            room: sched.room,
            section: classObj.section,
            color: classColor,
            duration: sched.duration
          });
        }
      });
    });

    // Sort today's classes chronologically
    todayClasses.sort((a, b) => a.time.localeCompare(b.time));

    return NextResponse.json({
      schedule: scheduleGrid,
      todayClasses,
      courses: assignedCourses
    });

  } catch (error) {
    console.error('Faculty Timetable API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
