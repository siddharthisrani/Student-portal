"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CalendarCheck,
  CheckCircle2,
   CalendarDays,
  CalendarOff,
  Clock,
  Loader2,
  MapPin,
  Search,
  XCircle,
  TrendingUp,
  Users,
  RefreshCw,
} from "lucide-react";

type AttendanceStudent = {
  id: string;

  name: string;
  email: string;
  phone: string;
  studentId: string;

  course: string;
  batch: string;

  avatar?: string;

  attendanceStatus:
  | "present"
  | "absent"
  | "not_marked"
  | "holiday"
  | "non_working_day";

  attendance: {
    id: string;
    checkInTime: string;
    distance: number;
    latitude: number;
    longitude: number;
  } | null;
};

type AttendanceResponse = {
  success: boolean;

  date: string;

  day: {
    status:
      | "working_day"
      | "holiday"
      | "non_working_day";
    title: string;
    isToday: boolean;
  };

  stats: {
    totalStudents: number;
    present: number;
    absent: number;
    notMarked: number;
    holiday: number;
    nonWorking: number;
  };

  students: AttendanceStudent[];

  filters: {
    courses: string[];
    batches: string[];
  };

  message?: string;
};

export default function AdminAttendanceClient() {
  const [data, setData] =
    useState<AttendanceResponse | null>(null);

    const [selectedDate, setSelectedDate] = useState(
  getIndiaDateString()
);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [course, setCourse] =
    useState("All");

  const [batch, setBatch] =
    useState("All");

  // ---------------------------------------
  // Fetch attendance
  // ---------------------------------------

  const fetchAttendance =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();
          params.set("date", selectedDate);

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (course !== "All") {
          params.set(
            "course",
            course
          );
        }

        if (batch !== "All") {
          params.set(
            "batch",
            batch
          );
        }

        const response = await fetch(
          `/api/admin/attendance?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          setError(
            result.message ||
              "Unable to load attendance."
          );

          return;
        }

        setData(result);
      } catch (error) {
        console.error(
          "Attendance fetch error:",
          error
        );

        setError(
          "Unable to load attendance."
        );
      } finally {
        setLoading(false);
      }
    }, [search, course, batch,selectedDate]);

  // ---------------------------------------
  // Fetch when filters change
  // ---------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttendance();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [fetchAttendance]);

  // ---------------------------------------
  // Initial loading
  // ---------------------------------------

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">

          <Loader2 className="mx-auto h-7 w-7 animate-spin text-purple-600" />

          <p className="mt-3 text-sm text-slate-500">
            Loading attendance...
          </p>

        </div>
      </div>
    );
  }

  function getIndiaDateString() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  return `${year}-${month}-${day}`;
}

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* =====================================
          Header
      ====================================== */}

     <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

        <button
  type="button"
  onClick={() =>
    setSelectedDate(getIndiaDateString())
  }
  disabled={selectedDate === getIndiaDateString()}
  className="h-11 rounded-xl border border-purple-200 bg-purple-50 px-4 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 disabled:cursor-default disabled:opacity-50"
>
  Today
</button>

  <input
    type="date"
    value={selectedDate}
    max={getIndiaDateString()}
    onChange={(e) => setSelectedDate(e.target.value)}
    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100 sm:w-auto"
  />

  <button
    type="button"
    onClick={fetchAttendance}
    disabled={loading}
    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
  >
    <RefreshCw
      className={`h-4 w-4 ${
        loading ? "animate-spin" : ""
      }`}
    />

    Refresh
  </button>

</div>

      {/* =====================================
          Statistics
      ====================================== */}

      {/* =====================================
    Day Status
====================================== */}

{data && (
  <div
    className={`rounded-2xl border p-4 sm:p-5 ${
      data.day.status === "holiday"
        ? "border-red-200 bg-red-50"
        : data.day.status === "non_working_day"
        ? "border-slate-200 bg-slate-50"
        : "border-purple-200 bg-purple-50"
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${
          data.day.status === "holiday"
            ? "bg-red-100"
            : data.day.status === "non_working_day"
            ? "bg-slate-200"
            : "bg-purple-100"
        }`}
      >
        {data.day.status === "holiday" ? (
          <CalendarOff className="h-5 w-5 text-red-600" />
        ) : data.day.status === "non_working_day" ? (
          <CalendarDays className="h-5 w-5 text-slate-600" />
        ) : (
          <CalendarCheck className="h-5 w-5 text-purple-600" />
        )}
      </div>

      <div>
        <p
          className={`font-semibold ${
            data.day.status === "holiday"
              ? "text-red-800"
              : data.day.status === "non_working_day"
              ? "text-slate-800"
              : "text-purple-900"
          }`}
        >
          {data.day.title}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {data.day.status === "holiday"
            ? "Institute holiday — attendance is not required."
            : data.day.status === "non_working_day"
            ? "This is a non-working day. Attendance is not required."
            : data.day.isToday
            ? "Today's attendance is currently in progress."
            : "This was a regular working day."}
        </p>
      </div>
    </div>
  </div>
)}

{/* =====================================
    Statistics
====================================== */}

{data && (
  <div
    className={`grid grid-cols-2 gap-3 ${
      data.day.status === "working_day"
        ? "lg:grid-cols-4"
        : "lg:grid-cols-3"
    }`}
  >
    {/* Total */}

    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500 sm:text-sm">
            Total Students
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-3xl">
            {data.stats.totalStudents}
          </p>
        </div>

        <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-purple-50 sm:flex">
          <Users className="h-5 w-5 text-purple-600" />
        </div>
      </div>
    </div>

    {/* Present */}

    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-emerald-700 sm:text-sm">
            Present
          </p>

          <p className="mt-1 text-2xl font-bold text-emerald-700 sm:mt-2 sm:text-3xl">
            {data.stats.present}
          </p>
        </div>

        <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 sm:flex">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </div>
      </div>
    </div>

    {/* Today = Not Marked */}

    {data.day.status === "working_day" && data.day.isToday && (
      <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-orange-700 sm:text-sm">
              Not Marked
            </p>

            <p className="mt-1 text-2xl font-bold text-orange-700 sm:mt-2 sm:text-3xl">
              {data.stats.notMarked}
            </p>
          </div>

          <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-orange-100 sm:flex">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
        </div>
      </div>
    )}

    {/* Past = Absent */}

    {data.day.status === "working_day" && !data.day.isToday && (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-red-700 sm:text-sm">
              Absent
            </p>

            <p className="mt-1 text-2xl font-bold text-red-700 sm:mt-2 sm:text-3xl">
              {data.stats.absent}
            </p>
          </div>

          <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-red-100 sm:flex">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
        </div>
      </div>
    )}

    {/* Attendance Rate */}

    {data.day.status === "working_day" && (
      <div className="col-span-2 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm sm:p-5 lg:col-span-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-blue-700 sm:text-sm">
              Attendance Rate
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-700 sm:mt-2 sm:text-3xl">
              {data.stats.totalStudents > 0
                ? Math.round(
                    (data.stats.present /
                      data.stats.totalStudents) *
                      100
                  )
                : 0}
              %
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </div>
    )}

    {/* Holiday */}

    {data.day.status === "holiday" && (
      <div className="col-span-2 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm sm:p-5 lg:col-span-1">
        <p className="text-xs text-red-600 sm:text-sm">
          Day Status
        </p>

        <p className="mt-1 text-xl font-bold text-red-700 sm:mt-2">
          Holiday
        </p>
      </div>
    )}

    {/* Non-working */}

    {data.day.status === "non_working_day" && (
      <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5 lg:col-span-1">
        <p className="text-xs text-slate-500 sm:text-sm">
          Day Status
        </p>

        <p className="mt-1 text-xl font-bold text-slate-700 sm:mt-2">
          Non-working
        </p>
      </div>
    )}
  </div>
)}

      {/* =====================================
          Filters
      ====================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">

          {/* Search */}

          <div className="relative">

            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search name, student ID or email..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />

          </div>

          {/* Course */}

          <select
            value={course}
            onChange={(e) =>
              setCourse(e.target.value)
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-purple-400"
          >
            <option value="All">
              All Courses
            </option>

            {data?.filters.courses.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

          {/* Batch */}

          <select
            value={batch}
            onChange={(e) =>
              setBatch(e.target.value)
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-purple-400"
          >
            <option value="All">
              All Batches
            </option>

            {data?.filters.batches.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* =====================================
          Student Attendance List
      ====================================== */}

      {data && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-4">

            <div className="flex items-center gap-2">

              <CalendarCheck className="h-5 w-5 text-purple-600" />

             <div>
  <h2 className="font-semibold text-slate-900">
    {selectedDate === getIndiaDateString()
      ? "Today's Attendance"
      : "Attendance Records"}
  </h2>

  <p className="mt-0.5 text-xs text-slate-400">
    {new Date(
      `${selectedDate}T00:00:00Z`
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })}
  </p>
</div>

            </div>

          </div>

          {data.students.length === 0 ? (

            <div className="p-10 text-center">

              <Users className="mx-auto h-10 w-10 text-slate-300" />

              <p className="mt-3 font-medium text-slate-600">
                No students found
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Try changing your search or filters.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-slate-100">

              {data.students.map(
                (student) => (
                  <div
                    key={student.id}
                    className="p-4 transition hover:bg-slate-50 sm:p-5"
                  >

                    <div className="flex items-start gap-3 sm:items-center">

                      {/* Avatar */}

                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-100 text-sm font-bold text-purple-700">

                        {student.avatar ? (
                          <img
                            src={
                              student.avatar
                            }
                            alt={
                              student.name
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          student.name
                            .charAt(0)
                            .toUpperCase()
                        )}

                      </div>

                      {/* Student info */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">

                          <p className="truncate text-sm font-semibold text-slate-900">
                            {student.name}
                          </p>

                          <span className="w-fit rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            {
                              student.studentId
                            }
                          </span>

                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {student.course} •{" "}
                          {student.batch}
                        </p>

                        {/* Mobile attendance info */}

                        {student.attendance && (
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 sm:hidden">

                            <span className="flex items-center gap-1 text-xs text-slate-500">

                              <Clock className="h-3 w-3" />

                              {new Date(
                                student.attendance.checkInTime
                              ).toLocaleTimeString(
                                "en-IN",
                                {
                                  hour:
                                    "2-digit",
                                  minute:
                                    "2-digit",
                                  timeZone:
                                    "Asia/Kolkata",
                                }
                              )}

                            </span>

                            <span className="flex items-center gap-1 text-xs text-slate-400">

                              <MapPin className="h-3 w-3" />

                              {Math.round(
                                student.attendance.distance
                              )}
                              m

                            </span>

                          </div>
                        )}

                      </div>

                      {/* Desktop check-in */}

                      <div className="hidden min-w-[120px] sm:block">

                        {student.attendance ? (
                          <>
                            <p className="flex items-center gap-1 text-sm font-medium text-slate-700">

                              <Clock className="h-4 w-4 text-slate-400" />

                              {new Date(
                                student.attendance.checkInTime
                              ).toLocaleTimeString(
                                "en-IN",
                                {
                                  hour:
                                    "2-digit",
                                  minute:
                                    "2-digit",
                                  timeZone:
                                    "Asia/Kolkata",
                                }
                              )}

                            </p>

                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">

                              <MapPin className="h-3 w-3" />

                              {Math.round(
                                student.attendance.distance
                              )}
                              m from DNDC

                            </p>
                          </>
                        ) : (
  <p className="text-sm text-slate-400">
    {student.attendanceStatus === "holiday"
      ? "Holiday"
      : student.attendanceStatus === "non_working_day"
      ? "No attendance"
      : student.attendanceStatus === "absent"
      ? "No check-in"
      : "Waiting"}
  </p>
)}

                      </div>

                      {/* Status */}

                      <div className="flex-shrink-0">

                        {student.attendanceStatus === "present" && (
  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 sm:px-3">
    <CheckCircle2 className="h-3 w-3" />
    Present
  </span>
)}

{student.attendanceStatus === "absent" && (
  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 sm:px-3">
    <XCircle className="h-3 w-3" />
    Absent
  </span>
)}

{student.attendanceStatus === "not_marked" && (
  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 sm:px-3">
    <Clock className="h-3 w-3" />
    Not Marked
  </span>
)}

{student.attendanceStatus === "holiday" && (
  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 sm:px-3">
    <CalendarOff className="h-3 w-3" />
    Holiday
  </span>
)}

{student.attendanceStatus === "non_working_day" && (
  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 sm:px-3">
    <CalendarDays className="h-3 w-3" />
    Non-working
  </span>
)}

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
}