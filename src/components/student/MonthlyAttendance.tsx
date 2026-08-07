"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarOff,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  TrendingUp,
  XCircle,
} from "lucide-react";

type AttendanceStatus =
  | "present"
  | "absent"
  | "not_marked"
  | "holiday"
  | "non_working_day";

type AttendanceHistory = {
  date: string;
  status: AttendanceStatus;
  title: string;
  checkInTime: string | null;
  distance: number | null;
};

type MonthlyResponse = {
  success: boolean;

  month: number;
  year: number;

  student: {
    id: string;
    name: string;
    studentId: string;
    course: string;
    batch: string;
  };

  summary: {
    workingDays: number;
    completedWorkingDays: number;
    presentDays: number;
    absentDays: number;
    pendingDays: number;
    attendancePercentage: number;
  };

  history: AttendanceHistory[];

  message?: string;
};

function getIndiaCurrentMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = Number(
    parts.find((p) => p.type === "year")?.value
  );

  const month = Number(
    parts.find((p) => p.type === "month")?.value
  );

  return {
    year,
    month,
  };
}

function formatAttendanceDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(
    "en-IN",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  );
}

function formatCheckInTime(date: string) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}
type Props = {
  refresh?: number;
};
export default function MonthlyAttendance({
  refresh = 0,
}: Props) {
  const current = getIndiaCurrentMonth();

  const [month, setMonth] = useState(current.month);
  const [year, setYear] = useState(current.year);

  const [data, setData] =
    useState<MonthlyResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ====================================================
  // Fetch attendance
  // ====================================================

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/attendance/monthly?month=${month}&year=${year}`,
        {
          cache: "no-store",
        }
      );

      const result: MonthlyResponse =
        await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ||
            "Unable to load attendance."
        );

        return;
      }

      setData(result);
    } catch (error) {
      console.error(
        "Monthly attendance error:",
        error
      );

      setError(
        "Unable to load your attendance."
      );
    } finally {
      setLoading(false);
    }
  }, [month, year,refresh]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ====================================================
  // Month navigation
  // ====================================================

  const previousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    const isCurrentMonth =
      month === current.month &&
      year === current.year;

    if (isCurrentMonth) return;

    if (month === 12) {
      setMonth(1);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  const isCurrentMonth =
    month === current.month &&
    year === current.year;

  const monthName = new Date(
    Date.UTC(year, month - 1, 1)
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  // ====================================================
  // Loading
  // ====================================================

  if (loading && !data) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-purple-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading attendance...
          </p>
        </div>
      </div>
    );
  }

  // ====================================================
  // Error
  // ====================================================

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-700">
          {error}
        </p>

        <button
          type="button"
          onClick={fetchAttendance}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const percentage =
    data.summary.attendancePercentage;

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="space-y-5">

      {/* ================================================
          Monthly overview
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Attendance Overview
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {monthName}
            </h2>
          </div>

          {/* Month Navigation */}

          <div className="flex items-center gap-1">

            <button
              type="button"
              onClick={previousMonth}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

          </div>

        </div>

        {/* Percentage */}

        <div className="p-4 sm:p-6">

          <div className="flex flex-col gap-5 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-700 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">

            <div>

              <div className="flex items-center gap-2 text-purple-100">
                <TrendingUp className="h-4 w-4" />

                <p className="text-sm font-medium">
                  Monthly Attendance
                </p>
              </div>

              <div className="mt-2 flex items-end gap-2">

                <span className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {percentage}%
                </span>

              </div>

              <p className="mt-2 text-sm text-purple-100">
                {data.summary.presentDays} present out of{" "}
                {data.summary.completedWorkingDays} completed
                working days
              </p>

            </div>

            <div className="flex items-center gap-2 sm:block sm:text-right">

              <div
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                  percentage >= 75
                    ? "bg-emerald-400/20 text-emerald-100"
                    : percentage >= 60
                    ? "bg-amber-400/20 text-amber-100"
                    : "bg-red-400/20 text-red-100"
                }`}
              >
                {percentage >= 75
                  ? "Good Standing"
                  : percentage >= 60
                  ? "Needs Improvement"
                  : "Low Attendance"}
              </div>

            </div>

          </div>

        </div>

        {/* Stats */}

        <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-4 sm:px-6 sm:pb-6">

          {/* Working */}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
              <CalendarDays className="h-4 w-4 text-slate-600" />
            </div>

            <p className="mt-3 text-xl font-bold text-slate-900">
              {data.summary.workingDays}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              Working Days
            </p>

          </div>

          {/* Present */}

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>

            <p className="mt-3 text-xl font-bold text-emerald-700">
              {data.summary.presentDays}
            </p>

            <p className="mt-0.5 text-xs text-emerald-600">
              Present
            </p>

          </div>

          {/* Absent */}

          <div className="rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>

            <p className="mt-3 text-xl font-bold text-red-700">
              {data.summary.absentDays}
            </p>

            <p className="mt-0.5 text-xs text-red-600">
              Absent
            </p>

          </div>

          {/* Pending */}

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 sm:p-4">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>

            <p className="mt-3 text-xl font-bold text-orange-700">
              {data.summary.pendingDays}
            </p>

            <p className="mt-0.5 text-xs text-orange-600">
              Pending
            </p>

          </div>

        </div>

      </div>

      {/* ================================================
          Attendance History
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-4 sm:p-5">

          <h2 className="font-semibold text-slate-900">
            Attendance History
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Your daily attendance for {monthName}.
          </p>

        </div>

        {data.history.length === 0 ? (

          <div className="p-10 text-center">

            <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 font-medium text-slate-600">
              No attendance records
            </p>

            <p className="mt-1 text-sm text-slate-400">
              There are no attendance days for this month.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {data.history.map((item) => {

              const isPresent =
                item.status === "present";

              const isAbsent =
                item.status === "absent";

              const isPending =
                item.status === "not_marked";

              const isHoliday =
                item.status === "holiday";

              const isNonWorking =
                item.status === "non_working_day";

              return (
                <div
                  key={item.date}
                  className="flex items-center gap-3 px-4 py-4 sm:px-5"
                >

                  {/* Icon */}

                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                      isPresent
                        ? "bg-emerald-50"
                        : isAbsent
                        ? "bg-red-50"
                        : isPending
                        ? "bg-orange-50"
                        : isHoliday
                        ? "bg-purple-50"
                        : "bg-slate-100"
                    }`}
                  >
                    {isPresent && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    )}

                    {isAbsent && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}

                    {isPending && (
                      <Clock className="h-5 w-5 text-orange-500" />
                    )}

                    {isHoliday && (
                      <CalendarOff className="h-5 w-5 text-purple-600" />
                    )}

                    {isNonWorking && (
                      <CalendarDays className="h-5 w-5 text-slate-500" />
                    )}

                  </div>

                  {/* Date */}

                  <div className="min-w-0 flex-1">

                    <p className="text-sm font-semibold text-slate-900">
                      {formatAttendanceDate(item.date)}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">

                      {isPresent &&
                        item.checkInTime && (
                          <span className="text-xs text-slate-500">
                            Check-in{" "}
                            {formatCheckInTime(
                              item.checkInTime
                            )}
                          </span>
                        )}

                      {isPresent &&
                        item.distance !== null && (
                          <span className="text-xs text-slate-400">
                            {Math.round(item.distance)}m from
                            DNDC
                          </span>
                        )}

                      {isHoliday && (
                        <span className="text-xs text-slate-500">
                          {item.title}
                        </span>
                      )}

                      {isNonWorking && (
                        <span className="text-xs text-slate-400">
                          {item.title}
                        </span>
                      )}

                    </div>

                  </div>

                  {/* Status */}

                  <div className="flex-shrink-0">

                    {isPresent && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 sm:text-xs">
                        Present
                      </span>
                    )}

                    {isAbsent && (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 sm:text-xs">
                        Absent
                      </span>
                    )}

                    {isPending && (
                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-600 sm:text-xs">
                        Pending
                      </span>
                    )}

                    {isHoliday && (
                      <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-600 sm:text-xs">
                        Holiday
                      </span>
                    )}

                    {isNonWorking && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 sm:text-xs">
                        Off
                      </span>
                    )}

                  </div>

                </div>
              );
            })}

          </div>

        )}

      </div>

    </div>
  );
}