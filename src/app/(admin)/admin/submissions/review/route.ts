import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";
import Submission from "@/models/Submission";

export async function POST(request: NextRequest) {
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

    await connectDB();

    const body = await request.json();

    const {
      submissionId,
      questionId,
      marks,
      feedback,
    } = body;

    const submission =
      await Submission.findById(
        submissionId
      );

    if (!submission) {
      return NextResponse.json(
        {
          success: false,
          message: "Submission not found",
        },
        {
          status: 404,
        }
      );
    }

    const answer =
      submission.answers.find(
        (a: any) =>
          a.questionId.toString() ===
          questionId
      );

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          message: "Answer not found",
        },
        {
          status: 404,
        }
      );
    }

    // Prevent invalid marks
    answer.obtainedMarks = Math.max(
      0,
      Math.min(
        Number(marks),
        answer.maxMarks
      )
    );

    answer.feedback = feedback ?? "";

    answer.checked = true;

    // Recalculate total score
    submission.totalScore =
      submission.answers.reduce(
        (sum: number, ans: any) =>
          sum + (ans.obtainedMarks || 0),
        0
      );

    await submission.save();

    return NextResponse.json({
      success: true,
      totalScore:
        submission.totalScore,
    });

  } catch (error) {

    console.error(
      "Review Save Error:",
      error
    );

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