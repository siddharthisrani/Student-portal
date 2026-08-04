import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";

import Student from "@/models/Student";
import Test from "@/models/Test";
import Question from "@/models/Question";
import Submission from "@/models/Submission";

import TestEngine from "@/components/test/TestEngine";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Test | DNDC Student Portal",
};

interface Props {
  params: Promise<{
    testId: string;
  }>;
}

export default async function TestPage({ params }: Props) {
  const { testId } = await params;

  const user = await getAuthUser();

  if (!user) redirect("/login");

  await connectDB();

  const student = await Student.findById(user.id).lean();

  if (!student) redirect("/login");

  const test = await Test.findById(testId).lean();

  if (!test) {
    notFound();
  }

  // Prevent opening another course test

  const studentCourse = (student as any).course;

  if (
    test.course !== "All" &&
    test.course !== studentCourse
  ) {
    notFound();
  }

  // Only published tests

  if (test.status !== "published") {
    notFound();
  }

  // Already submitted?

  const existingSubmission = await Submission.findOne({
    testId,
    studentId: user.id,
  });

  if (existingSubmission) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <div className="max-w-md text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>

          <h2 className="text-xl font-bold">
            Test Already Submitted
          </h2>

          <p className="mt-2 text-slate-500">
            You have already completed this test.
          </p>

          <Link
            href={`/student/results/${existingSubmission._id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            View Result

            <ArrowRight className="h-4 w-4" />
          </Link>

        </div>
      </div>
    );
  }

  const questions = await Question.find({
    testId,
  })
    .sort({
      order: 1,
    })
    .lean();

  if (!questions.length) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <div className="max-w-md text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>

          <h2 className="text-xl font-bold">
            No Questions Found
          </h2>

          <p className="mt-2 text-slate-500">
            This test doesn't contain any questions.
          </p>

        </div>
      </div>
    );
  }

  const testData = {
    _id: test._id.toString(),
    title: test.title,
    description: test.description,
    duration: test.duration,
    totalMarks: test.totalMarks,
    totalQuestions: test.totalQuestions,
    passingMarks: test.passingMarks,
    instructions: test.instructions,
  };

  const questionData = questions.map((q: any) => ({
    _id: q._id.toString(),
    type: q.type,
    question: q.question,
    options: q.options,
    marks: q.marks,
    imageUrl: q.imageUrl,
    pdfUrl: q.pdfUrl,
    order: q.order,
  }));

  return (
    <TestEngine
      test={testData}
      questions={questionData}
    />
  );
}