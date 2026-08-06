"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarOff,
  Loader2,
  PartyPopper,
} from "lucide-react";

type Notice = {
  type:
    | "today"
    | "tomorrow"
    | "upcoming";

  title: string;
  date: string;
  daysAway: number;
};

export default function AttendanceNotice() {
  const [notice, setNotice] =
    useState<Notice | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadNotice() {
      try {
        const response = await fetch(
          "/api/attendance/notice",
          {
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (
          response.ok &&
          result.success
        ) {
          setNotice(result.notice);
        }
      } catch (error) {
        console.error(
          "Attendance notice:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadNotice();
  }, []);

  if (loading) {
    return null;
  }

  if (!notice) {
    return null;
  }

  const formattedDate = new Date(
    `${notice.date}T00:00:00Z`
  ).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  // ====================================================
  // Holiday TODAY
  // ====================================================

  if (notice.type === "today") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-600 to-violet-700 p-5 text-white shadow-sm sm:p-6">

        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />

        <div className="relative flex items-start gap-4">

          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
            <PartyPopper className="h-6 w-6" />
          </div>

          <div>

            <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
              Holiday Today
            </span>

            <h2 className="mt-2 text-xl font-bold">
              {notice.title}
            </h2>

            <p className="mt-1 text-sm text-purple-100">
              {formattedDate}
            </p>

            <p className="mt-3 text-sm font-medium text-white/90">
              Enjoy your holiday! Attendance is not
              required today.
            </p>

          </div>

        </div>

      </div>
    );
  }

  // ====================================================
  // Tomorrow / Upcoming
  // ====================================================

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">

      <div className="flex items-start gap-3">

        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
          {notice.type === "tomorrow" ? (
            <CalendarOff className="h-5 w-5 text-amber-700" />
          ) : (
            <CalendarDays className="h-5 w-5 text-amber-700" />
          )}
        </div>

        <div className="min-w-0">

          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            {notice.type === "tomorrow"
              ? "Holiday Tomorrow"
              : "Upcoming Holiday"}
          </p>

          <h3 className="mt-1 font-bold text-slate-900">
            {notice.title}
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {formattedDate}
          </p>

          {notice.type === "upcoming" && (
            <p className="mt-1 text-xs text-amber-700">
              {notice.daysAway} days to go
            </p>
          )}

        </div>

      </div>

    </div>
  );
}