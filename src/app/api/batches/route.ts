import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";
import Student from "@/models/Student";

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const course =
      new URL(request.url).searchParams.get("course");

    if (!course) {
      return NextResponse.json({
        success: true,
        batches: [],
      });
    }

    const batches = await Student.distinct(
      "batch",
      {
        course,
        status: "active",
      }
    );

    batches.sort();

    return NextResponse.json({
      success: true,
      batches,
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