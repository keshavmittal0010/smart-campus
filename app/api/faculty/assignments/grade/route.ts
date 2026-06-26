import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { submissionId, marks, feedback } = await req.json();

    if (!submissionId || marks === undefined) {
      return NextResponse.json({ error: 'Submission ID and marks are required' }, { status: 400 });
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        marks: parseFloat(marks),
        feedback: feedback || '',
        status: 'graded'
      }
    });

    return NextResponse.json({
      message: 'Graded successfully',
      submission: updatedSubmission
    });

  } catch (error) {
    console.error('Grade assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
