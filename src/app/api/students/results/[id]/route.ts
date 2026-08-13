import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";

import Submission from "@/models/Submission";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
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

    const { id } = await params;

    const submission =
      await Submission.findById(id)

        .populate(
          "testId",
          "title duration totalMarks"
        )

        .populate(
          "answers.questionId"
        )

        .lean();

    if (!submission) {

      return NextResponse.json(
        {
          success: false,
          message:
            "Result not found.",
        },
        {
          status: 404,
        }
      );

    }

    // Student can only open his own result

    if (
      submission.studentId.toString() !==
      user.id
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

    const correctAnswers =
  submission.answers.filter(
    (a: any) =>
      a.obtainedMarks === a.maxMarks &&
      a.maxMarks > 0
  ).length;

const wrongAnswers =
  submission.answers.filter((a: any) => {

    const skipped =
      a.answer === null ||
      a.answer === undefined ||
      (typeof a.answer === "string" &&
        a.answer.trim() === "");

    return !skipped && a.obtainedMarks === 0;

  }).length;

const skippedAnswers =
  submission.answers.filter((a: any) => {

    if (a.answer === null || a.answer === undefined)
      return true;

    if (typeof a.answer === "string")
      return a.answer.trim() === "";

    if (Array.isArray(a.answer))
      return a.answer.length === 0;

    return false;

  }).length;

const result = {

      _id:
        submission._id.toString(),

      status:
        submission.status,

      totalScore:
        submission.totalScore,

      totalMarks:
        submission.totalMarks,

      passingMarks:
        submission.passingMarks,

      correctAnswers,

wrongAnswers,

skippedAnswers,

    submittedAt:
  submission.submittedAt?.toISOString(),

      test: {
        _id:
          (submission.testId as any)?._id?.toString(),

        title:
          (submission.testId as any)?.title,
      },

      answers:
        submission.answers.map(
          (answer: any) => ({

            questionId: {

              _id:
                answer.questionId._id.toString(),

              type:
                answer.questionId.type,

              question:
                answer.questionId.question,

              options:
                answer.questionId.options,

              correctAnswer:
                answer.questionId.correctAnswer,

              language:
                answer.questionId.language,

              starterCode:
                answer.questionId.starterCode,

              sampleInput:
                answer.questionId.sampleInput,

              sampleOutput:
                answer.questionId.sampleOutput,

            },

            answer:
              answer.answer,

            obtainedMarks:
              answer.obtainedMarks,

            maxMarks:
              answer.maxMarks,

            checked:
              answer.checked,

            feedback:
              answer.feedback,

          })
        ),

    };

    return NextResponse.json({

      success: true,

      submission: result,

    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Server Error",
      },
      {
        status: 500,
      }
    );

  }
}