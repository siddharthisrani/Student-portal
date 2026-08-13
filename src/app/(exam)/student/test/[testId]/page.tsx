import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";

import Student from "@/models/Student";
import Test from "@/models/Test";
import Question from "@/models/Question";
import Submission from "@/models/Submission";

import TestEngine from "@/components/test/engine/TestEngine";

export const metadata: Metadata = {
  title: "Test | DNDC Student Portal",
};

interface Props {
  params: Promise<{
    testId: string;
  }>;
}

export default async function TestPage({
  params,
}: Props) {
  const { testId } = await params;

  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  await connectDB();

  const student = await Student.findById(user.id).lean();

  if (!student) {
    redirect("/login");
  }

  const test = await Test.findById(testId).lean();

  if (!test) {
    notFound();
  }

  // Student can only open his course test

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

  // Already submitted

  const existingSubmission =
    await Submission.findOne({
      testId,
      studentId: user.id,
    }).lean();

  if (existingSubmission) {
    redirect(
      `/student/results/${existingSubmission._id}`
    );
  }

  const questions = await Question.find({
    testId,
  })
    .sort({
      order: 1,
    })
    .lean();

  if (questions.length === 0) {
    notFound();
  }

  // -----------------------------
  // Plain Test Object
  // -----------------------------

  const testData = {
    _id: test._id.toString(),

    title: test.title,

    description: test.description,

    duration: test.duration,

    totalMarks: test.totalMarks,

    totalQuestions: test.totalQuestions,

    passingMarks: test.passingMarks,

    instructions: test.instructions,

    course: test.course,

    status: test.status,
  };

  // -----------------------------
  // Plain Questions
  // -----------------------------

 const questionData = questions.map((q: any) => ({
  _id: q._id.toString(),

  testId: q.testId?.toString(),

  type: q.type,

  question: q.question,

  marks: q.marks,

  order: q.order,

  options: q.options ?? [],

  // Don't send correctAnswer to students
  // correctAnswer: q.correctAnswer ?? "",

  imageUrl: q.imageUrl ?? "",

  pdfUrl: q.pdfUrl ?? "",

  language: q.language ?? "javascript",

  starterCode: q.starterCode ?? "",

  sampleInput: q.sampleInput ?? "",

  sampleOutput: q.sampleOutput ?? "",

  boilerplateCode: q.boilerplateCode ?? "",

  // SQL


  // Excel / Dataset
  excelTemplate: q.excelTemplate ?? "",

  tableName: q.tableName ?? "",

  dataFileUrl: q.dataFileUrl ?? "",

  dataFileName: q.dataFileName ?? "",

  dataFileType: q.dataFileType ?? "",

  // Upload
  allowedExtensions: q.allowedExtensions ?? [],

  maxFileSize: q.maxFileSize ?? 10,
}));

  return (
    <TestEngine
      test={{
        ...testData,
        questions: questionData,
      }}
    />
  );
}