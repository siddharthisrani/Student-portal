"use client";

import Timer from "./Timer";

type SaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error";

interface Props {
  title: string;
  duration: number;
  current: number;
  total: number;
  saveStatus: SaveStatus;
}

export default function TestHeader({
  title,
  duration,
  current,
  total,
  saveStatus,
}: Props) {
  return (
    <header className="flex h-20 items-center justify-between border-b bg-white px-8">
         
     

      <div>

        <h1 className="text-2xl font-bold text-slate-800">
          {title}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Question {current + 1} of {total}
        </p>

      </div>

      <div className="flex items-center gap-5">

        <div className="rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
          Full Screen Enabled
        </div>

       <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium">

  {saveStatus === "idle" && (
    <span className="text-slate-600">
      Ready
    </span>
  )}

  {saveStatus === "saving" && (
    <span className="text-amber-600">
      💾 Saving...
    </span>
  )}

  {saveStatus === "saved" && (
    <span className="text-green-600">
      ✅ Saved
    </span>
  )}

  {saveStatus === "error" && (
    <span className="text-red-600">
      ⚠ Save Failed
    </span>
  )}

</div>

        <Timer duration={duration} />

        
        

      </div>
      

    </header>
  );
}