import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth';
import Test from '@/models/Test';
import Student from '@/models/Student';
import Submission from '@/models/Submission';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const student = await Student.findById(user.id);

    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Find published test for today matching student's course or 'All'
    const test = await Test.findOne({
      
      status: 'published',
      date: { $gte: startOfDay, $lt: endOfDay },
      course: { $in: [student.course, 'All'] },
    });

    if (!test) {
      return NextResponse.json({ success: true, test: null, hasSubmitted: false });
    }

    // Check if student already submitted
    const submission = await Submission.findOne({
      testId: test._id,
      studentId: user.id,
    });

    return NextResponse.json({
      success: true,
      test: {
        _id: test._id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        totalQuestions: test.totalQuestions,
        passingMarks: test.passingMarks,
        instructions: test.instructions,
        course: test.course,
        date: test.date,
      },
      hasSubmitted: !!submission,
      submissionId: submission?._id || null,
    });
  } catch (error) {
    console.error('Today test error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
