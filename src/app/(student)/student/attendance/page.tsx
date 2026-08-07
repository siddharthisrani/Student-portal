"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  CalendarDays,
  Clock,
  ShieldCheck,
} from "lucide-react";


type AttendanceResult = {
  success: boolean;
  message: string;
  alreadyMarked?: boolean;
  attendance?: {
    id?: string;
    date?: string;
    checkInTime?: string;
    status?: string;
    distance?: number;
  };
  
};

type TodayAttendanceResponse = {
  success: boolean;
  marked: boolean;

  attendance: {
    id: string;
    date: string;
    checkInTime: string;
    status: string;
    distance: number;
  } | null;

  attendanceAllowed: boolean;

  dayType:
    | "working_day"
    | "holiday"
    | "sunday";

  dayTitle: string;

  message?: string;
};



import MonthlyAttendance from "@/components/student/MonthlyAttendance";
import AttendanceNotice from "@/components/student/AttendanceNotice";

export default function AttendancePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [refreshMonthly, setRefreshMonthly] = useState(0);


  const [attendance, setAttendance] =
    useState<AttendanceResult["attendance"] | null>(null);
    const [checkingToday, setCheckingToday] = useState(true);

  const [permission, setPermission] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");

  const [attendanceAllowed, setAttendanceAllowed] =
  useState(true);

const [dayType, setDayType] =
  useState<"working_day" | "holiday" | "sunday">(
    "working_day"
  );

const [dayTitle, setDayTitle] =
  useState("Working Day");

  // Check existing browser permission without asking for permission
  useEffect(() => {
    async function checkPermission() {
      try {
        if (!navigator.permissions) return;

        const result = await navigator.permissions.query({
          name: "geolocation",
        });

        setPermission(result.state);

        result.onchange = () => {
          setPermission(result.state);
        };
      } catch {
        setPermission("unknown");
      }
    }

    checkPermission();
  }, []);

 

  const markAttendance = () => {
    if (!attendanceAllowed) {
  return;
}
    setMessage("");
    setError(false);

    if (!navigator.geolocation) {
      setError(true);
      setMessage(
        "Location is not supported by your browser."
      );
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          console.log("Attendance location:", {
            latitude,
            longitude,
            accuracy,
          });

          /*
           * Accuracy is measured in metres.
           *
           * A very inaccurate reading can accidentally place the
           * student inside/outside the attendance radius.
           */
          if (accuracy > 150) {
            setError(true);
            setMessage(
              "Your location accuracy is too low. Turn on precise location/GPS and try again."
            );
            setLoading(false);
            return;
          }

          const response = await fetch("/api/attendance/mark", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude,
              longitude,
              accuracy,
            }),
          });

          const data: AttendanceResult = await response.json();

          if (!response.ok) {
            if (data.alreadyMarked && data.attendance) {
              setAttendance(data.attendance);
            }

            setError(true);
            setMessage(
              data.message || "Unable to mark attendance."
            );

            setLoading(false);
            return;
          }

          setAttendance(data.attendance || null);



          setError(false);
          setMessage(
            data.message || "Attendance marked successfully."
          );
          setRefreshMonthly((prev) => prev + 1);
        } catch (err) {
          console.error("Attendance error:", err);

          setError(true);
          setMessage(
            "Something went wrong while marking attendance."
          );
        } finally {
          setLoading(false);
        }
      },

      (locationError) => {
        console.error("Location error:", locationError);

        setLoading(false);
        setError(true);

        switch (locationError.code) {
          case locationError.PERMISSION_DENIED:
            setMessage(
              "Location permission is blocked. Please allow location access for this website."
            );
            break;

          case locationError.POSITION_UNAVAILABLE:
            setMessage(
              "Your current location could not be detected. Turn on GPS and try again."
            );
            break;

          case locationError.TIMEOUT:
            setMessage(
              "Location detection took too long. Please try again."
            );
            break;

          default:
            setMessage(
              "Unable to access your current location."
            );
        }
      },

      {
        enableHighAccuracy: true,

        // Don't reuse an old GPS position
        maximumAge: 0,

        timeout: 15000,
      }
    );
  };

  const marked = !!attendance;

  useEffect(() => {
  async function getTodayAttendance() {
    try {
      const response = await fetch("/api/attendance/today", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok && data.success) {
  setAttendanceAllowed(
    data.attendanceAllowed ?? true
  );

  setDayType(
    data.dayType ?? "working_day"
  );

  setDayTitle(
    data.dayTitle ?? "Working Day"
  );

  if (data.marked && data.attendance) {
    setAttendance(data.attendance);
  } else {
    setAttendance(null);
  }
}

      if (!response.ok) {
        console.error("Today attendance error:", data);
        return;
      }

      if (data.marked && data.attendance) {
        setAttendance(data.attendance);
      }
    } catch (error) {
      console.error("Unable to load today's attendance:", error);
    } finally {
      setCheckingToday(false);
    }
  }

  getTodayAttendance();
}, []);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      
      <AttendanceNotice />

      {/* Heading */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Attendance
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Mark your attendance when you are at the DNDC center.
        </p>
      </div>

      {/* Main Attendance Card */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 p-6 text-white sm:p-8">

          <div className="flex items-start justify-between gap-4">

            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                {marked ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <MapPin className="h-6 w-6" />
                )}
              </div>

              <p className="text-sm font-medium text-white/70">
                Today's Attendance
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {marked
                  ? "Attendance Marked"
                  : "Ready to Check In"}
              </h2>
            </div>

            <div
              className={`rounded-full px-3 py-1.5 text-[10px] sm:text-xs font-semibold ${
                marked
                  ? "bg-emerald-400/20 text-emerald-100"
                  : "bg-white/15 text-white"
              }`}
            >
              {marked ? "PRESENT" : "NOT MARKED"}
            </div>
          </div>

          {!marked && (
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/75">
              Your current location will be verified before
              attendance is recorded.
            </p>
          )}


{checkingToday && (
  <div className="mt-6 flex items-center gap-2 text-sm text-white/80">
    <Loader2 className="h-4 w-4 animate-spin" />
    Checking today's attendance...
  </div>
)}
          {/* Button */}

         {/* =====================================================
    HOLIDAY
===================================================== */}

{/* HOLIDAY - small disabled badge */}
{!checkingToday &&
  !marked &&
  dayType === "holiday" && (
    <div className="flex justify-center">
      <span className="inline-flex mt-5 items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700">
        🎉 Holiday Today
      </span>
    </div>
  )}


{/* NORMAL SUNDAY - small disabled badge */}
{!checkingToday &&
  !marked &&
  dayType === "sunday" && (
    <div className="flex justify-center">
      <span className="inline-flex mt-5 items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
        Off Today
      </span>
    </div>
  )}


{/* WORKING DAY */}
{!checkingToday &&
  !marked &&
  attendanceAllowed &&
  dayType === "working_day" && (
    <button
      type="button"
      onClick={markAttendance}
      disabled={loading}
      className="rounded-xl w-full ml-[0%] sm:ml-[25%] sm:!w-[50%]  mt-5 bg-white px-6 py-3 text-sm font-semibold text-purple-600 transition hover:bg-purple-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading
        ? "Checking Location..."
        : "Mark Attendance"}
    </button>
  )}
        </div>

        {/* Attendance information */}

        {attendance && (
          <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">

            <div className="rounded-2xl bg-slate-50 p-4">
              <Clock className="mb-3 h-5 w-5 text-purple-600" />

              <p className="text-xs font-medium text-slate-400">
                Check In
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {attendance.checkInTime
                  ? new Date(
                      attendance.checkInTime
                    ).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                       timeZone: "Asia/Kolkata"
                    })
                  : "Marked"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <CalendarDays className="mb-3 h-5 w-5 text-purple-600" />

              <p className="text-xs font-medium text-slate-400">
                Status
              </p>

              <p className="mt-1 font-semibold capitalize text-emerald-600">
                {attendance.status || "Present"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <MapPin className="mb-3 h-5 w-5 text-purple-600" />

              <p className="text-xs font-medium text-slate-400">
                Location
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {attendance.distance !== undefined
                  ? `${attendance.distance}m from DNDC`
                  : "Verified"}
              </p>
            </div>

          </div>
        )}
      </div>

      {/* Success / Error */}

      {message && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 ${
            error
              ? "border-red-200 bg-red-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          {error ? (
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
          )}

          <p
            className={`text-sm font-medium ${
              error
                ? "text-red-700"
                : "text-emerald-700"
            }`}
          >
            {message}
          </p>
        </div>
      )}

      {/* Security info */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">

        <div className="flex gap-4">

          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Location Verification
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Attendance can only be marked from within the
              allowed DNDC location area. Your location is checked
              when you mark attendance.
            </p>

            {permission === "denied" && (
              <p className="mt-2 text-sm font-medium text-red-600">
                Location access is currently blocked in your browser.
              </p>
            )}
          </div>

        </div>
      </div>


<MonthlyAttendance refresh={refreshMonthly} />

    </div>
  );
}