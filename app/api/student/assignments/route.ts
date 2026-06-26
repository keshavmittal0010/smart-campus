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
        enrollments: true
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const classIds = student.enrollments.map(e => e.classId);

    // 2. Fetch Assignments for these classes
    const assignments = await prisma.assignment.findMany({
      where: {
        classId: { in: classIds }
      },
      include: {
        Class: {
          include: {
            course: true
          }
        },
        submissions: {
          where: {
            studentId: student.id
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    // Subject color mapping
    const subjectColors: Record<string, string> = {
      'CS301': '#3b82f6', // blue
      'CS302': '#10b981', // green
      'CS303': '#8b5cf6', // purple
      'CS304': '#f59e0b', // orange
      'CS305': '#ef4444', // red
    };

    // 3. Map to frontend format
    const formattedAssignments = assignments.map(a => {
      const submission = a.submissions[0]; // Filtered by current student in DB query
      const isSubmitted = !!submission;
      
      let status = 'pending';
      let marks = null;
      let feedback = null;

      if (isSubmitted) {
        status = submission.status; // 'submitted' or 'graded'
        marks = submission.marks;
        feedback = submission.feedback;
      }

      return {
        id: a.id,
        subject: a.Class.course.courseName,
        code: a.Class.course.courseCode,
        title: a.title,
        desc: a.description || '',
        due: a.dueDate.toISOString().split('T')[0], // 'YYYY-MM-DD'
        maxMarks: a.maxMarks,
        status,
        color: subjectColors[a.Class.course.courseCode] || '#3b82f6',
        submitted: isSubmitted,
        marks,
        feedback
      };
    });

    return NextResponse.json(formattedAssignments);

  } catch (error) {
    console.error('Assignments API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
