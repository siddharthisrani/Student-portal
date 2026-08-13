"use client";

interface Props {
  loading?: boolean;
  onClick: () => void;
}

export default function SaveDraft({
  loading = false,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="rounded-xl bg-slate-800 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Saving..." : "Save Draft"}
    </button>
  );
}