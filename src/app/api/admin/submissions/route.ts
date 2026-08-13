import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";

import Submission from "@/models/Submission";

import Student from "@/models/Student";
import Test from "@/models/Test";

console.log("Student model loaded:", Student.modelName);
console.log("Test model loaded:", Test.modelName);

export async function GET(request: NextRequest) {
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

    const submissions = await Submission.find()
      .populate("studentId", "name email")
      .populate("testId", "title totalMarks")
      .sort({
        submittedAt: -1,
      })
      .lean();

    const data = submissions.map((submission: any) => ({
      _id: submission._id.toString(),

      status: submission.status,

      totalScore: submission.totalScore,

      totalMarks: submission.totalMarks,

      submittedAt: submission.submittedAt,

      student: submission.studentId,

      test: submission.testId,
    }));

    return NextResponse.json({
      success: true,
      submissions: data,
    });
  } catch (err) {
    console.error(err);

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