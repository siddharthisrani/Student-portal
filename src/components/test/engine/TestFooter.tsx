"use client";

interface Props {
  current: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onReview: () => void;
  onSubmit: () => void;
}

export default function TestFooter({
  current,
  total,
  onPrevious,
  onNext,
  onReview,
  onSubmit,
}: Props) {
  return (
    <footer className="flex items-center justify-between border-t bg-white p-5">

      <button
        disabled={current === 0}
        onClick={onPrevious}
        className="rounded-2xl  border bg-white hover:bg-slate-50 transition-all duration-300 px-5 py-2"
      >
        Previous
      </button>

      <div className="flex gap-3">

        <button
          onClick={onReview}
          className="rounded-2xl bg-orange-500 hover:bg-orange-600 transition-all duration-300 px-5 py-2 text-white"
        >
          Mark Review
        </button>

        <button
          disabled={current === total - 1}
          onClick={onNext}
          className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 px-5 py-2 text-white"
        >
          Save & Next
        </button>

      </div>

      <button
        onClick={onSubmit}
        className="rounded-2xl bg-red-600 hover:bg-red-700 transition-all duration-300 px-6 py-2 text-white"
      >
        Submit Test
      </button>

    </footer>
  );
}