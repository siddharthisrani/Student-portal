import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";
import Attendance from "@/models/Attendance";

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user || user.role !== "student") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    await connectDB();

    // Optional month/year query:
    // /api/attendance/history?month=8&year=2026
    const { searchParams } = new URL(request.url);

    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    const query: Record<string, unknown> = {
      studentId: user.id,
    };

    // Filter by month if month/year are provided
    if (
      Number.isInteger(month) &&
      Number.isInteger(year) &&
      month >= 1 &&
      month <= 12 &&
      year >= 2020
    ) {
      const startDate = new Date(
        Date.UTC(year, month - 1, 1)
      );

      const endDate = new Date(
        Date.UTC(year, month, 1)
      );

      query.date = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .lean();

    const attendance = records.map((record) => ({
      id: record._id.toString(),
      date: record.date,
      checkInTime: record.checkInTime,
      status: record.status,
      distance: record.distance,
    }));

    return NextResponse.json({
      success: true,
      total: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Attendance history error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load attendance history.",
      },
      { status: 500 }
    );
  }
}