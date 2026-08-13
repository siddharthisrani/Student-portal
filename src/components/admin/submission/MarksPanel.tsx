"use client";

interface Props {
  value: number;
  max: number;
  feedback: string;

  onMarksChange: (marks: number) => void;
  onFeedbackChange: (text: string) => void;

  readOnly?: boolean;
}

export default function MarksPanel({
  value,
  max,
  feedback,
  onMarksChange,
  onFeedbackChange,
  readOnly = false,
}: Props) {
  const safeMax = Math.max(0, Number(max) || 0);

  const safeValue = Math.min(
    safeMax,
    Math.max(0, Number(value) || 0)
  );

  const handleMarksChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = e.target.value;

    if (rawValue === "") {
      onMarksChange(0);
      return;
    }

    const numericValue = Number(rawValue);

    if (Number.isNaN(numericValue)) {
      return;
    }

    // Never allow negative marks
    if (numericValue < 0) {
      onMarksChange(0);
      return;
    }

    // Never allow marks greater than question marks
    if (numericValue > safeMax) {
      onMarksChange(safeMax);
      return;
    }

    onMarksChange(numericValue);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      {/* Marks Header */}
      <div className="mb-4 flex items-center justify-between">

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Marks
          </p>

          <p className="mt-1 text-xs text-slate-500">
            This question is worth{" "}
            <span className="font-semibold text-slate-700">
              {safeMax}
            </span>{" "}
            marks
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
          {safeValue} / {safeMax}
        </div>

      </div>

      {/* Marks Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Obtained Marks
        </label>

        <div className="flex items-center gap-3">

          <input
            type="number"
            min={0}
            max={safeMax}
            step="1"
            value={safeValue}
            disabled={readOnly}
            onChange={handleMarksChange}
            className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition ${
              readOnly
                ? "cursor-not-allowed bg-slate-100 text-slate-500"
                : "border-slate-300 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            }`}
          />

          <div className="whitespace-nowrap text-sm font-medium text-slate-500">
            / {safeMax}
          </div>

        </div>

        <p className="mt-2 text-xs text-slate-400">
          Allowed range: 0 to {safeMax}
        </p>

      </div>

      {/* Feedback */}
      <div className="mt-5">

        <label className="mb-2 block text-sm font-medium text-slate-700">
          Feedback
        </label>

        <textarea
          rows={4}
          value={feedback}
          disabled={readOnly}
          onChange={(e) =>
            onFeedbackChange(e.target.value)
          }
          placeholder="Write feedback for the student..."
          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
            readOnly
              ? "cursor-not-allowed bg-slate-100 text-slate-500"
              : "border-slate-300 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          }`}
        />

      </div>

    </div>
  );
}