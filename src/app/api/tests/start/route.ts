import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";

import TestAttempt from "@/models/TestAttempt";
import Submission from "@/models/Submission";
import Student from "@/models/Student";
import Test from "@/models/Test";

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user || user.role !== "student") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const { testId } = await request.json();

    if (!testId) {
      return NextResponse.json(
        {
          success: false,
          message: "Test ID is required.",
        },
        { status: 400 }
      );
    }

    const [student, test] = await Promise.all([
  Student.findById(user.id).select("name email").lean(),
  Test.findById(testId).select("title").lean(),
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

    

   let attempt = await TestAttempt.findOne({
  student: user.id,
  test: testId,
});

// ---------------------------------------------
// NO ATTEMPT = FIRST TIME
// ---------------------------------------------

if (!attempt) {
  const now = new Date();

  attempt = await TestAttempt.create({
    student: user.id,
    test: testId,

    studentName: student.name || "",
    studentEmail: student.email || "",
    testTitle: test.title || "",

    startedAt: now,
    status: "in_progress",

    answers: {},

    currentQuestion: 0,

    warnings: 0,
    tabWarnings: 0,
    fullscreenWarnings: 0,

    remainingTime: 0,

    lastSavedAt: now,
    lastActivityAt: now,
  });

  return NextResponse.json({
    success: true,
    alreadySubmitted: false,
    status: "in_progress",
    attempt,
  });
}

// ---------------------------------------------
// EXISTING ATTEMPT
// ---------------------------------------------

// Make sure old attempts also get the
// student/test information.

let identificationChanged = false;

if (attempt.studentName !== (student.name || "")) {
  attempt.studentName = student.name || "";
  identificationChanged = true;
}

if (attempt.studentEmail !== (student.email || "")) {
  attempt.studentEmail = student.email || "";
  identificationChanged = true;
}

if (attempt.testTitle !== (test.title || "")) {
  attempt.testTitle = test.title || "";
  identificationChanged = true;
}

if (identificationChanged) {
  await attempt.save();
}

   // ---------------------------------------------
// ALREADY SUBMITTED
// ---------------------------------------------

if (attempt.status === "submitted") {

  const submission = await Submission.findOne({
    studentId: user.id,
    testId,
  });

  // ---------------------------------------------
  // Submission exists
  // ---------------------------------------------
  // Test was genuinely submitted.
  // Student cannot attempt it again.
  // ---------------------------------------------

  if (submission) {
    return NextResponse.json({
      success: true,

      alreadySubmitted: true,

      status: "submitted",

      hasSubmission: true,

      attempt,

      message:
        "This test has already been submitted and is pending evaluation.",
    });
  }

  // ---------------------------------------------
  // Submission does NOT exist
  // ---------------------------------------------
  // Admin has deleted the submission.
  // Reset the old attempt and allow a fresh test.
  // ---------------------------------------------

  const now = new Date();

  attempt.status = "in_progress";

  attempt.startedAt = now;

  attempt.submittedAt = undefined;

  attempt.answers = {};

  attempt.currentQuestion = 0;

  attempt.warnings = 0;

  attempt.tabWarnings = 0;

  attempt.fullscreenWarnings = 0;

  attempt.remainingTime = 0;

  attempt.lastSavedAt = now;

  attempt.lastActivityAt = now;

  await attempt.save();

  return NextResponse.json({
    success: true,

    alreadySubmitted: false,

    status: "in_progress",

    hasSubmission: false,

    attempt,

    message:
      "Previous submission was removed. Test can be attempted again.",
  });
}

    // ---------------------------------------------
    // EXISTING IN-PROGRESS ATTEMPT
    // ---------------------------------------------

    return NextResponse.json({
      success: true,

      alreadySubmitted: false,

      status: "in_progress",

      attempt,
    });

  } catch (error) {
    console.error("Start Test Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to start test.",
      },
      { status: 500 }
    );
  }
}