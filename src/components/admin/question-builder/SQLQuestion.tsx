"use client";

import { Database } from "lucide-react";

interface Props {
  question?: string;
  marks?: number;
}

export default function SQLQuestion({
  question = "",
  marks = 1,
}: Props) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
          <Database className="h-5 w-5 text-purple-600" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">
            SQL Question
          </h3>

          <p className="text-xs text-slate-500">
            Students will write their SQL query and submit it for manual evaluation.
          </p>
        </div>
      </div>

      {/* Information */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <p className="text-xs leading-5 text-blue-700">
          <strong>Manual Evaluation:</strong>{" "}
          The student's SQL query will be submitted to the admin.
          There is no automatic SQL checking.
        </p>
      </div>
    </div>
  );
}