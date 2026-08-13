"use client";

import { Database } from "lucide-react";

interface Props {
  question: any;
  answer: any;

  marks: number;
  feedback: string;

  setMarks: (value: number) => void;

  setFeedback: React.Dispatch<
    React.SetStateAction<string>
  >;

  readOnly: boolean;
}

export default function SQLReview({
  question,
  answer,
  marks,
  feedback,
  setMarks,
  setFeedback,
  readOnly,
}: Props) {
  const submittedQuery =
    answer?.answer ??
    answer?.value ??
    answer?.text ??
    "";

  const maxMarks = question?.marks ?? 0;

  return (
    <div className="space-y-5">

      {/* Question */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-4 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Database className="h-5 w-5 text-purple-600" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">
              SQL Question
            </p>

            <p className="text-xs text-slate-400">
              Manual evaluation
            </p>
          </div>

        </div>

        <h3 className="text-base font-semibold leading-7 text-slate-900">
          {question?.question}
        </h3>

      </div>


      {/* Student Query */}
      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950">

        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">

          <div>
            <p className="text-sm font-semibold text-white">
              Student's SQL Query
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              Submitted answer
            </p>
          </div>

          <span className="rounded-lg bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-400">
            SQL
          </span>

        </div>


        <pre className="max-h-[450px] min-h-[220px] overflow-auto p-5">

          <code className="whitespace-pre-wrap break-words font-mono text-sm leading-7 text-green-300">
            {submittedQuery || "-- No SQL query submitted"}
          </code>

        </pre>

      </div>


      {/* Manual Evaluation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-5">

          <h3 className="text-sm font-bold text-slate-900">
            Manual Evaluation
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Check the student's SQL query manually and assign marks.
          </p>

        </div>


        {/* Marks */}
        <div className="mb-5">

          <label className="mb-2 block text-xs font-semibold text-slate-700">
            Marks
          </label>

          <div className="flex items-center gap-3">

            <input
              type="number"
              min={0}
              max={maxMarks}
              step={0.5}
              value={marks}
              disabled={readOnly}
              onChange={(e) => {
                const value = Number(e.target.value);

                if (value < 0) {
                  setMarks(0);
                  return;
                }

                if (value > maxMarks) {
                  setMarks(maxMarks);
                  return;
                }

                setMarks(value);
              }}
              className="w-32 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />

            <span className="text-sm text-slate-500">
              / {maxMarks}
            </span>

          </div>

        </div>


        {/* Feedback */}
        <div>

          <label className="mb-2 block text-xs font-semibold text-slate-700">
            Feedback
          </label>

          <textarea
            value={feedback}
            disabled={readOnly}
            onChange={(e) =>
              setFeedback(e.target.value)
            }
            rows={4}
            placeholder="Write feedback for the student..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

        </div>

      </div>


      {/* Manual evaluation notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

        <p className="text-xs leading-5 text-amber-700">
          <strong>Manual checking:</strong>{" "}
          This SQL answer is not automatically evaluated.
          Review the query and assign marks manually.
        </p>

      </div>

    </div>
  );
}