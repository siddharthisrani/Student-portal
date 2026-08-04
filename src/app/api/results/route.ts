import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth';
import Submission from '@/models/Submission';

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
    const testId = url.searchParams.get('testId') || '';
    const exportCsv = url.searchParams.get('export') === 'csv';

    const pipeline: object[] = [
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'tests',
          localField: 'testId',
          foreignField: '_id',
          as: 'test',
        },
      },
      { $unwind: '$test' },
    ];

    const matchStage: Record<string, unknown> = {};
    if (testId) {
      matchStage['test._id'] = testId;
    }
    if (search) {
      matchStage.$or = [
        { 'student.name': { $regex: search, $options: 'i' } },
        { 'student.studentId': { $regex: search, $options: 'i' } },
        { 'test.title': { $regex: search, $options: 'i' } },
      ];
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push({ $sort: { submittedAt: -1 } });

    if (exportCsv) {
      // Return all results for CSV export
      const allResults = await Submission.aggregate(pipeline);

      const csvRows = [
        ['Student Name', 'Student ID', 'Course', 'Test Name', 'Score', 'Total Marks', 'Percentage', 'Status', 'Submitted At'],
        ...allResults.map((r) => [
          r.student.name,
          r.student.studentId,
          r.student.course,
          r.test.title,
          r.totalScore,
          r.totalMarks,
          `${r.percentage}%`,
          r.isPassed ? 'Pass' : 'Fail',
          new Date(r.submittedAt).toLocaleString('en-IN'),
        ]),
      ];

      const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="dndc_results.csv"',
        },
      });
    }

    // Paginated results
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Submission.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    const results = await Submission.aggregate(pipeline);

    return NextResponse.json({
      success: true,
      results,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
