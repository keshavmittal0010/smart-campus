import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { assignmentId, userId, content } = await req.json();

    if (!assignmentId || !userId) {
      return NextResponse.json({ error: 'Assignment ID and User ID are required' }, { status: 400 });
    }

    // 1. Find Student
    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // 2. Create or Upsert Submission
    const submission = await prisma.submission.upsert({
      where: {
        // Since we don't have a unique constraint on studentId + assignmentId in schema.prisma directly,
        // we can find first and update, or create. Let's find if it already exists.
        id: (await prisma.submission.findFirst({
          where: { studentId: student.id, assignmentId }
        }))?.id || 'new-submission-uuid'
      },
      update: {
        status: 'submitted',
        submittedAt: new Date(),
        marks: null,
        feedback: null,
        content: content || null
      },
      create: {
        studentId: student.id,
        assignmentId,
        status: 'submitted',
        content: content || null,
        submittedAt: new Date()
      }
    });

    return NextResponse.json({ message: 'Assignment submitted successfully', submission });

  } catch (error) {
    console.error('Assignment submit API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
