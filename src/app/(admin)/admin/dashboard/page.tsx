import { Metadata } from 'next';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';

import Student from '@/models/Student';
import Test from '@/models/Test';
import Submission from '@/models/Submission';

import Link from 'next/link';

import {
  Users,
  ClipboardList,
  BarChart3,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';

import { formatDateTime } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Admin Dashboard | DNDC Portal',
};

export default async function AdminDashboard() {
  const user = await getAuthUser();

  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  await connectDB();

  const today = new Date();

  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  const [
    totalStudents,
    activeStudents,
    totalTests,
    todaysTests,
    totalSubmissions,
    scoreAgg,
    courseDist,
    recentSubmissions,
  ] = await Promise.all([
    // ----------------------------------
    // Students
    // ----------------------------------

    Student.countDocuments(),

    Student.countDocuments({
      status: 'active',
    }),

    // ----------------------------------
    // Tests
    // ----------------------------------

    Test.countDocuments(),

    Test.countDocuments({
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    }),

    // ----------------------------------
    // Submissions
    // ----------------------------------

    Submission.countDocuments(),

    // ----------------------------------
    // Average percentage
    // Calculate from totalScore / totalMarks
    // ----------------------------------

    Submission.aggregate([
  {
    $match: {
      status: "published",
      totalMarks: {
        $gt: 0,
      },
    },
  },
  {
    $project: {
      percentage: {
        $multiply: [
          {
            $divide: [
              "$totalScore",
              "$totalMarks",
            ],
          },
          100,
        ],
      },
    },
  },
  {
    $group: {
      _id: null,
      avgScore: {
        $avg: "$percentage",
      },
    },
  },
]),

    // ----------------------------------
    // Students by course
    // ----------------------------------

    Student.aggregate([
      {
        $group: {
          _id: '$course',
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 5,
      },
    ]),

    // ----------------------------------
    // Recent submissions
    // ----------------------------------

    Submission.find()
      .sort({
        submittedAt: -1,
      })
      .limit(5)
      .populate(
        'testId',
        'title'
      )
      .populate(
        'studentId',
        'name studentId'
      )
      .lean(),
  ]);

  // ----------------------------------
  // Average score
  // ----------------------------------

  const averageScore = Math.round(
    scoreAgg[0]?.avgScore || 0
  );

  // ----------------------------------
  // Dashboard cards
  // ----------------------------------

  const statCards = [
    {
      label: 'Total Students',
      value: totalStudents,
      sub: `${activeStudents} active`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/admin/students',
    },

    {
      label: 'Total Tests',
      value: totalTests,
      sub: `${todaysTests} today`,
      icon: ClipboardList,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/admin/tests',
    },

    {
      label: 'Total Submissions',
      value: totalSubmissions,
      sub: 'All time',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/admin/results',
    },

    {
      label: 'Avg Score',
      value: `${averageScore}%`,
      sub: 'Across all tests',
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/admin/results',
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* -------------------------------- */}
      {/* Header */}
      {/* -------------------------------- */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Admin Dashboard
        </h1>

        <p className="mt-1 text-slate-500">
          Welcome back, {user.name}!
        </p>
      </div>

      {/* -------------------------------- */}
      {/* Stats Grid */}
      {/* -------------------------------- */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-purple-200 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}
                >
                  <Icon
                    className={`h-5 w-5 ${card.color}`}
                  />
                </div>

                <ArrowRight
                  className="h-4 w-4 text-slate-300 transition-colors group-hover:text-purple-400"
                />

              </div>

              <p className="text-2xl font-bold text-slate-900">
                {card.value}
              </p>

              <p className="mt-0.5 text-sm text-slate-500">
                {card.label}
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                {card.sub}
              </p>
            </Link>
          );
        })}

      </div>

      {/* -------------------------------- */}
      {/* Main Grid */}
      {/* -------------------------------- */}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* -------------------------------- */}
        {/* Recent Submissions */}
        {/* -------------------------------- */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">

          <div className="flex items-center justify-between border-b border-slate-100 p-5">

            <h2 className="font-semibold text-slate-900">
              Recent Submissions
            </h2>

            <Link
              href="/admin/results"
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
            >
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>

          </div>

          {recentSubmissions.length === 0 ? (

            <div className="p-8 text-center text-sm text-slate-400">
              No submissions yet
            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {recentSubmissions.map((sub: any) => {

                const student =
                  sub.studentId as {
                    name?: string;
                    studentId?: string;
                  };

                const test =
                  sub.testId as {
                    title?: string;
                  };

                // ----------------------------------
                // Calculate percentage
                // ----------------------------------

                const totalMarks =
                  Number(sub.totalMarks || 0);

                const totalScore =
                  Number(sub.totalScore || 0);

                const percentage =
                  totalMarks > 0
                    ? Math.round(
                        (totalScore /
                          totalMarks) *
                          100
                      )
                    : 0;

                // ----------------------------------
                // Calculate pass/fail
                // ----------------------------------

                const passingMarks =
                  Number(
                    sub.passingMarks || 0
                  );

                const isPassed =
                  totalScore >=
                  passingMarks;

                return (

                  <div
                    key={sub._id.toString()}
                    className="flex items-center gap-3 px-5 py-3"
                  >

                    {/* Student Avatar */}

                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">

                      {student?.name
                        ?.charAt(0)
                        ?.toUpperCase() || '?'}

                    </div>

                    {/* Student + Test */}

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-medium text-slate-900">
                        {student?.name ||
                          'Unknown Student'}
                      </p>

                      <p className="truncate text-xs text-slate-400">
                        {test?.title ||
                          'Test'}
                      </p>

                    </div>

                    {/* Score */}

                    <div className="flex-shrink-0 text-right">

                      {sub.status === "published" ? (
  <>
    <p
      className={`text-sm font-bold ${
        sub.totalScore >= sub.passingMarks
          ? "text-emerald-600"
          : "text-red-500"
      }`}
    >
      {sub.totalMarks > 0
        ? Math.round(
            (sub.totalScore / sub.totalMarks) * 100
          )
        : 0}
      %
    </p>

    <p className="text-xs text-slate-400">
      {sub.totalScore}/{sub.totalMarks}
    </p>
  </>
) : (
  <>
    <p className="text-sm font-bold text-amber-600">
      Result Pending
    </p>

    <p className="text-xs text-slate-400">
      Awaiting publication
    </p>
  </>
)}

                      <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-slate-400">

                        <Clock className="h-3 w-3" />

                        {formatDateTime(
                          sub.submittedAt
                        ).split(',')[0]}

                      </p>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </div>

        {/* -------------------------------- */}
        {/* Course Distribution */}
        {/* -------------------------------- */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-5">

            <h2 className="font-semibold text-slate-900">
              Students by Course
            </h2>

          </div>

          <div className="space-y-3 p-5">

            {courseDist.length === 0 ? (

              <p className="py-4 text-center text-sm text-slate-400">
                No students enrolled yet
              </p>

            ) : (

              courseDist.map(
                ({
                  _id,
                  count,
                }: {
                  _id: string;
                  count: number;
                }) => (

                  <div key={_id}>

                    <div className="mb-1 flex justify-between text-sm">

                      <span className="truncate text-slate-700">
                        {_id}
                      </span>

                      <span className="ml-2 font-semibold text-slate-900">
                        {count}
                      </span>

                    </div>

                    <div className="h-1.5 w-full rounded-full bg-slate-100">

                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-600"
                        style={{
                          width: `${
                            totalStudents > 0
                              ? Math.min(
                                  100,
                                  (count /
                                    totalStudents) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </div>

      {/* -------------------------------- */}
      {/* Quick Actions */}
      {/* -------------------------------- */}

      <div className="grid gap-4 sm:grid-cols-3">

        {[
          {
            label: 'Add New Student',
            href: '/admin/students?action=create',
            color:
              'from-blue-500 to-blue-600',
            icon: Users,
          },

          {
            label: 'Create New Test',
            href: '/admin/tests?action=create',
            color:
              'from-purple-500 to-violet-600',
            icon: ClipboardList,
          },

          {
            label: 'View All Results',
            href: '/admin/results',
            color:
              'from-emerald-500 to-green-600',
            icon: BarChart3,
          },
        ].map(
          ({
            label,
            href,
            color,
            icon: Icon,
          }) => (

            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${color} p-4 text-white transition-all hover:shadow-lg active:scale-[0.98]`}
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">

                <Icon className="h-5 w-5 text-white" />

              </div>

              <span className="font-semibold">
                {label}
              </span>

              <ArrowRight className="ml-auto h-4 w-4 text-white/70" />

            </Link>

          )
        )}

      </div>

    </div>
  );
}