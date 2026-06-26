import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find Faculty
    const faculty = await prisma.faculty.findUnique({
      where: { userId },
      include: {
        classes: {
          include: {
            course: true,
            enrollments: true,
            assignments: {
              include: {
                submissions: true
              }
            }
          }
        }
      }
    });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty profile not found' }, { status: 404 });
    }

    const assignmentsList: any[] = [];
    faculty.classes.forEach(cls => {
      cls.assignments.forEach(a => {
        const totalSubmissions = a.submissions.length;
        const totalGraded = a.submissions.filter(s => s.status === 'graded').length;

        assignmentsList.push({
          id: a.id,
          title: a.title,
          description: a.description || '',
          class: `${cls.course.courseCode}-${cls.section}`,
          classId: cls.id,
          due: a.dueDate.toISOString().split('T')[0],
          submissions: totalSubmissions,
          total: cls.enrollments.length,
          maxMarks: a.maxMarks,
          graded: totalGraded,
          published: true // default to true
        });
      });
    });

    return NextResponse.json(assignmentsList);

  } catch (error) {
    console.error('Faculty fetch assignments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, classId, title, description, dueDate, maxMarks } = await req.json();

    if (!classId || !title || !dueDate || !maxMarks || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify faculty
    const faculty = await prisma.faculty.findUnique({
      where: { userId }
    });

    if (!faculty) {
      return NextResponse.json({ error: 'Faculty profile not found' }, { status: 404 });
    }

    const newAssignment = await prisma.assignment.create({
      data: {
        classId,
        title,
        description,
        dueDate: new Date(dueDate),
        maxMarks: parseInt(maxMarks, 10)
      }
    });

    return NextResponse.json({
      message: 'Assignment created successfully',
      assignment: newAssignment
    });

  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
