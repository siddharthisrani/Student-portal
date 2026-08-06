"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarOff,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type DayType = "working_day" | "holiday";

type CalendarDay = {
  _id: string;
  date: string;
  type: DayType;
  title: string;
  course: string;
  batch: string;
};

function getIndiaDateString() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getCurrentIndiaMonth() {
  const today = getIndiaDateString();
  const [year, month] = today.split("-");

  return {
    year: Number(year),
    month: Number(month),
  };
}

export default function AttendanceCalendarManager() {
  const current = getCurrentIndiaMonth();

  const [days, setDays] = useState<CalendarDay[]>([]);

  const [month, setMonth] = useState(current.month);
  const [year, setYear] = useState(current.year);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState(getIndiaDateString());
  const [type, setType] = useState<DayType>("holiday");
  const [title, setTitle] = useState("");

  // -----------------------------------
  // Load calendar
  // -----------------------------------

  const fetchCalendar = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/admin/attendance/calendar?month=${month}&year=${year}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message || "Unable to load calendar."
        );
        return;
      }

      setDays(result.days || []);
    } catch (error) {
      console.error("Calendar fetch error:", error);

      setError("Unable to load calendar.");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  // -----------------------------------
  // Save
  // -----------------------------------

  const handleSave = async () => {
    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (type === "holiday" && !title.trim()) {
      setError("Please enter the holiday name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/attendance/calendar",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            date,
            type,
            title:
              title.trim() ||
              (type === "working_day"
                ? "Working Day"
                : ""),
            course: "All",
            batch: "All",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ||
            "Unable to save calendar day."
        );
        return;
      }

      setMessage(result.message);
      setShowForm(false);
      setTitle("");

      /*
       * If admin selected a date from another month,
       * automatically move the list to that month.
       */
      const [selectedYear, selectedMonth] = date
        .split("-")
        .map(Number);

      if (
        selectedYear !== year ||
        selectedMonth !== month
      ) {
        setYear(selectedYear);
        setMonth(selectedMonth);
      } else {
        await fetchCalendar();
      }
    } catch (error) {
      console.error("Save calendar error:", error);

      setError("Unable to save calendar day.");
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------
  // Delete
  // -----------------------------------

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Remove this calendar configuration?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/attendance/calendar?id=${id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ||
            "Unable to remove calendar configuration."
        );
        return;
      }

      setMessage("Calendar configuration removed.");

      await fetchCalendar();
    } catch (error) {
      console.error("Delete calendar error:", error);

      setError(
        "Unable to remove calendar configuration."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const monthName = new Date(
    Date.UTC(year, month - 1, 1)
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}

      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-purple-600" />

            <h2 className="font-semibold text-slate-900">
              Working Days & Holidays
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Configure institute holidays and special
            working days.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError("");
            setMessage("");
            setShowForm(!showForm);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 sm:w-auto"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Day
            </>
          )}
        </button>

      </div>

      {/* Add form */}

      {showForm && (
        <div className="border-b border-slate-100 bg-slate-50/70 p-5">

          <div className="grid gap-4 md:grid-cols-3">

            {/* Date */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            {/* Type */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Day Type
              </label>

              <select
                value={type}
                onChange={(e) =>
                  setType(
                    e.target.value as DayType
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-purple-400"
              >
                <option value="holiday">
                  Holiday
                </option>

                <option value="working_day">
                  Special Working Day
                </option>
              </select>
            </div>

            {/* Title */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                {type === "holiday"
                  ? "Holiday Name"
                  : "Description"}
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder={
                  type === "holiday"
                    ? "e.g. Independence Day"
                    : "e.g. Special Sunday Class"
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>

          </div>

          <div className="mt-4 flex justify-end">

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Day
                </>
              )}
            </button>

          </div>

        </div>
      )}

      {/* Messages */}

      {message && (
        <div className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Month navigation */}

      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Viewing
          </p>

          <h3 className="mt-0.5 font-semibold text-slate-900">
            {monthName}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">

          <select
            value={month}
            onChange={(e) =>
              setMonth(Number(e.target.value))
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
          >
            {Array.from(
              { length: 12 },
              (_, index) => {
                const value = index + 1;

                const label = new Date(
                  Date.UTC(2026, index, 1)
                ).toLocaleDateString(
                  "en-IN",
                  {
                    month: "long",
                    timeZone: "UTC",
                  }
                );

                return (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                );
              }
            )}
          </select>

          <select
            value={year}
            onChange={(e) =>
              setYear(Number(e.target.value))
            }
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
          >
            {Array.from(
              { length: 7 },
              (_, index) =>
                current.year - 2 + index
            ).map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* Records */}

      <div className="border-t border-slate-100">

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">

            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />

            Loading calendar...

          </div>
        ) : days.length === 0 ? (
          <div className="p-10 text-center">

            <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />

            <p className="mt-3 font-medium text-slate-600">
              No special days configured
            </p>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
              Normal Monday–Saturday days will be treated
              as working days. Sundays are non-working
              unless you add a special working day.
            </p>

          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {days.map((day) => {

              const isHoliday =
                day.type === "holiday";

              return (
                <div
                  key={day._id}
                  className="flex items-center gap-3 p-4 sm:px-5"
                >

                  {/* Icon */}

                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
                      isHoliday
                        ? "bg-red-50"
                        : "bg-emerald-50"
                    }`}
                  >
                    {isHoliday ? (
                      <CalendarOff className="h-5 w-5 text-red-500" />
                    ) : (
                      <CalendarDays className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>

                  {/* Details */}

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <p className="font-semibold text-slate-900">
                        {new Date(
                          day.date
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            timeZone: "UTC",
                          }
                        )}
                      </p>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          isHoliday
                            ? "bg-red-50 text-red-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {isHoliday
                          ? "Holiday"
                          : "Working Day"}
                      </span>

                    </div>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {day.title ||
                        (isHoliday
                          ? "Institute Holiday"
                          : "Special Working Day")}
                    </p>

                    {(day.course !== "All" ||
                      day.batch !== "All") && (
                      <p className="mt-1 text-xs text-slate-400">
                        {day.course} • {day.batch}
                      </p>
                    )}

                  </div>

                  {/* Delete */}

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(day._id)
                    }
                    disabled={
                      deletingId === day._id
                    }
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    title="Remove"
                  >
                    {deletingId ===
                    day._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>

                </div>
              );
            })}

          </div>
        )}

      </div>

    </div>
  );
}