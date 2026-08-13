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

    // -----------------------
    // Check Pending Questions
    // -----------------------

    const pending =
      submission.answers.filter(
        (a: any) => !a.checked
      );

    if (pending.length > 0) {

      return NextResponse.json(
        {
          success: false,
          message:
            "Some questions are still unchecked.",
        },
        {
          status: 400,
        }
      );

    }

    submission.status =
      "published";

    submission.checkedAt =
      new Date();

    submission.checkedBy =
  new mongoose.Types.ObjectId(user.id);

    submission.totalScore =
      submission.answers.reduce(
        (sum: number, a: any) =>
          sum + a.obtainedMarks,
        0
      );

    await submission.save();

    return NextResponse.json({
      success: true,
      message:
        "Result published successfully.",
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