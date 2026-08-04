import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth';
import Submission from '@/models/Submission';
import Test from '@/models/Test';
import Question from '@/models/Question';

const submitSchema = z.object({
  testId: z.string().min(1),
  answers: z.record(z.string(), z.string().nullable()),
  startedAt: z.string(),
  isAutoSubmitted: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validation = submitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    const { testId, answers, startedAt, isAutoSubmitted } = validation.data;

    // Check if already submitted
    const existing = await Submission.findOne({ testId, studentId: user.id });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'You have already submitted this test' },
        { status: 409 }
      );
    }

    // Get test
    const test = await Test.findById(testId);
    if (!test || test.status !== 'published') {
      return NextResponse.json({ success: false, message: 'Test not found or not active' }, { status: 404 });
    }

    // Get all questions with correct answers
    const questions = await Question.find({ testId });

    let totalScore = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skippedAnswers = 0;

    const processedAnswers = questions.map((q) => {
      const selectedAnswer = answers[q._id.toString()] || null;

      if (!selectedAnswer) {
        skippedAnswers++;
        return {
          questionId: q._id,
          selectedAnswer: null,
          isCorrect: false,
          marksEarned: 0,
        };
      }

      const isCorrect = selectedAnswer === q.correctAnswer;
      if (isCorrect) {
        totalScore += q.marks;
        correctAnswers++;
      } else {
        wrongAnswers++;
      }

      return {
        questionId: q._id,
        selectedAnswer,
        isCorrect,
        marksEarned: isCorrect ? q.marks : 0,
      };
    });

    const totalMarks = test.totalMarks;
    const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
    const isPassed = totalScore >= test.passingMarks;
    const submittedAt = new Date();
    const startTime = new Date(startedAt);
    const timeTaken = Math.floor((submittedAt.getTime() - startTime.getTime()) / 1000);

    const submission = await Submission.create({
      testId,
      studentId: user.id,
      answers: processedAnswers,
      totalScore,
      totalMarks,
      percentage,
      correctAnswers,
      wrongAnswers,
      skippedAnswers,
      isPassed,
      passingMarks: test.passingMarks,
      startedAt: startTime,
      submittedAt,
      timeTaken,
      isAutoSubmitted,
    });

    return NextResponse.json({
      success: true,
      message: 'Test submitted successfully',
      result: {
        submissionId: submission._id,
        totalScore,
        totalMarks,
        percentage,
        correctAnswers,
        wrongAnswers,
        skippedAnswers,
        isPassed,
        passingMarks: test.passingMarks,
        timeTaken,
      },
    });
  } catch (error) {
    console.error('Submit test error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// GET student's submissions
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const query = user.role === 'student' ? { studentId: user.id } : {};

    const total = await Submission.countDocuments(query);
    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('testId', 'title course date duration')
      .populate('studentId', 'name studentId course');

    return NextResponse.json({
      success: true,
      submissions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
