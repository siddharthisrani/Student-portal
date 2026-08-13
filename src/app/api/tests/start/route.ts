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

    if (!user || user.role !== "student") {
      return NextResponse.json(
        {
          success: false,
        },
        {
          status: 401,
        }
      );
    }

    await connectDB();

    const { testId } =
      await request.json();

    let attempt =
      await TestAttempt.findOne({
        student: user.id,
        test: testId,
      });

    if (!attempt) {

      attempt =
        await TestAttempt.create({

          student: user.id,

          test: testId,

          startedAt: new Date(),

          status: "in_progress",

        });

    }

    return NextResponse.json({

      success: true,

      attempt,

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