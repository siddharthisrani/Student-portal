"use client";

import Link from "next/link";

interface Props {
  submissions: any[];
}

export default function SubmissionTable({
  submissions,
}: Props) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        No submissions found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left">
              Student
            </th>

            <th className="px-6 py-4 text-left">
              Test
            </th>

            <th className="px-6 py-4 text-center">
              Score
            </th>

            <th className="px-6 py-4 text-center">
              Status
            </th>

            <th className="px-6 py-4 text-center">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {submissions.map((submission) => (
            <tr
              key={submission._id}
              className="border-t hover:bg-slate-50"
            >
              {/* Student */}
              <td className="px-6 py-5">
                <div className="font-semibold">
                  {submission.student?.name ||
                    "Unknown Student"}
                </div>

                <div className="text-sm text-slate-500">
                  {submission.student?.email || ""}
                </div>
              </td>

              {/* Test */}
              <td className="px-6 py-5">
                {submission.test?.title || "Test"}
              </td>

              {/* Score */}
              <td className="px-6 py-5 text-center">
                {submission.status === "published" ? (
                  <>
                    <div className="font-semibold">
                      {submission.totalScore || 0} /{" "}
                      {submission.totalMarks || 0}
                    </div>

                    <div className="mt-0.5 text-xs text-slate-500">
                      {submission.totalMarks > 0
                        ? Math.round(
                            ((submission.totalScore || 0) /
                              submission.totalMarks) *
                              100
                          )
                        : 0}
                      %
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-amber-600">
                      Result Pending
                    </div>

                    <div className="mt-0.5 text-xs text-slate-400">
                      Awaiting publication
                    </div>
                  </>
                )}
              </td>

              {/* Status */}
              <td className="px-6 py-5 text-center">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    submission.status === "published"
                      ? "bg-green-100 text-green-700"
                      : submission.status === "checked"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {submission.status}
                </span>
              </td>

              {/* Action */}
              <td className="px-6 py-5 text-center">
                <Link
                  href={`/admin/submissions/${submission._id}`}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                >
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}