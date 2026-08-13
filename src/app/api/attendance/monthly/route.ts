import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";

import Attendance from "@/models/Attendance";
import WorkingDay from "@/models/WorkingDay";
import Student from "@/models/Student";

// ======================================================
// Helpers
// ======================================================

function dateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function getIndiaTodayParts() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());

  return {
    year: Number(
      parts.find((part) => part.type === "year")?.value
    ),
    month: Number(
      parts.find((part) => part.type === "month")?.value
    ),
    day: Number(
      parts.find((part) => part.type === "day")?.value
    ),
  };
}

// ======================================================
// GET MONTHLY ATTENDANCE
// ======================================================

export async function GET(request: NextRequest) {
  try {
    // --------------------------------------------------
    // Authentication
    // --------------------------------------------------

    const user = getAuthUserFromRequest(request);

    if (!user || user.role !== "student") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    await connectDB();

    // --------------------------------------------------
    // Student
    // --------------------------------------------------

    const student = await Student.findById(user.id)
      .select("name studentId course batch status createdAt")
      .lean();

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found.",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------
    // Month / year
    // --------------------------------------------------

    const { searchParams } = new URL(request.url);

    const indiaToday = getIndiaTodayParts();

    const month = Number(
      searchParams.get("month") || indiaToday.month
    );

    const year = Number(
      searchParams.get("year") || indiaToday.year
    );

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2020 ||
      year > 2100
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid month or year.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // Month boundaries
    // --------------------------------------------------

    const monthStart = new Date(
      Date.UTC(year, month - 1, 1)
    );

    const monthEnd = new Date(
      Date.UTC(year, month, 1)
    );

    // Today's normalized date

    const today = new Date(
      Date.UTC(
        indiaToday.year,
        indiaToday.month - 1,
        indiaToday.day
      )
    );

    // --------------------------------------------------
    // Do not calculate future days
    // --------------------------------------------------

    let calculationEnd = monthEnd;

    if (
      year === indiaToday.year &&
      month === indiaToday.month
    ) {
      calculationEnd = new Date(
        Date.UTC(
          indiaToday.year,
          indiaToday.month - 1,
          indiaToday.day + 1
        )
      );
    }

    // Entire future month

    if (monthStart > today) {
      calculationEnd = monthStart;
    }

    // --------------------------------------------------
    // Get calendar overrides
    // --------------------------------------------------

    const calendarRecords = await WorkingDay.find({
      date: {
        $gte: monthStart,
        $lt: monthEnd,
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

    // --------------------------------------------------
    // Build calendar lookup
    // --------------------------------------------------

    /*
      More specific configuration should override
      institute-wide configuration.

      Priority:

      course + batch
      course + All
      All + batch
      All + All
    */

    const calendarMap = new Map<
      string,
      (typeof calendarRecords)[number]
    >();

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

    for (const record of calendarRecords) {
      const key = dateKey(record.date);

      const existing = calendarMap.get(key);

      if (!existing) {
        calendarMap.set(key, record);
        continue;
      }

      if (
        getPriority(record.course, record.batch) >
        getPriority(existing.course, existing.batch)
      ) {
        calendarMap.set(key, record);
      }
    }

    // --------------------------------------------------
    // Attendance records
    // --------------------------------------------------

    const attendanceRecords = await Attendance.find({
      studentId: user.id,

      date: {
        $gte: monthStart,
        $lt: monthEnd,
      },
    }).lean();

    const attendanceMap = new Map(
      attendanceRecords.map((record) => [
        dateKey(record.date),
        record,
      ])
    );

    // --------------------------------------------------
    // Build monthly history
    // --------------------------------------------------

    const history: {
      date: string;
      status:
        | "present"
        | "absent"
        | "not_marked"
        | "holiday"
        | "non_working_day";
      title: string;
      checkInTime: Date | null;
      distance: number | null;
    }[] = [];

    let workingDays = 0;
    let presentDays = 0;
    let absentDays = 0;

   // --------------------------------------------------
    // Student joining date
    // --------------------------------------------------

    const joinedDate = new Date(student.createdAt);

    const joinedDay = new Date(
      Date.UTC(
        joinedDate.getUTCFullYear(),
        joinedDate.getUTCMonth(),
        joinedDate.getUTCDate()
      )
    );

    /* 
     * NEW: Set the official launch date for the attendance system.
     * Month is 0-indexed in Date.UTC (7 = August).
     * Set to August 14, 2026.
     */
    const SYSTEM_START_DATE = new Date(Date.UTC(2026, 7, 14));

    // --------------------------------------------------
    // Loop through month
    // --------------------------------------------------

    for (
      let current = new Date(monthStart);
      current < calculationEnd;
      current.setUTCDate(current.getUTCDate() + 1)
    ) {
      const currentDate = new Date(current);

      // FIX: Skip dates before the student joined OR before the system launched
      if (currentDate < joinedDay || currentDate < SYSTEM_START_DATE) {
        continue;
      }

      const key = dateKey(currentDate);

      const calendar = calendarMap.get(key);

      const attendance = attendanceMap.get(key);

      const isSunday =
        currentDate.getUTCDay() === 0;

      const isToday =
        key === dateKey(today);

      // --------------------------------------------
      // Explicit holiday
      // --------------------------------------------

      if (calendar?.type === "holiday") {
        history.push({
          date: key,
          status: "holiday",
          title:
            calendar.title ||
            "Institute Holiday",
          checkInTime: null,
          distance: null,
        });

        continue;
      }

      // --------------------------------------------
      // Sunday unless explicitly working
      // --------------------------------------------

      if (
        isSunday &&
        calendar?.type !== "working_day"
      ) {
        history.push({
          date: key,
          status: "non_working_day",
          title: "Sunday",
          checkInTime: null,
          distance: null,
        });

        continue;
      }

      // --------------------------------------------
      // Working day
      // --------------------------------------------

      workingDays++;

      // Attendance exists

      if (attendance) {
        presentDays++;

        history.push({
          date: key,
          status: "present",
          title:
            calendar?.type === "working_day"
              ? calendar.title || "Special Working Day"
              : "Working Day",
          checkInTime:
            attendance.checkInTime,
          distance:
            attendance.distance ?? null,
        });

        continue;
      }

      // Today has not ended yet

      if (isToday) {
        history.push({
          date: key,
          status: "not_marked",
          title: "Attendance pending",
          checkInTime: null,
          distance: null,
        });

        continue;
      }

      // Past working day

      absentDays++;

      history.push({
        date: key,
        status: "absent",
        title: "Absent",
        checkInTime: null,
        distance: null,
      });
    }

    // --------------------------------------------------
    // Attendance percentage
    // --------------------------------------------------

    /*
      IMPORTANT:

      Today's "not marked" attendance should NOT yet
      reduce the percentage because the day is still
      in progress.
    */

    const completedWorkingDays =
      presentDays + absentDays;

    const attendancePercentage =
      completedWorkingDays > 0
        ? Math.round(
            (presentDays / completedWorkingDays) * 100
          )
        : 0;

    // --------------------------------------------------
    // Response
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      month,
      year,

      student: {
        id: student._id.toString(),
        name: student.name,
        studentId: student.studentId,
        course: student.course,
        batch: student.batch,
      },

      summary: {
        workingDays,
        completedWorkingDays,
        presentDays,
        absentDays,

        pendingDays:
          workingDays -
          completedWorkingDays,

        attendancePercentage,
      },

      // Newest first
      history: history.reverse(),
    });
  } catch (error) {
    console.error(
      "Monthly attendance error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load monthly attendance.",
      },
      {
        status: 500,
      }
    );
  }
}