import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const notes = await prisma.note.findMany({
      where: { shared: true },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { views: 'desc' },
    });

    return NextResponse.json({
      notes: notes.map(n => ({
        id: n.id,
        title: n.title,
        subject: n.subject,
        tags: JSON.parse(n.tags || '[]'),
        shared: n.shared,
        views: n.views,
        content: n.content,
        author: `${n.user.firstName} ${n.user.lastName}`,
        createdBy: n.createdBy,
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    console.error('Notes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, title, content, subject, tags, shared } = body;
    if (!userId || !title || !content || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        createdBy: userId,
        title,
        content,
        subject,
        tags: JSON.stringify(tags || []),
        shared: shared !== false,
      },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    return NextResponse.json({
      id: note.id,
      title: note.title,
      subject: note.subject,
      tags: JSON.parse(note.tags),
      shared: note.shared,
      views: note.views,
      content: note.content,
      author: `${note.user.firstName} ${note.user.lastName}`,
      createdBy: note.createdBy,
      createdAt: note.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Notes POST error:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
