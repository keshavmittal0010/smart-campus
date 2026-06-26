import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    const formattedSubmissions = submissions.map(s => ({
      id: s.id,
      student: `${s.student.user.firstName} ${s.student.user.lastName}`,
      roll: s.student.studentId,
      studentId: s.studentId,
      submitted: s.submittedAt.toISOString().replace('T', ' ').substring(0, 16), // 'YYYY-MM-DD HH:MM'
      text: s.content || 'No text content provided.',
      marks: s.marks,
      feedback: s.feedback || '',
      status: s.status
    }));

    return NextResponse.json(formattedSubmissions);

  } catch (error) {
    console.error('Fetch assignment submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
