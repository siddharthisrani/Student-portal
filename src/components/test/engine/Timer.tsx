"use client";

interface Props {
  duration: number; // duration is already in seconds
}

export default function Timer({
  duration,
}: Props) {

  const hours = Math.floor(duration / 3600);

  const minutes = Math.floor(
    (duration % 3600) / 60
  );

  const seconds = duration % 60;

  return (
    <div
      className={`rounded-xl px-5 py-2 text-lg font-semibold transition-colors ${
        duration <= 300
          ? "bg-red-100 text-red-600"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {String(hours).padStart(2, "0")}:
      {String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")}
    </div>
  );
}