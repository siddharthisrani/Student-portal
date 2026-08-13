import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";

import Test from "@/models/Test";
import TestAttempt from "@/models/TestAttempt";
import Submission from "@/models/Submission";
import Question from "@/models/Question";

export async function POST(
  request: NextRequest
) {
  try {
    const user =
      getAuthUserFromRequest(request);

    if (
      !user ||
      user.role !== "student"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    // ==================================================
    // REQUEST BODY
    // ==================================================

    const body =
      await request.json();

    const {
      testId,
      answers,
      autoSubmitted = false,
    } = body;

    console.log(
      "Submit request:",
      {
        testId,
        autoSubmitted,
        answers,
      }
    );

    // ==================================================
    // FIND TEST
    // ==================================================

    const test =
      await Test.findById(testId);

    if (!test) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Test not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // ALREADY SUBMITTED?
    // ==================================================

    const existingSubmission =
      await Submission.findOne({
        testId,
        studentId: user.id,
      });

    if (existingSubmission) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Test already submitted.",
        },
        {
          status: 400,
        }
      );
    }

    // ==================================================
    // FIND ATTEMPT
    // ==================================================

    const attempt =
      await TestAttempt.findOne({
        student: user.id,
        test: testId,
      });

    if (!attempt) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attempt not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // FIND QUESTIONS
    // ==================================================

    const questions =
      await Question.find({
        testId,
      })
        .sort({
          order: 1,
        })
        .lean();

    // ==================================================
    // BUILD SUBMISSION ANSWERS
    // ==================================================

    const submissionAnswers =
      questions.map(
        (question: any) => {

          /*
           * IMPORTANT:
           *
           * 1. Use the latest answers sent
           *    directly from TestEngine.
           *
           * 2. If not available, use MongoDB
           *    TestAttempt answers.
           *
           * 3. Otherwise null.
           *
           * This fixes the auto-submit null issue.
           */

          const studentAnswer =
            answers?.[
              question._id.toString()
            ] ??
            attempt.answers?.[
              question._id.toString()
            ] ??
            null;

          let obtainedMarks = 0;

          let checked = false;

          // ==================================================
          // MCQ AUTO CHECK
          // ==================================================

          if (
            question.type === "mcq" ||
            question.type ===
              "image_mcq" ||
            question.type ===
              "pdf_mcq"
          ) {
            checked = true;

            if (
              studentAnswer ===
              question.correctAnswer
            ) {
              obtainedMarks =
                question.marks;
            }
          }

          return {
            questionId:
              question._id,

            answer:
              studentAnswer,

            obtainedMarks,

            maxMarks:
              question.marks,

            checked,

            feedback: "",
          };
        }
      );

    // ==================================================
    // TIME
    // ==================================================

    const startedAt =
      attempt.startedAt ||
      new Date();

    const submittedAt =
      new Date();

    const timeTaken =
      Math.floor(
        (submittedAt.getTime() -
          startedAt.getTime()) /
          1000
      );

    // ==================================================
    // TOTAL SCORE
    // ==================================================

    const totalScore =
      submissionAnswers.reduce(
        (
          sum,
          answer
        ) =>
          sum +
          answer.obtainedMarks,
        0
      );

    // ==================================================
    // STATUS
    // ==================================================

    const allQuestionsChecked =
      submissionAnswers.every(
        (answer) =>
          answer.checked
      );

    // ==================================================
    // CREATE SUBMISSION
    // ==================================================

    const submission =
      await Submission.create({

        testId,

        studentId:
          user.id,

        answers:
          submissionAnswers,

        totalMarks:
          test.totalMarks,

        totalScore,

        passingMarks:
          test.passingMarks,

        startedAt,

        submittedAt,

        timeTaken,

        /*
         * NOW THIS IS CORRECT.
         */
        isAutoSubmitted:
          Boolean(
            autoSubmitted
          ),

        status:
          allQuestionsChecked
            ? "checked"
            : "submitted",
      });

    // ==================================================
    // LOCK ATTEMPT
    // ==================================================

    attempt.status =
      "submitted";

    attempt.submittedAt =
      submittedAt;

    /*
     * Also save the latest answers
     * into the attempt before locking it.
     *
     * This gives us an additional backup.
     */
    if (answers) {
      attempt.answers =
        answers;
    }

    await attempt.save();

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json({
      success: true,

      submission: {
        _id:
          submission._id.toString(),

        isAutoSubmitted:
          submission.isAutoSubmitted,

        totalScore:
          submission.totalScore,

        totalMarks:
          submission.totalMarks,
      },
    });

  } catch (error) {

    console.error(
      "Submit Test Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}