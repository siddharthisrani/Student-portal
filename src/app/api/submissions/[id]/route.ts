import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth';
import Submission from '@/models/Submission';
import Question from '@/models/Question';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const submission = await Submission.findById(id)
      .populate('testId', 'title course date duration totalMarks passingMarks instructions')
      .populate('studentId', 'name studentId course batch');

    if (!submission) {
      return NextResponse.json({ success: false, message: 'Submission not found' }, { status: 404 });
    }

    // Students can only see their own submissions
    if (user.role === 'student' && submission.studentId._id.toString() !== user.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // Get questions with correct answers for result review
    const questions = await Question.find({ testId: submission.testId._id }).sort({ order: 1 });

    return NextResponse.json({
      success: true,
      submission,
      questions,
    });
  } catch (error) {
    console.error('Get submission error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
