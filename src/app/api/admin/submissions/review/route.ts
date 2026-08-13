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

    const {
      submissionId,
      questionId,
      marks,
      feedback,
    } = await request.json();

    const submission = await Submission.findById(
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

    

    const answer = submission.answers.find(
      (a: any) =>
        a.questionId.toString() === questionId
    );

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          message: "Question not found",
        },
        {
          status: 404,
        }
      );
    }

     const maxMarks = Number(
  answer.maxMarks || 0
);

const obtainedMarks =
  Number(marks);

  if (Number.isNaN(obtainedMarks)) {
  return NextResponse.json(
    {
      success: false,
      message: "Invalid marks.",
    },
    {
      status: 400,
    }
  );
}

if (obtainedMarks < 0) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Marks cannot be negative.",
    },
    {
      status: 400,
    }
  );
}

if (obtainedMarks > maxMarks) {
  return NextResponse.json(
    {
      success: false,
      message:
        `Marks cannot be greater than ${maxMarks}.`,
    },
    {
      status: 400,
    }
  );
}

    answer.obtainedMarks =
  obtainedMarks;

answer.checked = true;

answer.feedback =
  feedback || "";

    submission.totalScore =
      submission.answers.reduce(
        (sum: number, item: any) =>
          sum + (item.obtainedMarks || 0),
        0
      );

    const allChecked =
  submission.answers.every(
    (a: any) => a.checked
  );

submission.status = allChecked
  ? "checked"
  : "checking";

    await submission.save();

    return NextResponse.json({
      success: true,
      totalScore: submission.totalScore,
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