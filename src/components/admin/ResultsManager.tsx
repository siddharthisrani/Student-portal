"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface ResultRow {
  _id: string;

  student: {
    name: string;
    studentId: string;
    course: string;
  };

  test: {
    title: string;
    date: string;
  };

  totalScore: number;
  totalMarks: number;
  passingMarks: number;

  submittedAt: string;
  timeTaken: number;

  correctAnswers: number;
  wrongAnswers: number;

  // IMPORTANT
  status:
    | "submitted"
    | "checking"
    | "checked"
    | "published";
}

export default function ResultsManager() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetchResults = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        ...(search && { search }),
      });

      const res = await fetch(`/api/results?${params}`);

      const data = await res.json();

      if (data.success) {
        setResults(data.results);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        export: "csv",
        ...(search && { search }),
      });

      const res = await fetch(`/api/results?${params}`);

      const blob = await res.blob();

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = "dndc_results.csv";

      a.click();

      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed");
    }
  };

  const totalPages = Math.ceil(total / 20);

  /*
   * ---------------------------------------
   * PERCENTAGE
   * ---------------------------------------
   *
   * Percentage should only be calculated/
   * displayed as a result after publishing.
   */
  const getPercentage = (result: ResultRow) => {
    if (
      result.status !== "published" ||
      !result.totalMarks
    ) {
      return 0;
    }

    return Math.round(
      (result.totalScore / result.totalMarks) * 100
    );
  };

  /*
   * ---------------------------------------
   * PASS / FAIL
   * ---------------------------------------
   *
   * Do not consider an unpublished submission
   * as Pass or Fail.
   */
  const isPassed = (result: ResultRow) => {
    if (result.status !== "published") {
      return false;
    }

    return (
      result.totalScore >=
      result.passingMarks
    );
  };

  /*
   * ---------------------------------------
   * PUBLISHED RESULTS ONLY
   * ---------------------------------------
   */
  const publishedResults = results.filter(
    (result) =>
      result.status === "published"
  );

  /*
   * ---------------------------------------
   * PASS RATE
   * ---------------------------------------
   */
  const passRate =
    publishedResults.length > 0
      ? Math.round(
          (publishedResults.filter((result) =>
            isPassed(result)
          ).length /
            publishedResults.length) *
            100
        )
      : 0;

  /*
   * ---------------------------------------
   * AVERAGE SCORE
   * ---------------------------------------
   */
  const averageScore =
    publishedResults.length > 0
      ? Math.round(
          publishedResults.reduce(
            (sum, result) =>
              sum + getPercentage(result),
            0
          ) / publishedResults.length
        )
      : 0;

  return (
    <div className=" p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-purple-600" />

            <h1 className="text-3xl font-bold text-slate-900">
              Results
            </h1>
          </div>

          <p className="mt-1 text-slate-500">
            {total} total submissions •{" "}
            {passRate}% pass rate
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type="text"
          placeholder="Search by student name, ID, test name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      {/* Stats Row */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Pass Rate",
              value: `${passRate}%`,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Avg Score",
              value: `${averageScore}%`,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              label: "Shown",
              value: results.length,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
          ].map(
            ({
              label,
              value,
              color,
              bg,
            }) => (
              <div
                key={label}
                className={`rounded-2xl ${bg} p-4 text-center`}
              >
                <p
                  className={`text-xl font-bold ${color}`}
                >
                  {value}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {label}
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            Loading results...
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 className="mx-auto mb-3 h-10 w-10 text-slate-300" />

            <p className="text-slate-500">
              No results found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Student
                  </th>

                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-cell">
                    Test
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Score
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 lg:table-cell">
                    Submitted
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {results.map((result) => (
                  <tr
                    key={result._id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                          {result.student?.name?.charAt(
                            0
                          ) || "?"}
                        </div>

                        <div>
                          <p className="font-medium text-slate-900">
                            {result.student?.name}
                          </p>

                          <p className="text-xs text-slate-400">
                            {result.student?.studentId} ·{" "}
                            {result.student?.course}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Test */}
                    <td className="hidden px-4 py-3 md:table-cell">
                      <p className="font-medium text-slate-900">
                        {result.test?.title}
                      </p>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3">
                      {result.status === "published" ? (
                        <>
                          <p
                            className={`text-base font-bold ${
                              isPassed(result)
                                ? "text-emerald-600"
                                : "text-red-500"
                            }`}
                          >
                            {getPercentage(result)}%
                          </p>

                          <p className="text-xs text-slate-400">
                            {result.totalScore}/
                            {result.totalMarks}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-bold text-amber-600">
                            Result Pending
                          </p>

                          <p className="text-xs text-slate-400">
                            Awaiting publication
                          </p>
                        </>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {result.status ===
                      "published" ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            isPassed(result)
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isPassed(result) ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}

                          {isPassed(result)
                            ? "Pass"
                            : "Fail"}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          Result Pending
                        </span>
                      )}
                    </td>

                    {/* Submitted */}
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <p className="text-xs text-slate-500">
                        {formatDateTime(
                          result.submittedAt
                        )}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-500">
              {(page - 1) * 20 + 1}–
              {Math.min(page * 20, total)} of{" "}
              {total}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPage((p) =>
                    Math.max(1, p - 1)
                  )
                }
                disabled={page === 1}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="text-sm text-slate-600">
                {page} / {totalPages}
              </span>

              <button
                onClick={() =>
                  setPage((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
                disabled={
                  page === totalPages
                }
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}