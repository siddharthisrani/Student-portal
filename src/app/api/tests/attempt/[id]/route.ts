import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";
import TestAttempt from "@/models/TestAttempt";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

  const attempt = await TestAttempt.findOne({
  student: user.id,
  test: id,
});

if (!attempt) {
  return NextResponse.json({
    success: true,
    attempt: null,
  });
}

if (attempt.status === "submitted") {
  return NextResponse.json({
    success: false,
    submitted: true,
    message: "Test already submitted.",
  });
}

return NextResponse.json({
  success: true,
  attempt,
});
  } catch {
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}