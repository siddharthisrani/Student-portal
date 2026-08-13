"use client";

import Link from "next/link";

interface Props {
  submission: any;
}

export default function SubmissionCard({
  submission,
}: Props) {

  return (

    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-xl font-bold">
            {submission.studentName}
          </h2>

          <p className="mt-1 text-slate-500">
            {submission.testTitle}
          </p>

        </div>

        <span className="rounded-full bg-slate-100 px-4 py-2 text-sm">

          {submission.status}

        </span>

      </div>

      <div className="mt-5">

        <Link
          href={`/admin/submissions/${submission._id}`}
          className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white"
        >
          Open Submission
        </Link>

      </div>

    </div>

  );

}