"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function TextQuestion({
  value,
  onChange,
}: Props) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600">
        Question
      </label>

      <textarea
  rows={4}
  value={value}
  placeholder="Enter your question..."
  onChange={(e) =>
    onChange(e.target.value)
  }
  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm transition-all focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-100"
/>
    </div>
  );
}