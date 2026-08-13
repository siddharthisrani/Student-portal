import { Metadata } from "next";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";
import Link from "next/link";

import {
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  ArrowRight,
  BarChart2,
  Clock3,
} from "lucide-react";

import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Test History | DNDC Student Portal",
};

export default async function ResultsPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  await connectDB();

  const submissions = await Submission.find({
    studentId: user.id,
  })
    .sort({ submittedAt: -1 })
    .populate("testId", "title course date duration")
    .lean();

  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Previous Tests
        </h1>

        <p className="mt-1 text-slate-500">
          Your complete test history and results
        </p>
      </div>

      {/* No submissions */}
      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

          <BarChart2 className="mx-auto h-12 w-12 text-slate-300 mb-4" />

          <h3 className="font-semibold text-slate-900 mb-2">
            No Tests Yet
          </h3>

          <p className="text-slate-500 text-sm mb-4">
            You haven&apos;t attempted any tests yet.
          </p>

          <Link
            href="/student/test"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
          >
            Take Today&apos;s Test
            <ArrowRight className="h-4 w-4" />
          </Link>

        </div>
      ) : (

        <div className="space-y-3">

          {submissions.map((submission) => {

            const test = submission.testId as unknown as {
              title: string;
              course: string;
              date: string;
              duration: number;
            };

            /*
             * IMPORTANT:
             *
             * Only published submissions expose marks.
             *
             * submitted
             * checking
             * checked
             *
             * = Result Pending
             *
             * published
             * = Result visible
             */

            const isPublished =
              submission.status === "published";

            let pct = 0;
            let isPassed = false;
            let correctAnswers = 0;
            let wrongAnswers = 0;
            let skippedAnswers = 0;
            let grade = "";

            if (isPublished) {

              pct =
                submission.totalMarks > 0
                  ? Math.round(
                      (submission.totalScore /
                        submission.totalMarks) *
                        100
                    )
                  : 0;

              isPassed =
                submission.totalScore >=
                submission.passingMarks;

              correctAnswers =
                submission.answers.filter(
                  (answer: any) =>
                    answer.answer !== null &&
                    answer.answer !== undefined &&
                    answer.answer !== "" &&
                    answer.obtainedMarks ===
                      answer.maxMarks &&
                    answer.maxMarks > 0
                ).length;

              wrongAnswers =
                submission.answers.filter(
                  (answer: any) =>
                    answer.answer !== null &&
                    answer.answer !== undefined &&
                    answer.answer !== "" &&
                    answer.obtainedMarks === 0
                ).length;

              skippedAnswers =
                submission.answers.filter(
                  (answer: any) =>
                    answer.answer === null ||
                    answer.answer === undefined ||
                    answer.answer === ""
                ).length;

              grade =
                pct >= 90
                  ? "A+"
                  : pct >= 80
                  ? "A"
                  : pct >= 70
                  ? "B+"
                  : pct >= 60
                  ? "B"
                  : pct >= 50
                  ? "C"
                  : pct >= 40
                  ? "D"
                  : "F";
            }

            const content = (
              <div className="flex items-start gap-4">

                {/* Status Icon */}
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${
                    !isPublished
                      ? "bg-amber-100"
                      : isPassed
                      ? "bg-emerald-100"
                      : "bg-red-100"
                  }`}
                >

                  {!isPublished ? (
                    <Clock3 className="h-5 w-5 text-amber-600" />
                  ) : isPassed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}

                </div>

                {/* Main */}
                <div className="flex-1 min-w-0">

                  <div className="flex items-start justify-between gap-4">

                    {/* Test Information */}
                    <div>

                      <h3
                        className={`font-semibold text-slate-900 ${
                          isPublished
                            ? "group-hover:text-purple-700"
                            : ""
                        } transition-colors`}
                      >
                        {test?.title || "Test"}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 mt-1">

                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(submission.submittedAt)}
                        </span>

                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />

                          {Math.floor(
                            submission.timeTaken / 60
                          )}
                          m{" "}
                          {submission.timeTaken % 60}
                          s
                        </span>

                        {test?.course && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                            {test.course}
                          </span>
                        )}

                        {submission.isAutoSubmitted && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Auto-submitted
                          </span>
                        )}

                      </div>
                    </div>

                    {/* Score / Pending */}
                    <div className="text-right flex-shrink-0">

                      {isPublished ? (
                        <>
                          <div
                            className={`text-2xl font-black ${
                              isPassed
                                ? "text-emerald-600"
                                : "text-red-500"
                            }`}
                          >
                            {pct}%
                          </div>

                          <div className="text-xs text-slate-500 mt-0.5">
                            {submission.totalScore}/
                            {submission.totalMarks}
                            {" • "}
                            {grade}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-lg font-bold text-amber-600">
                            Result Pending
                          </div>

                          <div className="text-xs text-slate-500 mt-0.5">
                            Awaiting publication
                          </div>
                        </>
                      )}

                    </div>

                  </div>

                  {/* Progress */}
                  {isPublished ? (

                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">

                      <div
                        className={`h-full rounded-full ${
                          isPassed
                            ? "bg-emerald-500"
                            : "bg-red-400"
                        }`}
                        style={{
                          width: `${pct}%`,
                        }}
                      />

                    </div>

                  ) : (

                    <div className="mt-3 h-1.5 w-full rounded-full bg-amber-50">
                      <div className="h-full w-full rounded-full bg-amber-200" />
                    </div>

                  )}

                  {/* Stats */}
                  {isPublished ? (

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">

                      <span className="text-emerald-600">
                        ✓ {correctAnswers} correct
                      </span>

                      <span className="text-red-500">
                        ✗ {wrongAnswers} wrong
                      </span>

                      <span className="text-slate-400">
                        – {skippedAnswers} skipped
                      </span>

                    </div>

                  ) : (

                    <div className="mt-2 text-xs text-amber-600">
                      Your result is being reviewed by the administrator.
                    </div>

                  )}

                </div>

              </div>
            );

            /*
             * VERY IMPORTANT:
             *
             * Pending result is NOT a link.
             * Published result is clickable.
             */

            if (isPublished) {
              return (
                <Link
                  key={submission._id.toString()}
                  href={`/student/results/${submission._id}`}
                  className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={submission._id.toString()}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                {content}
              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}