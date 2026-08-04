import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth';
import Test from '@/models/Test';
import Question from '@/models/Question';

const updateTestSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  course: z.enum(['All', 'MERN Stack', 'Java Full Stack', 'Python Full Stack', 'Data Analytics', 'AI & Machine Learning', 'Flutter', 'UI/UX']).optional(),
  date: z.string().optional(),
  duration: z.number().min(5).max(300).optional(),
  passingMarks: z.number().min(0).optional(),
  status: z.enum(['draft', 'published', 'expired']).optional(),
  instructions: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const test = await Test.findById(id).populate('createdBy', 'name');

    if (!test) {
      return NextResponse.json({ success: false, message: 'Test not found' }, { status: 404 });
    }

    // Get questions (hide correct answers for students)
    const questionsRaw = await Question.find({ testId: id }).sort({ order: 1 });
    
    let questions;
    if (user.role === 'student') {
      questions = questionsRaw.map((q) => ({
        _id: q._id,
        type: q.type,
        question: q.question,
        options: q.options,
        marks: q.marks,
        imageUrl: q.imageUrl,
        pdfUrl: q.pdfUrl,
        order: q.order,
        // correctAnswer intentionally omitted for students
      }));
    } else {
      questions = questionsRaw;
    }

    return NextResponse.json({ success: true, test, questions });
  } catch (error) {
    console.error('Get test error:', error);
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
    const validation = updateTestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectDB();
    const { id } = await params;
    
    const updateData: Record<string, unknown> = { ...validation.data };
    if (validation.data.date) {
      updateData.date = new Date(validation.data.date);
    }

    const test = await Test.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!test) {
      return NextResponse.json({ success: false, message: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Test updated successfully', test });
  } catch (error) {
    console.error('Update test error:', error);
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
    
    // Delete test and all its questions
    await Promise.all([
      Test.findByIdAndDelete(id),
      Question.deleteMany({ testId: id }),
    ]);

    return NextResponse.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
