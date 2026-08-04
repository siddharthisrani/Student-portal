import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth';
import Test from '@/models/Test';

const createTestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().optional().default(''),
  course: z.enum(['All', 'MERN Stack', 'Java Full Stack', 'Python Full Stack', 'Data Analytics', 'AI & Machine Learning', 'Flutter', 'UI/UX']),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  duration: z.number().min(5).max(300),
  passingMarks: z.number().min(0).default(0),
  status: z.enum(['draft', 'published', 'expired']).default('draft'),
  instructions: z.array(z.string()).optional(),
});

// GET all tests
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || '';
    const course = url.searchParams.get('course') || '';

    const query: Record<string, unknown> = {};

    if (user.role === 'student') {
      // Students only see published tests
      query.status = 'published';
    } else if (status) {
      query.status = status;
    }

    if (course) query.course = { $in: [course, 'All'] };

    const total = await Test.countDocuments(query);
    const tests = await Test.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name');

    return NextResponse.json({
      success: true,
      tests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get tests error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// POST create test
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createTestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    const test = await Test.create({
      ...validation.data,
      date: new Date(validation.data.date),
      createdBy: user.id,
    });

    return NextResponse.json(
      { success: true, message: 'Test created successfully', test },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create test error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
