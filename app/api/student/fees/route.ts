export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        fees: {
          orderBy: { dueDate: 'asc' },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      fees: student.fees,
      payments: student.payments,
    });
  } catch (error) {
    console.error('Student fees fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { feeId, method } = body;

    if (!feeId) {
      return NextResponse.json({ error: 'Fee ID is required' }, { status: 400 });
    }

    const targetFee = await prisma.fee.findUnique({
      where: { id: feeId },
    });

    if (!targetFee) {
      return NextResponse.json({ error: 'Fee record not found' }, { status: 404 });
    }

    if (targetFee.paid) {
      return NextResponse.json({ error: 'Fee is already paid' }, { status: 400 });
    }

    // Update fee to paid
    const updatedFee = await prisma.fee.update({
      where: { id: feeId },
      data: { paid: true },
    });

    // Create payment transaction
    const newPayment = await prisma.payment.create({
      data: {
        studentId: targetFee.studentId,
        feeLabel: targetFee.label,
        amount: targetFee.amount,
        method: method || 'UPI',
        status: 'success',
      },
    });

    return NextResponse.json({
      success: true,
      fee: updatedFee,
      payment: newPayment,
    });
  } catch (error) {
    console.error('Student fee payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
