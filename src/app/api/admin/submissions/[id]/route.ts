import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";
import mongoose from "mongoose";

import Submission from "@/models/Submission";
import Question from "@/models/Question";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user || user.role !== "admin") {
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

    const { id } = await params;

    await connectDB();

    const submission = await Submission.findById(id)
      .populate("testId")
      .populate("studentId")
      .populate("answers.questionId")
      .lean();

    if (!submission) {
      return NextResponse.json(
        {
          success: false,
          message: "Submission not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error(
      "GET submission error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load submission.",
      },
      {
        status: 500,
      }
    );
  }
}


export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {

    /* --------------------------------
       AUTH
    -------------------------------- */

    const user =
      getAuthUserFromRequest(request);

    if (
      !user ||
      user.role !== "admin"
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

    const { id } = await context.params;

    const body = await request.json();

    const {
      answers = [],
      action = "save",
      feedback = "",
    } = body;

    /* --------------------------------
       FIND SUBMISSION
    -------------------------------- */

    const submission =
      await Submission.findById(id);

    if (!submission) {
      return NextResponse.json(
        {
          success: false,
          message: "Submission not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* --------------------------------
       PREVENT EDITING AFTER PUBLISH
    -------------------------------- */

    if (
      submission.status === "published"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Published result cannot be edited.",
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------
       GET QUESTIONS
    -------------------------------- */

    const questions =
      await Question.find({
        testId: submission.testId,
      }).lean();

    const questionMap =
      new Map(
        questions.map((question: any) => [
          question._id.toString(),
          question,
        ])
      );

    /* --------------------------------
       VALIDATE ANSWERS
    -------------------------------- */

    let totalScore = 0;

    const updatedAnswers =
      submission.answers.map(
        (existingAnswer: any) => {

          const questionId =
            existingAnswer.questionId.toString();

          const question =
            questionMap.get(questionId);

          /*
           * Always use Question.marks
           * as the real maximum.
           */

          const maxMarks = Number(
            question?.marks ??
            existingAnswer.maxMarks ??
            0
          );

          const incomingAnswer =
            answers.find(
              (answer: any) =>
                answer.questionId?.toString() ===
                questionId
            );

          let obtainedMarks =
            incomingAnswer?.obtainedMarks ??
            existingAnswer.obtainedMarks ??
            0;

          obtainedMarks =
            Number(obtainedMarks);

          /* -----------------------------
             SERVER-SIDE VALIDATION
          ----------------------------- */

          if (
            Number.isNaN(obtainedMarks)
          ) {
            obtainedMarks = 0;
          }

          if (obtainedMarks < 0) {
  throw new Error(
    `Marks cannot be negative for question "${question?.question || questionId}".`
  );
}

          if (
            obtainedMarks > maxMarks
          ) {
            throw new Error(
              `Invalid marks for question "${question?.question || questionId}". Maximum allowed marks are ${maxMarks}.`
            );
          }

          totalScore += obtainedMarks;

          return {
            ...existingAnswer.toObject(),

            /*
             * IMPORTANT:
             * Keep student's original answer.
             */
            answer:
              existingAnswer.answer,

            /*
             * Always store actual question marks.
             */
            maxMarks,

            obtainedMarks,

            checked:
              incomingAnswer?.checked ??
              existingAnswer.checked,

            feedback:
              incomingAnswer?.feedback ??
              existingAnswer.feedback ??
              "",
          };
        }
      );

    /* --------------------------------
       TOTAL SCORE SAFETY
    -------------------------------- */

    if (
      totalScore < 0
    ) {
      totalScore = 0;
    }

    if (
      totalScore >
      submission.totalMarks
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Total score cannot exceed total marks.",
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------
       CHECK ALL QUESTIONS
    -------------------------------- */

    const allChecked =
      updatedAnswers.every(
        (answer: any) =>
          answer.checked === true
      );

    /* --------------------------------
       STATUS
    -------------------------------- */

    let status:
      | "submitted"
      | "checking"
      | "checked"
      | "published";

    if (action === "publish") {

      /*
       * Do not publish incomplete checking.
       */

      if (!allChecked) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Please check all questions before publishing the result.",
          },
          {
            status: 400,
          }
        );
      }

      status = "published";

    } else {

      status =
        allChecked
          ? "checked"
          : "checking";
    }

    /* --------------------------------
       UPDATE
    -------------------------------- */

    submission.answers =
      updatedAnswers;

    submission.totalScore =
      totalScore;

    submission.feedback =
      typeof feedback === "string"
        ? feedback
        : submission.feedback;

    submission.status =
      status;

   if (allChecked) {
  submission.checkedAt = new Date();

  submission.checkedBy =
    new mongoose.Types.ObjectId(user.id);
}

    await submission.save();

    /* --------------------------------
       RESPONSE
    -------------------------------- */

    return NextResponse.json({
      success: true,

      message:
        status === "published"
          ? "Result published successfully."
          : "Draft saved successfully.",

      submission,
    });

  } catch (error: any) {

    console.error(
      "Admin Submission Update Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Failed to update submission.",
      },
      {
        status: 500,
      }
    );
  }
}