import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";

import Student from "@/models/Student";
import WorkingDay from "@/models/WorkingDay";

function getIndiaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(
    parts.find((p) => p.type === "year")?.value
  );

  const month = Number(
    parts.find((p) => p.type === "month")?.value
  );

  const day = Number(
    parts.find((p) => p.type === "day")?.value
  );

  return new Date(
    Date.UTC(year, month - 1, day)
  );
}

export async function GET(request: NextRequest) {
  try {
    const user =
      getAuthUserFromRequest(request);

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

    const student = await Student.findById(
      user.id
    )
      .select("course batch")
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

    const today = getIndiaToday();

    const sevenDaysLater = new Date(today);

    sevenDaysLater.setUTCDate(
      sevenDaysLater.getUTCDate() + 8
    );

    // Get applicable holiday records

    const holidays = await WorkingDay.find({
      type: "holiday",

      date: {
        $gte: today,
        $lt: sevenDaysLater,
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
    })
      .sort({
        date: 1,
      })
      .lean();

    if (holidays.length === 0) {
      return NextResponse.json({
        success: true,
        notice: null,
      });
    }

    /*
      If multiple rules exist for the same date,
      prefer the most specific one.
    */

    const firstDate =
      holidays[0].date
        .toISOString()
        .split("T")[0];

    const sameDateHolidays =
      holidays.filter(
        (holiday) =>
          holiday.date
            .toISOString()
            .split("T")[0] === firstDate
      );

    const priority = (
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

    sameDateHolidays.sort(
      (a, b) =>
        priority(b.course, b.batch) -
        priority(a.course, a.batch)
    );

    const holiday =
      sameDateHolidays[0];

    const millisecondsPerDay =
      1000 * 60 * 60 * 24;

    const daysAway = Math.round(
      (holiday.date.getTime() -
        today.getTime()) /
        millisecondsPerDay
    );

    let type:
      | "today"
      | "tomorrow"
      | "upcoming";

    if (daysAway === 0) {
      type = "today";
    } else if (daysAway === 1) {
      type = "tomorrow";
    } else {
      type = "upcoming";
    }

    return NextResponse.json({
      success: true,

      notice: {
        type,

        title:
          holiday.title ||
          "Institute Holiday",

        date:
          holiday.date
            .toISOString()
            .split("T")[0],

        daysAway,
      },
    });
  } catch (error) {
    console.error(
      "Attendance notice error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load attendance notice.",
      },
      {
        status: 500,
      }
    );
  }
}