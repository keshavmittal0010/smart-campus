export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (studentId) {
      // Return details for a single student
      const fees = await prisma.fee.findMany({
        where: { studentId },
        orderBy: { dueDate: 'asc' },
      });
      const payments = await prisma.payment.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
      });
      return NextResponse.json({ fees, payments });
    }

    // Return student list with summaries for admin dashboard
    const students = await prisma.student.findMany({
      include: {
        user: true,
        fees: true,
        payments: true,
      },
    });

    const formatted = students.map((s) => {
      const totalFees = s.fees.reduce((sum, f) => sum + f.amount, 0);
      const totalPaid = s.fees.filter((f) => f.paid).reduce((sum, f) => sum + f.amount, 0);
      const totalDue = s.fees.filter((f) => !f.paid).reduce((sum, f) => sum + f.amount, 0);
      const overdueCount = s.fees.filter((f) => !f.paid && f.overdue).length;

      return {
        id: s.id,
        studentId: s.studentId,
        name: `${s.user.firstName} ${s.user.lastName}`,
        email: s.user.email,
        department: s.department,
        semester: s.semester,
        totalFees,
        totalPaid,
        totalDue,
        overdueCount,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Admin fees GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, label, amount, dueDate } = body;

    if (!studentId || !label || !amount || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine if overdue initially based on due date
    const isOverdue = new Date(dueDate).getTime() < Date.now();

    const newFee = await prisma.fee.create({
      data: {
        studentId,
        label,
        amount: Number(amount),
        dueDate: new Date(dueDate),
        paid: false,
        overdue: isOverdue,
      },
    });

    return NextResponse.json({ success: true, fee: newFee });
  } catch (error) {
    console.error('Admin fees POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { feeId, paid, label, amount, dueDate, overdue } = body;

    if (!feeId) {
      return NextResponse.json({ error: 'Fee ID is required' }, { status: 400 });
    }

    const currentFee = await prisma.fee.findUnique({
      where: { id: feeId },
    });

    if (!currentFee) {
      return NextResponse.json({ error: 'Fee record not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (paid !== undefined) updateData.paid = paid;
    if (label !== undefined) updateData.label = label;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (overdue !== undefined) updateData.overdue = overdue;

    const updatedFee = await prisma.fee.update({
      where: { id: feeId },
      data: updateData,
    });

    // If marked paid, create a payment record
    if (paid === true && !currentFee.paid) {
      await prisma.payment.create({
        data: {
          studentId: currentFee.studentId,
          feeLabel: label || currentFee.label,
          amount: amount ? Number(amount) : currentFee.amount,
          method: 'Admin Manual',
          status: 'success',
        },
      });
    }

    return NextResponse.json({ success: true, fee: updatedFee });
  } catch (error) {
    console.error('Admin fees PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const feeId = searchParams.get('feeId');

    if (!feeId) {
      return NextResponse.json({ error: 'Fee ID is required' }, { status: 400 });
    }

    await prisma.fee.delete({
      where: { id: feeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin fees DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
