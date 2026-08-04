import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth';
import Submission from '@/models/Submission';
import Student from '@/models/Student';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const student = await Student.findById(user.id).select('-password');
    if (!student) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const submissions = await Submission.find({ studentId: user.id })
      .sort({ submittedAt: -1 })
      .populate('testId', 'title course date')
      .limit(10);

    const totalTests = submissions.length;
    const totalScore = submissions.reduce((sum, s) => sum + s.totalScore, 0);
    const totalMarks = submissions.reduce((sum, s) => sum + s.totalMarks, 0);
    const avgPercentage = totalTests > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
    const highestScore = totalTests > 0 ? Math.max(...submissions.map((s) => s.percentage)) : 0;
    const passedTests = submissions.filter((s) => s.isPassed).length;

    return NextResponse.json({
      success: true,
      student,
      stats: {
        totalTests,
        completedTests: totalTests,
        averageScore: avgPercentage,
        highestScore,
        passedTests,
        failedTests: totalTests - passedTests,
      },
      recentActivity: submissions.slice(0, 5),
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
