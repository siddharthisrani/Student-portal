import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import { signToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth';
import Admin from '@/models/Admin';
import Student from '@/models/Student';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Student ID or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { identifier, password } = validation.data;
    await connectDB();

    // Try admin login first
    const isEmail = identifier.includes('@');

    if (isEmail) {
      // Check admins first for email login
      const admin = await Admin.findOne({ email: identifier.toLowerCase() }).select('+password');
      if (admin && admin.isActive) {
        const isMatch = await admin.comparePassword(password);
        if (isMatch) {
          admin.lastLogin = new Date();
          await admin.save({ validateBeforeSave: false });

          const token = signToken({
            id: admin._id.toString(),
            email: admin.email,
            role: 'admin',
            name: admin.name,
          });

          const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
              id: admin._id.toString(),
              name: admin.name,
              email: admin.email,
              role: 'admin',
              avatar: admin.avatar,
            },
          });

          response.cookies.set(AUTH_COOKIE_OPTIONS.name, token, {
            httpOnly: AUTH_COOKIE_OPTIONS.httpOnly,
            secure: AUTH_COOKIE_OPTIONS.secure,
            sameSite: AUTH_COOKIE_OPTIONS.sameSite,
            maxAge: AUTH_COOKIE_OPTIONS.maxAge,
            path: AUTH_COOKIE_OPTIONS.path,
          });

          return response;
        }
      }
    }

    // Check students (by email or studentId)
    const studentQuery = isEmail
      ? { email: identifier.toLowerCase() }
      : { studentId: identifier.toUpperCase() };

    const student = await Student.findOne(studentQuery).select('+password');

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Please check your Student ID/email and password.' },
        { status: 401 }
      );
    }

    if (student.status === 'inactive') {
      return NextResponse.json(
        { success: false, message: 'Your account has been deactivated. Please contact the institute.' },
        { status: 403 }
      );
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Please check your Student ID/email and password.' },
        { status: 401 }
      );
    }

    student.lastLogin = new Date();
    await student.save({ validateBeforeSave: false });

    const token = signToken({
      id: student._id.toString(),
      email: student.email,
      role: 'student',
      name: student.name,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
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

    response.cookies.set(AUTH_COOKIE_OPTIONS.name, token, {
      httpOnly: AUTH_COOKIE_OPTIONS.httpOnly,
      secure: AUTH_COOKIE_OPTIONS.secure,
      sameSite: AUTH_COOKIE_OPTIONS.sameSite,
      maxAge: AUTH_COOKIE_OPTIONS.maxAge,
      path: AUTH_COOKIE_OPTIONS.path,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
