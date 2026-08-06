import { Metadata } from 'next';
import Link from 'next/link';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/models/Submission';
import Student from '@/models/Student';
import Test from '@/models/Test';
import {
  CheckCircle2, Clock, TrendingUp, Award, ClipboardList,
  ArrowRight, Calendar, XCircle, AlertCircle
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Dashboard | DNDC Student Portal',
};

async function getStudentDashboardData(userId: string) {
  await connectDB();

  const student = await Student.findById(userId).select('-password').lean();
  

const tests = await Test.find();

  if (!student) return null;

  const submissions = await Submission.find({ studentId: userId })
    .sort({ submittedAt: -1 })
    .populate('testId', 'title course date')
    .limit(5)
    .lean();

  // Today's test
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

const todaysTests = await Test.find({
  status: "published",
  date: {
    $gte: startOfDay,
    $lt: endOfDay,
  },
  course: {
    $in: [(student as any).course, "All"],
  },
}).lean();

const todaysSubmissions = await Submission.find({
  studentId: userId,
  testId: {
    $in: todaysTests.map((t) => t._id),
  },
}).lean();

const pendingTests =
  todaysTests.length - todaysSubmissions.length;

  // Stats
  const allSubmissions = await Submission.find({ studentId: userId }).lean();
  const totalTests = allSubmissions.length;
  const totalScore = allSubmissions.reduce((sum, s) => sum + s.totalScore, 0);
  const totalMarks = allSubmissions.reduce((sum, s) => sum + s.totalMarks, 0);
  const avgPercentage = totalTests > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
  const highestScore = totalTests > 0 ? Math.max(...allSubmissions.map((s) => s.percentage)) : 0;

  return {
  student,
  stats: {
    totalTests,
    averageScore: avgPercentage,
    highestScore,
  },

  recentActivity: submissions,

  todaysTests,

  pendingTests,

  completedToday: todaysSubmissions.length,
};
}

export default async function StudentDashboard() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const data = await getStudentDashboardData(user.id);
  if (!data) redirect('/login');

  const {
  stats,
  recentActivity,
  todaysTests,
  pendingTests,
  completedToday,
} = data;

  const statCards = [
    {
      label: 'Total Tests',
      value: stats.totalTests,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Avg Score',
      value: `${stats.averageScore}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      gradient: 'from-purple-500 to-violet-600',
    },
    {
      label: 'Highest Score',
      value: `${stats.highestScore}%`,
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      gradient: 'from-amber-500 to-yellow-600',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 mt-1">{formatDate(new Date())}</p>
        </div>
      </div>

      {/* Today's Test Card */}
      {/* Today's Tests Card */}
<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 p-5 text-white shadow-lg shadow-purple-200/50 sm:p-6">

  {/* Decorative background */}
  <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
  <div className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-purple-300/20 blur-3xl" />

  <div className="relative">

    {/* Top */}
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <ClipboardList className="h-4 w-4 text-white" />
          </div>

          <p className="text-sm font-medium text-white/80">
            Today&apos;s Tests
          </p>
        </div>

        <div className="flex items-end gap-2">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {todaysTests.length}
          </h2>

          <span className="mb-1 text-sm font-medium text-white/70">
            {todaysTests.length === 1 ? "test" : "tests"} assigned
          </span>
        </div>
      </div>

      {/* Desktop button */}
      <Link
        href="/student/test"
        className="hidden items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-purple-700 shadow-sm transition hover:bg-purple-50 sm:flex"
      >
        View Tests
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>

    {/* Status cards */}
    <div className="mt-6 grid grid-cols-2 gap-3">

      {/* Completed */}
      <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-200" />
          </div>

          <span className="text-xs font-medium text-white/70 sm:text-sm">
            Completed
          </span>
        </div>

        <p className="mt-3 text-2xl font-bold">
          {completedToday}
        </p>
      </div>

      {/* Pending */}
      <div className="rounded-2xl border border-white/10 bg-white/10 p-3.5 backdrop-blur-sm sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-300/20">
            <Clock className="h-4 w-4 text-amber-200" />
          </div>

          <span className="text-xs font-medium text-white/70 sm:text-sm">
            Pending
          </span>
        </div>

        <p className="mt-3 text-2xl font-bold">
          {pendingTests}
        </p>
      </div>

    </div>

    {/* Progress */}
    {todaysTests.length > 0 && (
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-white/70">
            Today&apos;s progress
          </span>

          <span className="font-semibold text-white">
            {Math.round(
              (completedToday / todaysTests.length) * 100
            )}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{
              width: `${
                (completedToday / todaysTests.length) * 100
              }%`,
            }}
          />
        </div>
      </div>
    )}

    {/* Mobile button */}
    <Link
      href="/student/test"
      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-purple-700 shadow-sm transition active:scale-[0.98] sm:hidden"
    >
      {pendingTests > 0 ? "View Today's Tests" : "View Completed Tests"}
      <ArrowRight className="h-4 w-4" />
    </Link>

  </div>
</div>
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <span className={`text-xs font-medium ${card.color}`}></span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Activity</h2>
          <Link
            href="/student/results"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">No tests attempted yet.</p>
            <p className="text-slate-400 text-xs mt-1">Your completed tests will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivity.map((submission) => {
              const test = submission.testId as unknown as { title: string; course: string; date: string };
              return (
                <Link
                  key={submission._id.toString()}
                  href={`/student/results/${submission._id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 ${
                      submission.isPassed ? 'bg-emerald-100' : 'bg-red-100'
                    }`}
                  >
                    {submission.isPassed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{test?.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateTime(submission.submittedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-bold ${
                        submission.isPassed ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {submission.percentage}%
                    </p>
                    <p className="text-xs text-slate-400">
                      {submission.totalScore}/{submission.totalMarks}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/student/test"
          className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-4 hover:bg-purple-100 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-purple-900 text-sm">Today&apos;s Test</p>
            <p className="text-xs text-purple-600">Attempt now</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-purple-400" />
        </Link>
        <Link
          href="/student/results"
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Clock className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Test History</p>
            <p className="text-xs text-slate-500">View all results</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
        </Link>
      </div>
    </div>
  );
}
