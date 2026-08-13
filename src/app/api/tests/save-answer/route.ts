import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";

import TestAttempt from "@/models/TestAttempt";

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
        },
        { status: 401 }
      );
    }

    await connectDB();

    const body =
      await request.json();

    const {
      testId,
      answers,
      currentQuestion,
    } = body;

    const now = new Date();

const attempt =
  await TestAttempt.findOneAndUpdate(
    {
      student: user.id,
      test: testId,
    },
    {
      answers,

      currentQuestion,

      lastSavedAt: now,

      lastActivityAt: now,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

    return NextResponse.json({
      success: true,
      attempt,
    });
  } catch (e) {
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