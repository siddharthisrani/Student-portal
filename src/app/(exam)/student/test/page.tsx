import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";

import Student from "@/models/Student";
import Test from "@/models/Test";
import Submission from "@/models/Submission";

import StartTestButton from "@/components/student/StartTestButton";

import {
  BookOpen,
  Clock,
  CheckCircle2,
  CalendarDays,
  Clock3,
  FileText,
  Award,
  ArrowRight,
  AlertCircle,
  ArrowLeft // Added ArrowLeft icon
} from "lucide-react";

export const metadata: Metadata = {
  title: "Today's Tests | DNDC Student Portal",
};

export default async function StudentTestsPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  await connectDB();

  const student = await Student.findById(user.id).lean();

  if (!student) {
    redirect("/login");
  }

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

  const tests = await Test.find({
    status: "published",
    date: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
    $or: [
      { targetType: "all" },
      { targetType: "course", course: studentCourse },
      { targetType: "batch", course: studentCourse, batch: studentBatch },
      { targetType: "students", studentIds: user.id },
    ],
  })
    .sort({ createdAt: -1 })
    .lean();

  const submissions = await Submission.find({
    studentId: user.id,
  }).lean();

  const submissionMap = new Map(
    submissions.map((submission: any) => [
      submission.testId.toString(),
      submission,
    ])
  );

  // Format today's date nicely for the header
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(today);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      
      {/* Back Button */}
      <Link
        href="/student/dashboard"
        className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </Link>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Today's Tests
          </h1>
          <p className="mt-2 text-base text-slate-500">
            Complete your scheduled assessments to track your progress.
          </p>
        </div>
        
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
          <CalendarDays className="h-4 w-4 text-indigo-500" />
          {formattedDate}
        </div>
      </div>

      {/* Empty State */}
      {tests.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-slate-900">
            No Tests Scheduled
          </h2>
          <p className="mt-2 max-w-sm text-center text-sm text-slate-500">
            You're all caught up for today! Enjoy your free time or review your previous study materials.
          </p>
        </div>
      )}

      {/* Test List */}
      <div className="grid gap-6">
        {tests.map((test: any) => {
          const submission = submissionMap.get(test._id.toString());
          const submitted = Boolean(submission);
          const published = submission?.status === "published";

          // Determine visual styling based on status
          let borderStyle = "border-l-indigo-500";
          let badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200";
          let badgeIcon = <AlertCircle className="mr-1.5 h-3.5 w-3.5" />;
          let badgeText = "Action Required";

          if (submitted && !published) {
            borderStyle = "border-l-amber-500 opacity-90";
            badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
            badgeIcon = <Clock3 className="mr-1.5 h-3.5 w-3.5" />;
            badgeText = "Under Review";
          } else if (published) {
            borderStyle = "border-l-emerald-500 opacity-80";
            badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
            badgeIcon = <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />;
            badgeText = "Graded";
          }

          return (
            <div
              key={test._id.toString()}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white border-l-[6px] transition-all hover:shadow-md ${borderStyle}`}
            >
              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between">
                
                {/* Left Content Area */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 sm:justify-start">
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {test.title}
                    </h2>
                    
                    {/* Status Badge */}
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeStyle}`}>
                      {badgeIcon}
                      {badgeText}
                    </span>
                  </div>

                  {test.description && (
                    <p className="line-clamp-2 text-sm text-slate-600 sm:max-w-2xl">
                      {test.description}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                      {test.totalQuestions} Questions
                    </div>

                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {test.duration} Minutes
                    </div>

                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                      <Award className="h-3.5 w-3.5 text-slate-400" />
                      {test.totalMarks} Marks
                    </div>
                  </div>
                </div>

                {/* Right Action Area */}
                <div className="flex w-full shrink-0 flex-col sm:w-auto sm:items-end">
                  {!submitted && (
                    <div className="w-full sm:w-[180px]">
                      <StartTestButton testId={test._id.toString()} />
                    </div>
                  )}

                  {submitted && !published && (
                    <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 sm:w-[180px]">
                      Result Pending...
                    </div>
                  )}

                  {published && (
                    <Link
                      href={`/student/results/${submission._id}`}
                      className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-600 sm:w-[180px]"
                    >
                      View Result
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  )}
                </div>
                
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}