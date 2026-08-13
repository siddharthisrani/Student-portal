"use client";

import { FileCheck } from "lucide-react";

interface Props {
  title: string;
  student: string;
  status: string;
}

export default function SubmissionHeader({
  title,
  student,
  status,
}: Props) {
  return (
    <div className="mb-8 flex items-center justify-between rounded-2xl border bg-white p-6 shadow-sm">

      <div>

        <div className="flex items-center gap-3">

          <FileCheck className="h-7 w-7 text-indigo-600" />

          <h1 className="text-3xl font-bold">
            {title}
          </h1>

        </div>

        <p className="mt-2 text-slate-500">

          Student :
          <span className="ml-2 font-medium text-slate-700">
            {student}
          </span>

        </p>

      </div>

      <span
        className={`rounded-full px-5 py-2 text-sm font-semibold

        ${
          status === "published"
            ? "bg-green-100 text-green-700"
            : status === "checked"
            ? "bg-blue-100 text-blue-700"
            : status === "checking"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-slate-100 text-slate-700"
        }

        `}
      >
        {status}
      </span>

    </div>
  );
}