import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";
import TestAttempt from "@/models/TestAttempt";
import Test from "@/models/Test";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user || user.role !== "student") {
      return NextResponse.json(
        { success: false },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    const test = await Test.findById(id);

    if (!test) {
      return NextResponse.json(
        {
          success: false,
          message: "Test not found",
        },
        { status: 404 }
      );
    }

    let attempt = await TestAttempt.findOne({
      student: user.id,
      test: id,
    });

  if (!attempt) {

  return NextResponse.json(
    {
      success: false,
      message: "Test has not been started.",
    },
    {
      status: 404,
    }
  );

}

    const elapsed =
      Math.floor(
        (Date.now() -
          attempt.startedAt.getTime()) /
          1000
      );

    const remaining =
      Math.max(
        0,
        test.duration * 60 - elapsed
      );

    return NextResponse.json({
      success: true,
      remainingTime: remaining,
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );

  }
}