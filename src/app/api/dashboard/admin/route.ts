import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth';
import Student from '@/models/Student';
import Test from '@/models/Test';
import Submission from '@/models/Submission';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [
      totalStudents,
      activeStudents,
      totalTests,
      todaysTests,
      totalSubmissions,
      recentSubmissions,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'active' }),
      Test.countDocuments(),
      Test.countDocuments({ date: { $gte: startOfDay, $lt: endOfDay } }),
      Submission.countDocuments(),
      Submission.find()
        .sort({ submittedAt: -1 })
        .limit(5)
        .populate('testId', 'title')
        .populate('studentId', 'name studentId'),
    ]);

    // Average score across all submissions
    const scoreAgg = await Submission.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$percentage' } } },
    ]);
    const averageScore = Math.round(scoreAgg[0]?.avgScore || 0);

    // Course distribution
    const courseDist = await Student.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        totalTests,
        todaysTests,
        totalSubmissions,
        averageScore,
      },
      courseDistribution: courseDist,
      recentActivity: recentSubmissions,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
