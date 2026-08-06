import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";
import { getTodayAttendanceDate } from "@/lib/attendanceDate";

import Attendance from "@/models/Attendance";
import Student from "@/models/Student";
import WorkingDay from "@/models/WorkingDay";

export async function GET(request: NextRequest) {
  try {
    // ======================================================
    // 1. AUTHENTICATION
    // ======================================================

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

    // ======================================================
    // 2. FIND STUDENT
    // ======================================================

    const student = await Student.findById(user.id)
      .select("name studentId status course batch")
      .lean();

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found.",
        },
        { status: 404 }
      );
    }

    // ======================================================
    // 3. TODAY'S DATE
    // ======================================================

    const today = getTodayAttendanceDate();

    const nextDate = new Date(today);

    nextDate.setUTCDate(
      nextDate.getUTCDate() + 1
    );

    // ======================================================
    // 4. FIND CALENDAR RULES FOR THIS STUDENT
    // ======================================================

    const calendarRecords = await WorkingDay.find({
      date: {
        $gte: today,
        $lt: nextDate,
      },

      $or: [
        {
          course: "All",
          batch: "All",
        },

        {
          course: student.course,
          batch: "All",
        },

        {
          course: "All",
          batch: student.batch,
        },

        {
          course: student.course,
          batch: student.batch,
        },
      ],
    }).lean();

    // ======================================================
    // 5. PICK MOST SPECIFIC RULE
    // ======================================================

    const getPriority = (
      course: string,
      batch: string
    ) => {
      // Exact course + exact batch
      if (
        course === student.course &&
        batch === student.batch
      ) {
        return 4;
      }

      // Exact course + all batches
      if (
        course === student.course &&
        batch === "All"
      ) {
        return 3;
      }

      // All courses + exact batch
      if (
        course === "All" &&
        batch === student.batch
      ) {
        return 2;
      }

      // All courses + all batches
      return 1;
    };

    calendarRecords.sort(
      (a, b) =>
        getPriority(b.course, b.batch) -
        getPriority(a.course, a.batch)
    );

    const calendarRule =
      calendarRecords[0] || null;

    // ======================================================
    // 6. DETERMINE TODAY'S DAY TYPE
    // ======================================================

    const isSunday =
      today.getUTCDay() === 0;

    let attendanceAllowed = true;

    let dayType:
      | "working_day"
      | "holiday"
      | "sunday" = "working_day";

    let dayTitle = "Working Day";

    // ----------------------------------------------
    // Admin-defined holiday
    // ----------------------------------------------

    if (calendarRule?.type === "holiday") {
      attendanceAllowed = false;

      dayType = "holiday";

      dayTitle =
        calendarRule.title ||
        "Institute Holiday";
    }

    // ----------------------------------------------
    // Normal Sunday
    // ----------------------------------------------

    else if (
      isSunday &&
      calendarRule?.type !== "working_day"
    ) {
      attendanceAllowed = false;

      dayType = "sunday";

      dayTitle = "Sunday";
    }

    // ----------------------------------------------
    // Special working day
    // ----------------------------------------------

    else if (
      calendarRule?.type === "working_day"
    ) {
      attendanceAllowed = true;

      dayType = "working_day";

      dayTitle =
        calendarRule.title ||
        "Working Day";
    }

    // ======================================================
    // 7. FIND TODAY'S ATTENDANCE
    // ======================================================

    const attendance = await Attendance.findOne({
      studentId: user.id,
      date: today,
    }).lean();

    // ======================================================
    // 8. NOT MARKED
    // ======================================================

    if (!attendance) {
      return NextResponse.json({
        success: true,

        marked: false,

        attendance: null,

        attendanceAllowed,

        dayType,

        dayTitle,
      });
    }

    // ======================================================
    // 9. ALREADY MARKED
    // ======================================================

    return NextResponse.json({
      success: true,

      marked: true,

      attendanceAllowed,

      dayType,

      dayTitle,

      attendance: {
        id: attendance._id.toString(),

        date: attendance.date,

        checkInTime:
          attendance.checkInTime,

        status:
          attendance.status,

        distance:
          attendance.distance,
      },
    });
  } catch (error) {
    console.error(
      "Get today's attendance error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to get attendance status.",
      },
      { status: 500 }
    );
  }
}