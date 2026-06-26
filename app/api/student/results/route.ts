import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const student = await prisma.student.findFirst({
      where: { userId },
      include: {
        enrollments: {
          include: {
            attendance: true,
            class: {
              include: {
                course: true,
              },
            },
          },
        },
        submissions: {
          where: { status: 'graded' },
          include: {
            assignment: {
              include: { class: { include: { course: true } } },
            },
          },
        },
      },
    });

    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const gradeMap: Record<string, string> = {};
    const marksMap: Record<string, { marks: number; maxMarks: number }> = {};
    for (const sub of student.submissions) {
      const courseId = sub.assignment.class.courseId;
      marksMap[courseId] = { marks: sub.marks || 0, maxMarks: sub.assignment.maxMarks };
      const pct = ((sub.marks || 0) / sub.assignment.maxMarks) * 100;
      gradeMap[courseId] = pct >= 90 ? 'O' : pct >= 80 ? 'A+' : pct >= 70 ? 'A' : pct >= 60 ? 'B+' : pct >= 50 ? 'B' : 'F';
    }

    const subjects = student.enrollments.map(en => {
      const total = en.attendance.length;
      const attended = en.attendance.filter(a => a.status === 'present' || a.status === 'late').length;
      const courseId = en.class.courseId;
      const marks = marksMap[courseId] || null;
      const grade = gradeMap[courseId] || (marks ? 'N/A' : 'Pending');

      return {
        name: en.class.course.courseName,
        code: en.class.course.courseCode,
        credits: en.class.course.credits,
        attended,
        total,
        attendancePct: total > 0 ? Math.round((attended / total) * 100) : 0,
        marks: marks?.marks ?? null,
        maxMarks: marks?.maxMarks ?? 100,
        grade,
        pass: marks ? marks.marks / marks.maxMarks >= 0.4 : null,
      };
    });

    // Calculate CGPA
    const gradedSubjects = subjects.filter(s => s.marks !== null);
    let cgpa = 0;
    if (gradedSubjects.length > 0) {
      const avgMark = gradedSubjects.reduce((sum, s) => sum + (s.marks || 0) / s.maxMarks * 10, 0) / gradedSubjects.length;
      cgpa = Math.round(avgMark * 10) / 10;
    }

    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);

    return NextResponse.json({
      subjects,
      cgpa,
      gradeCard: {
        studentId: student.studentId,
        semester: student.semester,
        department: student.department,
        totalCredits,
        year: new Date().getFullYear(),
      },
    });
  } catch (error) {
    console.error('Results error:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
