import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth';
import Student from '@/models/Student';

const updateStudentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  studentId: z.string().min(4).max(20).optional(),
  password: z.string().min(6).optional(),
  course: z.enum(['MERN Stack', 'Java Full Stack', 'Python Full Stack', 'Data Analytics', 'AI & Machine Learning', 'Flutter', 'UI/UX']).optional(),
  batch: z.string().min(2).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id).select('-password');

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error('Get student error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateStudentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id);

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const updateData = validation.data;

    // Check for duplicate email/studentId
    if (updateData.email && updateData.email !== student.email) {
      const existing = await Student.findOne({ email: updateData.email.toLowerCase(), _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 409 });
      }
    }

    if (updateData.studentId && updateData.studentId !== student.studentId) {
      const existing = await Student.findOne({ studentId: updateData.studentId.toUpperCase(), _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ success: false, message: 'Student ID already exists' }, { status: 409 });
      }
    }

    Object.assign(student, updateData);
    if (updateData.email) student.email = updateData.email.toLowerCase();
    if (updateData.studentId) student.studentId = updateData.studentId.toUpperCase();

    await student.save();

    const studentObj = student.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...studentWithoutPassword } = studentObj;

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
      student: studentWithoutPassword,
    });
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
