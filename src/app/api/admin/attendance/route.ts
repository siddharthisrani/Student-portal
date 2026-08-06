import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";
import { getTodayAttendanceDate } from "@/lib/attendanceDate";

import Attendance from "@/models/Attendance";
import Student from "@/models/Student";
import WorkingDay from "@/models/WorkingDay";

// ======================================================
// Helper: Convert YYYY-MM-DD into UTC midnight
// ======================================================

function parseSelectedDate(dateString: string) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  return new Date(
    Date.UTC(year, month - 1, day)
  );
}

// ======================================================
// Helper: Compare two dates without time
// ======================================================

function getDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

// ======================================================
// GET ADMIN ATTENDANCE
// ======================================================

export async function GET(request: NextRequest) {
  try {
    // --------------------------------------------------
    // 1. Authentication
    // --------------------------------------------------

    const user = getAuthUserFromRequest(request);

    if (!user || user.role !== "admin") {
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
    // 2. Query parameters
    // --------------------------------------------------

    const { searchParams } = new URL(request.url);

    const course =
      searchParams.get("course") || "";

    const batch =
      searchParams.get("batch") || "";

    const search =
      searchParams.get("search") || "";

    const selectedDate =
      searchParams.get("date");

    // --------------------------------------------------
    // 3. Determine attendance date
    // --------------------------------------------------

    let attendanceDate: Date;

    if (selectedDate) {
      const datePattern =
        /^\d{4}-\d{2}-\d{2}$/;

      if (!datePattern.test(selectedDate)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid date format.",
          },
          {
            status: 400,
          }
        );
      }

      attendanceDate =
        parseSelectedDate(selectedDate);

      const [year, month, day] =
        selectedDate
          .split("-")
          .map(Number);

      // Prevent invalid dates such as 2026-02-31
      if (
        attendanceDate.getUTCFullYear() !== year ||
        attendanceDate.getUTCMonth() !==
          month - 1 ||
        attendanceDate.getUTCDate() !== day
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid date.",
          },
          {
            status: 400,
          }
        );
      }
    } else {
      attendanceDate =
        getTodayAttendanceDate();
    }

    // --------------------------------------------------
    // 4. Prevent future attendance lookup
    // --------------------------------------------------

    const today =
      getTodayAttendanceDate();

    if (attendanceDate > today) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Future attendance cannot be viewed.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------
    // 5. Determine calendar rule
    // --------------------------------------------------

    /*
      Default:

      Monday - Saturday = working day
      Sunday = non-working day

      WorkingDay collection can override this.
    */

    const dayOfWeek =
      attendanceDate.getUTCDay();

    const isSunday =
      dayOfWeek === 0;

    // --------------------------------------------------
    // Find institute-wide calendar configuration
    // --------------------------------------------------

    const calendarConfig =
      await WorkingDay.findOne({
        date: attendanceDate,
        course: "All",
        batch: "All",
      }).lean();

    let dayStatus:
      | "working_day"
      | "holiday"
      | "non_working_day";

    let dayTitle = "";

    if (
      calendarConfig?.type === "holiday"
    ) {
      dayStatus = "holiday";

      dayTitle =
        calendarConfig.title ||
        "Institute Holiday";
    } else if (
      calendarConfig?.type === "working_day"
    ) {
      dayStatus = "working_day";

      dayTitle =
        calendarConfig.title ||
        "Special Working Day";
    } else if (isSunday) {
      dayStatus =
        "non_working_day";

      dayTitle = "Sunday";
    } else {
      dayStatus =
        "working_day";

      dayTitle =
        "Regular Working Day";
    }

    // --------------------------------------------------
    // 6. Student query
    // --------------------------------------------------

    const studentQuery: Record<
      string,
      unknown
    > = {
      status: "active",
    };

    if (
      course &&
      course !== "All"
    ) {
      studentQuery.course =
        course;
    }

    if (
      batch &&
      batch !== "All"
    ) {
      studentQuery.batch =
        batch;
    }

    if (search.trim()) {
      studentQuery.$or = [
        {
          name: {
            $regex:
              search.trim(),
            $options: "i",
          },
        },

        {
          studentId: {
            $regex:
              search.trim(),
            $options: "i",
          },
        },

        {
          email: {
            $regex:
              search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // --------------------------------------------------
    // 7. Get students
    // --------------------------------------------------

    const students =
      await Student.find(
        studentQuery
      )
        .select(
          "name email phone studentId course batch avatar status"
        )
        .sort({
          name: 1,
        })
        .lean();

    const studentIds =
      students.map(
        (student) =>
          student._id
      );

    // --------------------------------------------------
    // 8. Get attendance records
    // --------------------------------------------------

    const attendanceRecords =
      await Attendance.find({
        studentId: {
          $in: studentIds,
        },

        date: attendanceDate,
      }).lean();

    // --------------------------------------------------
    // 9. Create attendance lookup
    // --------------------------------------------------

    const attendanceMap =
      new Map(
        attendanceRecords.map(
          (record) => [
            record.studentId.toString(),
            record,
          ]
        )
      );

    // --------------------------------------------------
    // 10. Determine whether selected date is today
    // --------------------------------------------------

    const isToday =
      getDateKey(attendanceDate) ===
      getDateKey(today);

    // --------------------------------------------------
    // 11. Build student attendance status
    // --------------------------------------------------

    const studentAttendance =
      students.map(
        (student) => {
          const attendance =
            attendanceMap.get(
              student._id.toString()
            );

          let attendanceStatus:
            | "present"
            | "absent"
            | "not_marked"
            | "holiday"
            | "non_working_day";

          // --------------------------------------------
          // Attendance exists = PRESENT
          // --------------------------------------------

          if (attendance) {
            attendanceStatus =
              "present";
          }

          // --------------------------------------------
          // Holiday
          // --------------------------------------------

          else if (
            dayStatus ===
            "holiday"
          ) {
            attendanceStatus =
              "holiday";
          }

          // --------------------------------------------
          // Sunday / non-working
          // --------------------------------------------

          else if (
            dayStatus ===
            "non_working_day"
          ) {
            attendanceStatus =
              "non_working_day";
          }

          // --------------------------------------------
          // Today but hasn't marked yet
          // --------------------------------------------

          else if (isToday) {
            attendanceStatus =
              "not_marked";
          }

          // --------------------------------------------
          // Past working day
          // --------------------------------------------

          else {
            attendanceStatus =
              "absent";
          }

          return {
            id:
              student._id.toString(),

            name:
              student.name,

            email:
              student.email,

            phone:
              student.phone,

            studentId:
              student.studentId,

            course:
              student.course,

            batch:
              student.batch,

            avatar:
              student.avatar,

            attendanceStatus,

            attendance: attendance
              ? {
                  id:
                    attendance._id.toString(),

                  checkInTime:
                    attendance.checkInTime,

                  distance:
                    attendance.distance,

                  latitude:
                    attendance.latitude,

                  longitude:
                    attendance.longitude,
                }
              : null,
          };
        }
      );

    // --------------------------------------------------
    // 12. Calculate stats
    // --------------------------------------------------

    const totalStudents =
      students.length;

    const present =
      studentAttendance.filter(
        (student) =>
          student.attendanceStatus ===
          "present"
      ).length;

    const absent =
      studentAttendance.filter(
        (student) =>
          student.attendanceStatus ===
          "absent"
      ).length;

    const notMarked =
      studentAttendance.filter(
        (student) =>
          student.attendanceStatus ===
          "not_marked"
      ).length;

    const holiday =
      studentAttendance.filter(
        (student) =>
          student.attendanceStatus ===
          "holiday"
      ).length;

    const nonWorking =
      studentAttendance.filter(
        (student) =>
          student.attendanceStatus ===
          "non_working_day"
      ).length;

    // --------------------------------------------------
    // 13. Available filters
    // --------------------------------------------------

    const courses =
      await Student.distinct(
        "course",
        {
          status: "active",
        }
      );

    const batches =
      await Student.distinct(
        "batch",
        {
          status: "active",
        }
      );

    // --------------------------------------------------
    // 14. Response
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      date:
        attendanceDate,

      day: {
        status:
          dayStatus,

        title:
          dayTitle,

        isToday,
      },

      stats: {
        totalStudents,
        present,
        absent,
        notMarked,
        holiday,
        nonWorking,
      },

      students:
        studentAttendance,

      filters: {
        courses,
        batches,
      },
    });
  } catch (error) {
    console.error(
      "Admin attendance error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load attendance data.",
      },
      {
        status: 500,
      }
    );
  }
}