import { Metadata } from "next";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";

import Submission from "@/models/Submission";
import Student from "@/models/Student";
import Test from "@/models/Test";
import Attendance from "@/models/Attendance";

import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  ClipboardList,
  ArrowRight,
  Calendar,
  XCircle,
  AlertCircle,
  MapPin,
  CalendarCheck,
} from "lucide-react";

import { formatDate, formatDateTime } from "@/lib/utils";
import { getTodayAttendanceDate } from "@/lib/attendanceDate";

export const metadata: Metadata = {
  title: "Dashboard | DNDC Student Portal",
};

async function getStudentDashboardData(userId: string) {
  await connectDB();

  const student = await Student.findById(userId)
    .select("-password")
    .lean();

  if (!student) {
    return null;
  }

  /* =========================
     ATTENDANCE
  ========================= */

  const attendanceDate = getTodayAttendanceDate();

  const todayAttendance = await Attendance.findOne({
    studentId: userId,
    date: attendanceDate,
  })
    .select("checkInTime status distance")
    .lean();

  /* =========================
     RECENT SUBMISSIONS
  ========================= */

  const submissions = await Submission.find({
    studentId: userId,
  })
    .sort({ submittedAt: -1 })
    .populate("testId", "title course date")
    .limit(5)
    .lean();

  /* =========================
     TODAY'S TESTS
  ========================= */

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

  const studentCourse = (student as any).course;
const studentBatch = (student as any).batch;

const todaysTests = await Test.find({
  status: "published",

  date: {
    $gte: startOfDay,
    $lt: endOfDay,
  },

  $or: [
    // All students
    {
      targetType: "all",
    },

    // Course
    {
      targetType: "course",
      course: studentCourse,
    },

    // Batch
    {
      targetType: "batch",
      course: studentCourse,
      batch: studentBatch,
    },

    // Selected students
    {
      targetType: "students",
      studentIds: userId,
    },

    // Old tests created before assignment system
    {
      targetType: { $exists: false },
      course: {
        $in: [studentCourse, "All"],
      },
    },
  ],
})
.sort({ createdAt: -1 })
.lean();

  /* =========================
     TODAY'S SUBMISSIONS
  ========================= */

  const todaysSubmissions = await Submission.find({
    studentId: userId,
    testId: {
      $in: todaysTests.map((test) => test._id),
    },
  }).lean();

  const completedToday = todaysSubmissions.length;

  const pendingTests = Math.max(
    0,
    todaysTests.length - completedToday
  );

  /* =========================
     ALL SUBMISSIONS
  ========================= */

  const allSubmissions = await Submission.find({
    studentId: userId,
  })
    .sort({ submittedAt: -1 })
    .lean();

  /*
   * IMPORTANT:
   * Only published submissions are allowed
   * to contribute to student's score statistics.
   */

  const publishedSubmissions =
    allSubmissions.filter(
      (submission) =>
        submission.status === "published"
    );

  const hasPublishedResults =
    publishedSubmissions.length > 0;

  /* =========================
     TOTAL TESTS
  ========================= */

  const totalTests = allSubmissions.length;

  /* =========================
     AVERAGE SCORE
  ========================= */

  const publishedTotalScore =
    publishedSubmissions.reduce(
      (sum, submission) =>
        sum + Number(submission.totalScore || 0),
      0
    );

  const publishedTotalMarks =
    publishedSubmissions.reduce(
      (sum, submission) =>
        sum + Number(submission.totalMarks || 0),
      0
    );

  const averageScore =
    publishedTotalMarks > 0
      ? Math.round(
          (publishedTotalScore /
            publishedTotalMarks) *
            100
        )
      : 0;

  /* =========================
     HIGHEST SCORE
  ========================= */

  const highestScore =
    publishedSubmissions.length > 0
      ? Math.max(
          ...publishedSubmissions.map(
            (submission) =>
              submission.totalMarks > 0
                ? Math.round(
                    (Number(
                      submission.totalScore || 0
                    ) /
                      Number(
                        submission.totalMarks || 0
                      )) *
                      100
                  )
                : 0
          )
        )
      : 0;

  /* =========================
     RETURN DATA
  ========================= */

  return {
    student,

    stats: {
      totalTests,
      averageScore,
      highestScore,
    },

    hasPublishedResults,

    recentActivity: submissions,

    todaysTests,

    todaysSubmissions,

    pendingTests,

    completedToday,

    todayAttendance: todayAttendance
      ? {
          checkInTime:
            todayAttendance.checkInTime
              ? new Date(
                  todayAttendance.checkInTime
                ).toISOString()
              : null,

          status: todayAttendance.status,

          distance:
            todayAttendance.distance,
        }
      : null,
  };
}

export default async function StudentDashboard() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  const data =
    await getStudentDashboardData(user.id);

  if (!data) {
    redirect("/login");
  }

  const {
    student,
    stats,
    hasPublishedResults,
    recentActivity,
    todaysTests,
    todaysSubmissions,
    pendingTests,
    completedToday,
    todayAttendance,
  } = data;

  /* =========================
     TODAY PROGRESS
  ========================= */

  const todayProgress =
    todaysTests.length > 0
      ? Math.round(
          (completedToday /
            todaysTests.length) *
            100
        )
      : 0;

  /* =========================
     STAT CARDS
  ========================= */

  const statCards = [
    {
      label: "Total Tests",
      value: stats.totalTests,
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },

    {
      label: "Avg Score",
      value: hasPublishedResults
        ? `${stats.averageScore}%`
        : "—",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },

    {
      label: "Highest Score",
      value: hasPublishedResults
        ? `${stats.highestScore}%`
        : "—",
      icon: Award,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className=" p-4 sm:p-6 space-y-6">

      {/* =========================
          HEADER
      ========================= */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {student.name}!
        </h1>

        <p className="mt-1 text-slate-500">
          {formatDate(new Date())}
        </p>
      </div>

      {/* =========================
          TODAY'S TESTS
      ========================= */}

      <div className="rounded-3xl bg-gradient-to-r from-purple-600 via-purple-600 to-indigo-700 p-6 text-white shadow-lg">

        <div className="flex items-start justify-between">

          <div>

            <div className="flex items-center gap-2 text-sm font-medium text-purple-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <ClipboardList className="h-4 w-4" />
              </div>

              Today's Tests
            </div>

            <div className="mt-3 flex items-baseline gap-2">

              <span className="text-4xl font-bold">
                {todaysTests.length}
              </span>

              <span className="text-sm text-purple-100">
                test
                {todaysTests.length !== 1
                  ? "s"
                  : ""}{" "}
                assigned
              </span>

            </div>

          </div>

          <Link
            href="/student/test"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-purple-700 shadow-sm transition hover:bg-purple-50"
          >
            View Tests
            <ArrowRight className="h-4 w-4" />
          </Link>

        </div>

        {/* Completed / Pending */}

        <div className="mt-6 grid gap-4 md:grid-cols-2">

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5">

            <div className="flex items-center gap-2 text-sm font-medium text-purple-100">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <CheckCircle2 className="h-4 w-4" />
              </div>

              Completed

            </div>

            <p className="mt-2 text-3xl font-bold">
              {completedToday}
            </p>

          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5">

            <div className="flex items-center gap-2 text-sm font-medium text-purple-100">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Clock className="h-4 w-4" />
              </div>

              Pending

            </div>

            <p className="mt-2 text-3xl font-bold">
              {pendingTests}
            </p>

          </div>

        </div>

        {/* Progress */}

        <div className="mt-5">

          <div className="mb-2 flex items-center justify-between text-xs text-purple-100">

            <span>
              Today's progress
            </span>

            <span className="font-semibold">
              {todayProgress}%
            </span>

          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">

            <div
              className="h-full rounded-full bg-white transition-all"
              style={{
                width: `${todayProgress}%`,
              }}
            />

          </div>

        </div>

      </div>

      {/* =========================
          ATTENDANCE
      ========================= */}

      <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">

              <MapPin className="h-6 w-6 text-orange-500" />

            </div>

            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Today's Attendance
              </p>

              {todayAttendance ? (

                <>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {todayAttendance.status ===
                    "present"
                      ? "Marked"
                      : todayAttendance.status}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">

                    {todayAttendance.checkInTime
                      ? `Checked in at ${formatDateTime(
                          new Date(
                            todayAttendance.checkInTime
                          )
                        )}`
                      : "Attendance marked"}

                  </p>
                </>

              ) : (

                <>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    Not Marked
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Mark your attendance when you reach DNDC.
                  </p>
                </>

              )}

            </div>

          </div>

          {!todayAttendance && (
            <Link
              href="/student/attendance"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600"
            >
              Mark Attendance
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          {todayAttendance && (
            <Link
              href="/student/attendance"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View Attendance
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

        </div>

      </div>

      {/* =========================
          STATS
      ========================= */}

      <div className="grid gap-4 md:grid-cols-3">

        {statCards.map((card) => {

          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >

              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}
              >
                <Icon
                  className={`h-5 w-5 ${card.color}`}
                />
              </div>

              <p className="text-2xl font-bold text-slate-900">
                {card.value}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {card.label}
              </p>

            </div>
          );

        })}

      </div>

      {/* =========================
          RECENT ACTIVITY
      ========================= */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 p-5">

          <h2 className="font-semibold text-slate-900">
            Recent Activity
          </h2>

          <Link
            href="/student/results"
            className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </Link>

        </div>

        {recentActivity.length === 0 ? (

          <div className="p-8 text-center text-sm text-slate-400">
            No test activity yet.
          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {recentActivity.map(
              (submission: any) => {

                const test =
                  submission.testId;

                const isPublished =
                  submission.status ===
                  "published";

                const percentage =
                  isPublished &&
                  submission.totalMarks > 0
                    ? Math.round(
                        (submission.totalScore /
                          submission.totalMarks) *
                          100
                      )
                    : 0;

                const isPassed =
                  isPublished &&
                  submission.totalScore >=
                    submission.passingMarks;

                return (

                  <div
                    key={submission._id.toString()}
                    className="flex items-center gap-4 px-5 py-4"
                  >

                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                        !isPublished
                          ? "bg-amber-100"
                          : isPassed
                          ? "bg-emerald-100"
                          : "bg-red-100"
                      }`}
                    >

                      {!isPublished ? (

                        <Clock className="h-5 w-5 text-amber-600" />

                      ) : isPassed ? (

                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                      ) : (

                        <XCircle className="h-5 w-5 text-red-500" />

                      )}

                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-semibold text-slate-900">
                        {test?.title || "Test"}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">

                        <Calendar className="h-3 w-3" />

                        {formatDateTime(
                          submission.submittedAt
                        )}

                      </p>

                    </div>

                    <div className="text-right">

                      {isPublished ? (

                        <>
                          <p
                            className={`text-sm font-bold ${
                              isPassed
                                ? "text-emerald-600"
                                : "text-red-500"
                            }`}
                          >
                            {percentage}%
                          </p>

                          <p className="text-xs text-slate-400">
                            {submission.totalScore}/
                            {submission.totalMarks}
                          </p>
                        </>

                      ) : (

                        <>
                          <p className="text-sm font-semibold text-amber-600">
                            Result Pending
                          </p>

                          <p className="text-xs text-slate-400">
                            Awaiting publication
                          </p>
                        </>

                      )}

                    </div>

                  </div>

                );
              }
            )}

          </div>

        )}

      </div>

      {/* =========================
          BOTTOM ACTION CARDS
      ========================= */}

      <div className="grid gap-4 md:grid-cols-2">

        {/* Today's Test */}

        <Link
          href="/student/test"
          className="group rounded-2xl border border-purple-200 bg-purple-50 p-5 transition hover:border-purple-300 hover:shadow-sm"
        >

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white">

              <ClipboardList className="h-6 w-6" />

            </div>

            <div className="flex-1">

              <p className="font-semibold text-purple-700">
                Today's Test
              </p>

              <p className="text-sm text-purple-500">
                {pendingTests > 0
                  ? "Attempt now"
                  : "View today's tests"}
              </p>

            </div>

            <ArrowRight className="h-5 w-5 text-purple-400 transition group-hover:translate-x-1" />

          </div>

        </Link>

        {/* Test History */}

        <Link
          href="/student/results"
          className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
        >

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">

              <Clock className="h-6 w-6 text-slate-600" />

            </div>

            <div className="flex-1">

              <p className="font-semibold text-slate-900">
                Test History
              </p>

              <p className="text-sm text-slate-500">
                View all results
              </p>

            </div>

            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />

          </div>

        </Link>

      </div>

    </div>
  );
}