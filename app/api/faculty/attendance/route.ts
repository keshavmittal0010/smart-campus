import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    let classId = searchParams.get('classId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Fetch Faculty Profile
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

    if (faculty.classes.length === 0) {
      return NextResponse.json({ error: 'Faculty has no classes assigned' }, { status: 400 });
    }

    // If no classId, default to the first class
    if (!classId) {
      classId = faculty.classes[0].id;
    }

    // 2. Fetch Class Details & Enrolled Students
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        course: true,
        enrollments: {
          include: {
            student: {
              include: {
                user: true
              }
            },
            attendance: {
              where: {
                // Fetch attendance for today
                attendanceDate: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
              }
            }
          }
        }
      }
    });

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // 3. Map students to frontend format
    const students = classData.enrollments.map(e => {
      const todayAttendance = e.attendance[0]; // Filtered in DB query for today
      return {
        studentId: e.student.id,
        roll: e.student.studentId,
        name: `${e.student.user.firstName} ${e.student.user.lastName}`,
        status: todayAttendance ? todayAttendance.status : 'present' // default to present if not marked
      };
    });

    return NextResponse.json({
      classInfo: {
        id: classData.id,
        name: classData.course.courseName,
        code: classData.course.courseCode,
        section: classData.section,
        semester: `${classData.course.semester}th`,
        dateString: new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })
      },
      students,
      classesList: faculty.classes.map(c => ({ id: c.id, code: c.course.courseCode, section: c.section }))
    });

  } catch (error) {
    console.error('Fetch faculty attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { classId, attendanceList, date } = await req.json(); // attendanceList: Array<{ studentId: string, status: string }>

    if (!classId || !attendanceList || !Array.isArray(attendanceList)) {
      return NextResponse.json({ error: 'Class ID and attendance list are required' }, { status: 400 });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(attendanceDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(attendanceDate.setHours(23, 59, 59, 999));

    // Get all enrollments for this class
    const enrollments = await prisma.enrollment.findMany({
      where: { classId }
    });

    const upserts = attendanceList.map(async (item) => {
      // Find the enrollment for this student in this class
      const enrollment = enrollments.find(e => e.studentId === item.studentId);
      if (!enrollment) return;

      // Find if attendance record exists for this day
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          enrollmentId: enrollment.id,
          classId,
          attendanceDate: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      });

      if (existingAttendance) {
        return prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: { status: item.status }
        });
      } else {
        return prisma.attendance.create({
          data: {
            enrollmentId: enrollment.id,
            classId,
            attendanceDate: startOfDay, // Store midnight to align with query
            status: item.status
          }
        });
      }
    });

    await Promise.all(upserts);

    return NextResponse.json({ message: 'Attendance saved successfully' });

  } catch (error) {
    console.error('Save attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
