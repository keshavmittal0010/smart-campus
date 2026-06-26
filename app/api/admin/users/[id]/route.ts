import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { firstName, lastName, email, role, department, semester } = body;

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { studentProfile: true, facultyProfile: true },
    });

    // Update profile if department/semester provided
    if (department || semester) {
      if (user.studentProfile) {
        await prisma.student.update({
          where: { userId: id },
          data: {
            ...(department && { department }),
            ...(semester && { semester }),
          },
        });
      } else if (user.facultyProfile) {
        await prisma.faculty.update({
          where: { userId: id },
          data: { ...(department && { department }) },
        });
      }
    }

    return NextResponse.json({ success: true, id: user.id });
  } catch (error) {
    console.error('Admin user PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Cascade deletes are handled by Prisma schema onDelete rules
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin user DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
