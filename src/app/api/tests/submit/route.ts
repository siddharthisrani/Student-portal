import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";

import Test from "@/models/Test";
import TestAttempt from "@/models/TestAttempt";
import Submission from "@/models/Submission";
import Question from "@/models/Question";
import Student from "@/models/Student";

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user || user.role !== "student") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { testId, answers, autoSubmitted = false } = body;

   const [student, test] = await Promise.all([
  Student.findById(user.id)
    .select("name email")
    .lean(),

  Test.findById(testId)
    .select("title totalMarks passingMarks")
    .lean(),
]);

if (!student) {
  return NextResponse.json(
    {
      success: false,
      message: "Student not found.",
    },
    { status: 404 }
  );
}

if (!test) {
  return NextResponse.json(
    {
      success: false,
      message: "Test not found.",
    },
    { status: 404 }
  );
}

    // 1. Check if an actual submission exists
    const existingSubmission = await Submission.findOne({
      testId,
      studentId: user.id,
    });

    // 2. Grab their attempt record
    const attempt = await TestAttempt.findOne({
      student: user.id,
      test: testId,
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, message: "Attempt not found." },
        { status: 404 }
      );
    }

    if (existingSubmission) {
      if (attempt.status !== "submitted") {
        await TestAttempt.updateOne(
          { _id: attempt._id },
          { $set: { status: "submitted" } }
        );
      }
      return NextResponse.json(
        { success: false, message: "Test already submitted." },
        { status: 400 }
      );
    }

    // ==================================================
    // BUILD SUBMISSION ANSWERS
    // ==================================================
    const questions = await Question.find({ testId }).sort({ order: 1 }).lean();

   const latestAnswers =
  answers &&
  typeof answers === "object"
    ? {
        ...(attempt.answers || {}),
        ...answers,
      }
    : attempt.answers || {};

const submissionAnswers = questions.map((question: any) => {
  const studentAnswer =
    latestAnswers[question._id.toString()] ?? null;

      let obtainedMarks = 0;
      let checked = false;

      // Auto-grade MCQs
      if (
        question.type === "mcq" ||
        question.type === "image_mcq" ||
        question.type === "pdf_mcq"
      ) {
        checked = true;
        if (studentAnswer === question.correctAnswer) {
          obtainedMarks = question.marks;
        }
      }

      return {
        questionId: question._id,
        answer: studentAnswer,
        obtainedMarks,
        maxMarks: question.marks,
        checked,
        feedback: "",
      };
    });

    const startedAt = attempt.startedAt || new Date();
    const submittedAt = new Date();
    const timeTaken = Math.floor(
      (submittedAt.getTime() - startedAt.getTime()) / 1000
    );

    const totalScore = submissionAnswers.reduce(
      (sum, answer) => sum + answer.obtainedMarks,
      0
    );

    const allQuestionsChecked = submissionAnswers.every((a) => a.checked);

    // ==================================================
    // SAVE TO BOTH MODELS SAFELY
    // ==================================================
    
    // 1. Create the final Submission
    const submission = await Submission.create({
      testId,
      studentId: user.id,
      studentName: student.name || "",
  studentEmail: student.email || "",
  testTitle: test.title || "",
      answers: submissionAnswers,
      totalMarks: test.totalMarks,
      totalScore,
      passingMarks: test.passingMarks,
      startedAt,
      submittedAt,
      timeTaken,
      isAutoSubmitted: Boolean(autoSubmitted),
      status: allQuestionsChecked ? "checked" : "submitted",
    });

    // 2. Lock the Attempt and back up the final answers into it
    await TestAttempt.updateOne(
  { _id: attempt._id },
  {
    $set: {
      status: "submitted",
      submittedAt,
      answers: latestAnswers,
      lastSavedAt: submittedAt,
      lastActivityAt: submittedAt,
    },
  }
);

    return NextResponse.json({
      success: true,
      submission: {
        _id: submission._id.toString(),
        isAutoSubmitted: submission.isAutoSubmitted,
        totalScore: submission.totalScore,
        totalMarks: submission.totalMarks,
      },
    });

  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Test already submitted." },
        { status: 400 }
      );
    }

    console.error("Submit Test Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}