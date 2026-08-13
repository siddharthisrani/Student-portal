"use client";

import { Database } from "lucide-react";

interface Props {
  question: any;
  value?: string;
  onChange: (value: string) => void;
}

export default function SQLPlayer({
  question,
  value = "",
  onChange,
}: Props) {
  return (
    <div className="space-y-5">

      {/* Question */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
            <Database className="h-5 w-5 text-purple-600" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
              SQL Question
            </p>

            <p className="text-xs text-slate-400">
              Write your SQL query below
            </p>
          </div>

        </div>

        <h2 className="text-lg font-semibold leading-7 text-slate-900">
          {question.question}
        </h2>

      </div>


      {/* SQL Editor */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Your SQL Query
            </p>

            <p className="text-xs text-slate-400">
              Write your answer below
            </p>
          </div>

          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
            SQL
          </span>

        </div>


        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={`SELECT *
FROM students
WHERE marks > 80;`}
          className="min-h-[320px] w-full resize-y bg-slate-950 px-5 py-4 font-mono text-sm leading-6 text-green-300 outline-none placeholder:text-slate-600"
        />


        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-4 py-2">

          <span className="text-[11px] text-slate-500">
            Write your SQL query
          </span>

          <span className="text-[11px] text-slate-500">
            {value.length} characters
          </span>

        </div>

      </div>


      {/* Manual Evaluation Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

        <p className="text-xs leading-5 text-amber-700">
          <strong>Manual Evaluation:</strong>{" "}
          Your SQL query will be submitted to the admin.
        </p>

      </div>

    </div>
  );
}