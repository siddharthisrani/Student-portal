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

    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") || "";
    const course = searchParams.get("course") || "All";

    const query: any = {
      status: "active",
    };

    if (course !== "All") {
      query.course = course;
    }

    if (q.trim()) {
      query.$or = [
        {
          name: {
            $regex: q,
            $options: "i",
          },
        },
        {
          studentId: {
            $regex: q,
            $options: "i",
          },
        },
      ];
    }

    const students = await Student.find(query)
      .select("_id name studentId batch course")
      .sort({ name: 1 })
      .limit(30)
      .lean();

    return NextResponse.json({
      success: true,
      students,
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