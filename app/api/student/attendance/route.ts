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
            },
            attendance: {
              orderBy: {
                attendanceDate: 'desc'
              }
            }
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Color palette for subjects
    const subjectColors: Record<string, string> = {
      'CS301': '#3b82f6', // blue
      'CS302': '#ef4444', // red (OS has low attendance in mock)
      'CS303': '#10b981', // green
      'CS304': '#f59e0b', // orange
      'CS305': '#8b5cf6', // purple
    };

    // 2. Map Enrollments to Subject Overview
    const subjects = student.enrollments.map(e => {
      const courseCode = e.class.course.courseCode;
      const attended = e.attendance.filter(a => a.status === 'present' || a.status === 'late').length;
      const total = e.attendance.length;

      return {
        name: e.class.course.courseName,
        code: courseCode,
        faculty: e.class.faculty 
          ? `Prof. ${e.class.faculty.user.firstName} ${e.class.faculty.user.lastName}` 
          : 'N/A',
        attended,
        total: total || 1, // Prevent division by zero, defaults to 1 if no classes held yet
        color: subjectColors[courseCode] || '#3b82f6'
      };
    });

    // 3. Compile Attendance Log
    const attendanceLog: any[] = [];
    student.enrollments.forEach(e => {
      e.attendance.forEach(a => {
        attendanceLog.push({
          date: a.attendanceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: a.attendanceDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          subject: e.class.course.courseName,
          status: a.status
        });
      });
    });

    // Sort logs by date (newest first)
    // To do this reliably, we'd need the raw timestamp, but since we parsed date we can sort e.attendance records before extracting
    const allAttendance = await prisma.attendance.findMany({
      where: {
        enrollment: {
          studentId: student.id
        }
      },
      include: {
        class: {
          include: {
            course: true
          }
        }
      },
      orderBy: {
        attendanceDate: 'desc'
      }
    });

    const sortedLog = allAttendance.map(a => ({
      date: a.attendanceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: a.attendanceDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      subject: a.class.course.courseName,
      status: a.status
    }));

    return NextResponse.json({
      subjects,
      attendanceLog: sortedLog.length > 0 ? sortedLog : attendanceLog
    });

  } catch (error) {
    console.error('Attendance API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
