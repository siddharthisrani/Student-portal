import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";

import Submission from "@/models/Submission";
import mongoose from "mongoose";

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

    const { submissionId } =
      await request.json();

    const submission =
      await Submission.findById(
        submissionId
      );

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

    // ----------------------------------
    // Check every question is reviewed
    // ----------------------------------

    const allChecked =
      submission.answers.every(
        (answer: any) =>
          answer.checked === true
      );

    if (!allChecked) {
      return NextResponse.json(
        {
          success: false,
          message:
            "All questions must be checked before publishing.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------
    // Validate marks
    // ----------------------------------

    const invalidAnswer =
      submission.answers.find(
        (answer: any) => {
          const marks = Number(
            answer.obtainedMarks || 0
          );

          const maxMarks = Number(
            answer.maxMarks || 0
          );

          return (
            marks < 0 ||
            marks > maxMarks
          );
        }
      );

    if (invalidAnswer) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more questions have invalid marks.",
        },
        {
          status: 400,
        }
      );
    }

    // ----------------------------------
    // Calculate final score
    // ----------------------------------

    submission.totalScore =
      submission.answers.reduce(
        (sum: number, answer: any) =>
          sum +
          Number(
            answer.obtainedMarks || 0
          ),
        0
      );

    // ----------------------------------
    // Publish
    // ----------------------------------

    submission.status =
      "published";

    submission.checkedAt =
      new Date();

    submission.checkedBy =
      new mongoose.Types.ObjectId(
        user.id
      );

    await submission.save();

    return NextResponse.json({
      success: true,
      message:
        "Result published successfully.",
    });

  } catch (error) {
    console.error(
      "Publish Result Error:",
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