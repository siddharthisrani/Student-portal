import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";
import { getAuthUserFromRequest } from "@/lib/auth";
import { isInsideDNDCRadius } from "@/lib/attendance";

import Attendance from "@/models/Attendance";
import Student from "@/models/Student";

export async function POST(request: NextRequest) {
  try {
    // 1. Check login
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

    // 2. Read student's current location
    const body = await request.json();

const latitude = Number(body.latitude);
const longitude = Number(body.longitude);
const accuracy = Number(body.accuracy);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid location is required.",
        },
        { status: 400 }
      );
    }

    // Basic coordinate validation
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid location coordinates.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    if (!Number.isFinite(accuracy) || accuracy > 150) {
  return NextResponse.json(
    {
      success: false,
      message:
        "Location accuracy is too low. Please enable precise location and try again.",
    },
    { status: 400 }
  );
}

    // 3. Make sure student exists and is active
    const student = await Student.findById(user.id)
      .select("name studentId status")
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

    // 4. Check DNDC location radius
    const locationResult = isInsideDNDCRadius(
      latitude,
      longitude
    );

    if (!locationResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `You are outside the DNDC attendance area. You are approximately ${locationResult.distance} metres away.`,
          distance: locationResult.distance,
        },
        { status: 403 }
      );
    }

    // 5. Use today's date as attendance date
    const now = new Date();

    const attendanceDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // 6. Check existing attendance
    const existingAttendance = await Attendance.findOne({
      studentId: user.id,
      date: attendanceDate,
    }).lean();

    if (existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          alreadyMarked: true,
          message: "Attendance already marked for today.",
          attendance: {
            checkInTime: existingAttendance.checkInTime,
            status: existingAttendance.status,
          },
        },
        { status: 409 }
      );
    }

    // 7. Create attendance
    const attendance = await Attendance.create({
      studentId: user.id,

      date: attendanceDate,

      checkInTime: now,

      latitude,
      longitude,

      distance: locationResult.distance,

      status: "present",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Attendance marked successfully.",
        attendance: {
          id: attendance._id.toString(),
          date: attendance.date,
          checkInTime: attendance.checkInTime,
          status: attendance.status,
          distance: attendance.distance,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Mark attendance error:", error);

    // Handles duplicate attendance if two requests happen together
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
          message: "Attendance already marked for today.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to mark attendance. Please try again.",
      },
      { status: 500 }
    );
  }
}