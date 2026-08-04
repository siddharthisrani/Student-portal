import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth';
import Student from '@/models/Student';

const createStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  studentId: z.string().min(4, 'Student ID too short').max(20),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  course: z.enum(['MERN Stack', 'Java Full Stack', 'Python Full Stack', 'Data Analytics', 'AI & Machine Learning', 'Flutter', 'UI/UX']),
  batch: z.string().min(2, 'Batch is required'),
  status: z.enum(['active', 'inactive']).default('active'),
});

// GET all students
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const course = url.searchParams.get('course') || '';
    const status = url.searchParams.get('status') || '';

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }
    if (course) query.course = course;
    if (status) query.status = status;

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password');

    return NextResponse.json({
      success: true,
      students,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST create student
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createStudentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    const existingEmail = await Student.findOne({ email: validation.data.email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 409 });
    }

    const existingId = await Student.findOne({ studentId: validation.data.studentId.toUpperCase() });
    if (existingId) {
      return NextResponse.json({ success: false, message: 'Student ID already exists' }, { status: 409 });
    }

    const student = await Student.create({
      ...validation.data,
      email: validation.data.email.toLowerCase(),
      studentId: validation.data.studentId.toUpperCase(),
    });

    const studentObj = student.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...studentWithoutPassword } = studentObj;

    return NextResponse.json(
      { success: true, message: 'Student created successfully', student: studentWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create student error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
