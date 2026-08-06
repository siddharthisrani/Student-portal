import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";
import { isInsideDNDCRadius } from "@/lib/attendance";
import { getTodayAttendanceDate } from "@/lib/attendanceDate";

import Attendance from "@/models/Attendance";
import Student from "@/models/Student";
import WorkingDay from "@/models/WorkingDay";

export async function POST(request: NextRequest) {
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

    if (student.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is inactive.",
        },
        { status: 403 }
      );
    }

    // ======================================================
    // 3. TODAY'S ATTENDANCE DATE
    // ======================================================

    const attendanceDate = getTodayAttendanceDate();

    const nextDate = new Date(attendanceDate);

    nextDate.setUTCDate(
      nextDate.getUTCDate() + 1
    );

    // ======================================================
    // 4. CHECK CALENDAR RULES
    // ======================================================

    const calendarRecords = await WorkingDay.find({
      date: {
        $gte: attendanceDate,
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
    // 5. FIND MOST SPECIFIC CALENDAR RULE
    // ======================================================

    const getPriority = (
      course: string,
      batch: string
    ) => {
      if (
        course === student.course &&
        batch === student.batch
      ) {
        return 4;
      }

      if (
        course === student.course &&
        batch === "All"
      ) {
        return 3;
      }

      if (
        course === "All" &&
        batch === student.batch
      ) {
        return 2;
      }

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
    // 6. BLOCK HOLIDAYS
    // ======================================================

    if (calendarRule?.type === "holiday") {
      return NextResponse.json(
        {
          success: false,
          code: "HOLIDAY",

          message: `${
            calendarRule.title ||
            "Institute Holiday"
          } — attendance is not required today.`,
        },
        { status: 403 }
      );
    }

    // ======================================================
    // 7. BLOCK NORMAL SUNDAYS
    // ======================================================

    const isSunday =
      attendanceDate.getUTCDay() === 0;

    /*
      Sunday normally = OFF

      But if admin created:
      type: working_day

      then attendance is allowed.
    */

    if (
      isSunday &&
      calendarRule?.type !== "working_day"
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "NON_WORKING_DAY",

          message:
            "Today is a non-working day. Attendance is not required.",
        },
        { status: 403 }
      );
    }

    // ======================================================
    // 8. CHECK IF ALREADY MARKED
    // ======================================================

    const existingAttendance =
      await Attendance.findOne({
        studentId: user.id,
        date: attendanceDate,
      }).lean();

    if (existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          alreadyMarked: true,

          message:
            "Attendance already marked for today.",

          attendance: {
            checkInTime:
              existingAttendance.checkInTime,

            status:
              existingAttendance.status,
          },
        },
        { status: 409 }
      );
    }

    // ======================================================
    // 9. READ LOCATION
    // ======================================================

    const body = await request.json();

    const latitude = Number(
      body.latitude
    );

    const longitude = Number(
      body.longitude
    );

    const accuracy = Number(
      body.accuracy
    );

    // ======================================================
    // 10. VALIDATE LOCATION
    // ======================================================

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid location is required.",
        },
        { status: 400 }
      );
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid location coordinates.",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 11. CHECK GPS ACCURACY
    // ======================================================

    if (
      !Number.isFinite(accuracy) ||
      accuracy > 150
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Location accuracy is too low. Please enable precise location and try again.",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 12. CHECK DNDC LOCATION RADIUS
    // ======================================================

    const locationResult =
      isInsideDNDCRadius(
        latitude,
        longitude
      );

    if (!locationResult.allowed) {
      return NextResponse.json(
        {
          success: false,

          message: `You are outside the DNDC attendance area. You are approximately ${locationResult.distance} metres away.`,

          distance:
            locationResult.distance,
        },
        { status: 403 }
      );
    }

    // ======================================================
    // 13. CREATE ATTENDANCE
    // ======================================================

    const now = new Date();

    const attendance =
      await Attendance.create({
        studentId: user.id,

        date: attendanceDate,

        checkInTime: now,

        latitude,
        longitude,

        distance:
          locationResult.distance,

        status: "present",
      });

    // ======================================================
    // SUCCESS
    // ======================================================

    return NextResponse.json(
      {
        success: true,

        message:
          "Attendance marked successfully.",

        attendance: {
          id: attendance._id.toString(),

          date:
            attendance.date,

          checkInTime:
            attendance.checkInTime,

          status:
            attendance.status,

          distance:
            attendance.distance,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error(
      "Mark attendance error:",
      error
    );

    // ======================================================
    // DUPLICATE PROTECTION
    // ======================================================

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          alreadyMarked: true,

          message:
            "Attendance already marked for today.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,

        message:
          "Unable to mark attendance. Please try again.",
      },
      { status: 500 }
    );
  }
}