import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function detectIntent(message: string): string {
  const q = message.toLowerCase();
  if (q.includes('attendance')) return 'attendance';
  if (q.includes('assignment') || q.includes('pending') || q.includes('due') || q.includes('homework')) return 'assignment';
  if (q.includes('timetable') || q.includes('schedule') || q.includes('class today') || q.includes('today class')) return 'timetable';
  if (q.includes('grade') || q.includes('cgpa') || q.includes('mark') || q.includes('score') || q.includes('predict')) return 'grade';
  if (q.includes('notice') || q.includes('announcement') || q.includes('news')) return 'notice';
  return 'fallback';
}

export async function POST(req: NextRequest) {
  try {
    const { userId, message, role } = await req.json();
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

    const intent = detectIntent(message);
    let reply = '';

    if (intent === 'attendance' && userId) {
      const student = await prisma.student.findFirst({
        where: { userId },
        include: {
          enrollments: {
            include: { attendance: true, Class: { include: { course: true } } },
          },
        },
      });

      if (student) {
        const subjectStats = student.enrollments.map(en => {
          const total = en.attendance.length;
          const present = en.attendance.filter(a => a.status === 'present' || a.status === 'late').length;
          const pct = total > 0 ? Math.round((present / total) * 100) : 0;
          return { name: en.Class.course.courseName, pct, total, present };
        });
        const overall = subjectStats.length > 0
          ? Math.round(subjectStats.reduce((s, sub) => s + sub.pct, 0) / subjectStats.length)
          : 0;
        const lowSubjects = subjectStats.filter(s => s.pct < 75);

        reply = `Your overall attendance is **${overall}%**.\n\nBreakdown by subject:\n${subjectStats.map(s => `• ${s.name}: **${s.pct}%** (${s.present}/${s.total} classes)`).join('\n')}`;
        if (lowSubjects.length > 0) {
          reply += `\n\n⚠️ Warning: You are below 75% in **${lowSubjects.map(s => s.name).join(', ')}**. Attend the next few classes to stay safe!`;
        }
      } else {
        reply = 'Your overall attendance is good! Keep it up. Log in as a student to see subject-wise breakdown.';
      }
    } else if (intent === 'assignment' && userId) {
      const student = await prisma.student.findFirst({ where: { userId } });
      if (student) {
        const enrollments = await prisma.enrollment.findMany({
          where: { studentId: student.id },
          include: { Class: { include: { assignments: { include: { submissions: { where: { studentId: student.id } } } } } } },
        });
        const pending = enrollments.flatMap(en =>
          en.Class.assignments.filter(a => a.submissions.length === 0 && new Date(a.dueDate) > new Date())
        );
        const overdue = enrollments.flatMap(en =>
          en.Class.assignments.filter(a => a.submissions.length === 0 && new Date(a.dueDate) <= new Date())
        );

        if (pending.length === 0 && overdue.length === 0) {
          reply = '🎉 Great news! You have no pending assignments. All caught up!';
        } else {
          reply = pending.length > 0 ? `You have **${pending.length} upcoming assignment(s)**:\n${pending.map(a => `• ${a.title} — Due ${new Date(a.dueDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`).join('\n')}` : '';
          if (overdue.length > 0) {
            reply += `\n\n⚠️ **${overdue.length} overdue** assignment(s) — submit ASAP:\n${overdue.map(a => `• ${a.title}`).join('\n')}`;
          }
        }
      } else {
        reply = 'I found no pending assignments. Log in as a student to check your assignment status.';
      }
    } else if (intent === 'timetable' && userId) {
      const student = await prisma.student.findFirst({
        where: { userId },
        include: { enrollments: { include: { Class: { include: { course: true, faculty: { include: { user: true } } } } } } },
      });
      if (student) {
        const scheduleSlots = ['08:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'];
        const roomList = ['LH-301', 'LH-405', 'Lab-2', 'LH-102', 'LH-201'];
        const today = new Date().toLocaleDateString('en-IN', { weekday: 'long' });
        reply = `📅 Your schedule for today (${today}):\n\n`;
        student.enrollments.slice(0, 5).forEach((en, i) => {
          const faculty = en.Class.faculty?.user;
          const prof = faculty ? `Prof. ${faculty.firstName[0]}. ${faculty.lastName}` : 'TBA';
          reply += `• **${scheduleSlots[i] || ''}** — ${en.Class.course.courseName} (${en.Class.course.courseCode})\n  📍 ${roomList[i]} · 👨‍🏫 ${prof}\n`;
        });
      } else {
        reply = `Today's schedule:\n• 09:00 AM: Data Structures (Room 302)\n• 11:00 AM: Operating Systems (Room 405)\n• 02:00 PM: DBMS Lab (Lab 2)`;
      }
    } else if (intent === 'grade' && userId) {
      const student = await prisma.student.findFirst({
        where: { userId },
        include: { submissions: { where: { status: 'graded' }, include: { assignment: { include: { Class: { include: { course: true } } } } } } },
      });
      if (student && student.submissions.length > 0) {
        const avgMark = student.submissions.reduce((s, sub) => s + (sub.marks || 0), 0) / student.submissions.length;
        const cgpa = Math.min(10, Math.round(avgMark / 10 * 10) / 10);
        reply = `Based on your graded assignments, your current estimated CGPA is **${cgpa.toFixed(1)}/10** (Grade ${cgpa >= 9 ? 'O' : cgpa >= 8 ? 'A+' : cgpa >= 7 ? 'A' : cgpa >= 6 ? 'B+' : 'B'}).\n\nSubject breakdown:\n${student.submissions.slice(0, 5).map(s => `• ${s.assignment.Class.course.courseName}: **${s.marks}/${s.assignment.maxMarks}**`).join('\n')}`;
      } else {
        reply = `No graded submissions found yet. Submit your assignments to get grade predictions. Keep up your attendance to maintain eligibility!`;
      }
    } else if (intent === 'notice') {
      const notices = await prisma.notice.findMany({ orderBy: { createdAt: 'desc' }, take: 3 });
      if (notices.length > 0) {
        reply = `📢 Latest campus notices:\n\n${notices.map((n, i) => `${i + 1}. **${n.title}**\n   Category: ${n.category} · Priority: ${n.priority}\n   ${n.content.slice(0, 100)}...`).join('\n\n')}`;
      } else {
        reply = 'No new notices at the moment. Check back later!';
      }
    } else {
      reply = `I'm **ARIA**, your Smart Campus AI Assistant 🤖\n\nI can help you with:\n• 📊 **Attendance** — "What's my attendance in OS?"\n• 📝 **Assignments** — "Any pending assignments?"\n• 📅 **Timetable** — "Show my schedule for today"\n• ⭐ **Grades** — "What's my CGPA?"\n• 📢 **Notices** — "Any new announcements?"\n\nHow can I help you today?`;
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({ reply: 'Sorry, I encountered an error. Please try again.' });
  }
}
