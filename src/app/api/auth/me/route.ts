import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import Student from '@/models/Student';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    if (user.role === 'admin') {
      const admin = await Admin.findById(user.id);
      if (!admin || !admin.isActive) {
        return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        user: {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: 'admin',
          avatar: admin.avatar,
        },
      });
    } else {
      const student = await Student.findById(user.id);
      if (!student || student.status === 'inactive') {
        return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        user: {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          role: 'student',
          studentId: student.studentId,
          course: student.course,
          batch: student.batch,
          avatar: student.avatar,
        },
      });
    }
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
