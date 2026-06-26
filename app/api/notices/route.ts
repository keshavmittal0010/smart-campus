import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true
      }
    });

    const formattedNotices = notices.map(n => {
      // Calculate relative time
      const diffMs = Date.now() - n.createdAt.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHrs = Math.floor(diffMins / 60);
      let timeStr = 'Just now';
      
      if (diffMins > 0 && diffMins < 60) {
        timeStr = `${diffMins} mins ago`;
      } else if (diffHrs > 0 && diffHrs < 24) {
        timeStr = `${diffHrs} hours ago`;
      } else if (diffHrs >= 24) {
        timeStr = `${Math.floor(diffHrs / 24)} days ago`;
      }

      return {
        id: n.id,
        title: n.title,
        content: n.content,
        priority: n.priority,
        category: n.category,
        author: `${n.user.firstName} ${n.user.lastName}`,
        date: n.createdAt.toISOString().split('T')[0],
        time: timeStr,
        read: false,
        pinned: n.priority === 'urgent'
      };
    });

    return NextResponse.json(formattedNotices);

  } catch (error) {
    console.error('Fetch notices error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, content, priority, category, userId } = await req.json();

    if (!title || !content || !userId) {
      return NextResponse.json({ error: 'Title, content, and userId are required' }, { status: 400 });
    }

    // Verify user exists and is authorized (faculty or admin)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || (user.role !== 'faculty' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized to post notices' }, { status: 403 });
    }

    const newNotice = await prisma.notice.create({
      data: {
        title,
        content,
        priority: priority || 'medium',
        category: category || 'General',
        createdBy: userId
      },
      include: {
        user: true
      }
    });

    return NextResponse.json({
      message: 'Notice posted successfully',
      notice: {
        id: newNotice.id,
        title: newNotice.title,
        content: newNotice.content,
        priority: newNotice.priority,
        category: newNotice.category,
        author: `${newNotice.user.firstName} ${newNotice.user.lastName}`,
        date: newNotice.createdAt.toISOString().split('T')[0],
        time: 'Just now',
        read: false,
        pinned: newNotice.priority === 'urgent'
      }
    });

  } catch (error) {
    console.error('Post notice error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
