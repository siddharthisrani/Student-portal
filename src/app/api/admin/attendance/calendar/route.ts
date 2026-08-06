import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";

import WorkingDay from "@/models/WorkingDay";

// -----------------------------------------
// Validation
// -----------------------------------------

const workingDaySchema = z.object({
  date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be YYYY-MM-DD"
  ),

  type: z.enum([
    "working_day",
    "holiday",
  ]),

  title: z
    .string()
    .max(150)
    .optional()
    .default(""),

  course: z
    .string()
    .optional()
    .default("All"),

  batch: z
    .string()
    .optional()
    .default("All"),
});

// -----------------------------------------
// Convert YYYY-MM-DD → UTC date
// -----------------------------------------

function parseDate(dateString: string) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );
}

// =========================================
// GET
// Get calendar configuration
// =========================================

export async function GET(
  request: NextRequest
) {
  try {
    const user =
      getAuthUserFromRequest(request);

    if (
      !user ||
      user.role !== "admin"
    ) {
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

    const { searchParams } =
      new URL(request.url);

    const month =
      searchParams.get("month");

    const year =
      searchParams.get("year");

    const query: Record<
      string,
      unknown
    > = {};

    // Example:
    // ?month=8&year=2026

    if (month && year) {
      const monthNumber =
        Number(month);

      const yearNumber =
        Number(year);

      if (
        monthNumber < 1 ||
        monthNumber > 12 ||
        !Number.isInteger(
          yearNumber
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid month or year.",
          },
          {
            status: 400,
          }
        );
      }

      const startDate =
        new Date(
          Date.UTC(
            yearNumber,
            monthNumber - 1,
            1
          )
        );

      const endDate =
        new Date(
          Date.UTC(
            yearNumber,
            monthNumber,
            1
          )
        );

      query.date = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const days =
      await WorkingDay.find(
        query
      )
        .sort({
          date: 1,
          course: 1,
          batch: 1,
        })
        .lean();

    return NextResponse.json({
      success: true,
      days,
    });
  } catch (error) {
    console.error(
      "Get attendance calendar error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load attendance calendar.",
      },
      {
        status: 500,
      }
    );
  }
}

// =========================================
// POST
// Create/update calendar day
// =========================================

export async function POST(
  request: NextRequest
) {
  try {
    const user =
      getAuthUserFromRequest(request);

    if (
      !user ||
      user.role !== "admin"
    ) {
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

    const body =
      await request.json();

    const validation =
      workingDaySchema.safeParse(
        body
      );

    if (
      !validation.success
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            validation.error
              .issues[0]?.message ||
            "Invalid data",
        },
        {
          status: 400,
        }
      );
    }

    await connectDB();

    const {
      date,
      type,
      title,
      course,
      batch,
    } = validation.data;

    const parsedDate =
      parseDate(date);

    // ---------------------------------------
    // Create OR update
    // ---------------------------------------

    const day =
      await WorkingDay.findOneAndUpdate(
        {
          date: parsedDate,
          course,
          batch,
        },
        {
          $set: {
            type,
            title,
            createdBy: user.id,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

    return NextResponse.json({
      success: true,
      message:
        type === "holiday"
          ? "Holiday saved successfully."
          : "Working day saved successfully.",
      day,
    });
  } catch (error) {
    console.error(
      "Save attendance calendar error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to save calendar day.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const user =
      getAuthUserFromRequest(request);

    if (
      !user ||
      user.role !== "admin"
    ) {
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

    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Calendar record ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const deleted =
      await WorkingDay.findByIdAndDelete(
        id
      );

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Calendar record not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Calendar configuration removed.",
    });
  } catch (error) {
    console.error(
      "Delete calendar error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete calendar record.",
      },
      {
        status: 500,
      }
    );
  }
}