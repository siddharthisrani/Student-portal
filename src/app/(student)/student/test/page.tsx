import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";

import Student from "@/models/Student";
import Test from "@/models/Test";
import Submission from "@/models/Submission";

import {
  BookOpen,
  Clock,
  CheckCircle2,
  PlayCircle,
  Calendar,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Today's Tests | DNDC Student Portal",
};

export default async function StudentTestsPage() {
  const user = await getAuthUser();

  if (!user) redirect("/login");

  await connectDB();

  const student = await Student.findById(user.id).lean();

  if (!student) redirect("/login");

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

  const tests = await Test.find({
    status: "published",
    date: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
    course: {
      $in: [(student as any).course, "All"],
    },
  })
    .sort({ createdAt: -1 })
    .lean();

  const submissions = await Submission.find({
    studentId: user.id,
  }).lean();

  const submittedIds = new Set(
    submissions.map((s: any) => s.testId.toString())
  );

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Today's Tests
        </h1>

        <p className="text-slate-500 mt-1">
          Complete all assigned tests for today.
        </p>
      </div>

      {tests.length === 0 && (
        <div className="rounded-xl border bg-white p-10 text-center">

          <Calendar className="mx-auto h-12 w-12 text-slate-400" />

          <h2 className="mt-4 text-xl font-semibold">
            No Tests Today
          </h2>

          <p className="mt-2 text-slate-500">
            There are no tests scheduled for today.
          </p>

        </div>
      )}

      <div className="grid gap-5">

        {tests.map((test: any) => {

          const completed = submittedIds.has(test._id.toString());

          return (

            <div
              key={test._id}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >

              <div className="flex items-start justify-between">

                <div>

                  <h2 className="text-xl font-bold">
                    {test.title}
                  </h2>

                  <p className="mt-1 text-slate-500">
                    {test.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-4 text-sm">

                    <div className="flex items-center gap-2">

                      <BookOpen className="h-4 w-4" />

                      {test.totalQuestions} Questions

                    </div>

                    <div className="flex items-center gap-2">

                      <Clock className="h-4 w-4" />

                      {test.duration} Minutes

                    </div>

                    <div>

                      Total Marks :
                      <span className="font-semibold ml-1">
                        {test.totalMarks}
                      </span>

                    </div>

                  </div>

                </div>

                {completed ? (

                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">

                    Completed

                  </span>

                ) : (

                  <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">

                    Pending

                  </span>

                )}

              </div>

              <div className="mt-6">

                {completed ? (

                  <Link
                    href={`/student/results/${
                      submissions.find(
                        (s: any) =>
                          s.testId.toString() === test._id.toString()
                      )?._id
                    }`}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
                  >

                    <CheckCircle2 className="h-4 w-4" />

                    View Result

                  </Link>

                ) : (

                  <Link
                    href={`/student/test/${test._id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
                  >

                    <PlayCircle className="h-4 w-4" />

                    Start Test

                    <ArrowRight className="h-4 w-4" />

                  </Link>

                )}

              </div>

            </div>

          );
        })}
      </div>
    </div>
  );
}