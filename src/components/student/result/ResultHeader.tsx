"use client";

interface Props {
  title: string;
  score: number;
  total: number;
  status: string;
}

export default function ResultHeader({
  title,
  score,
  total,
  status,
}: Props) {

  return (

    <div className="rounded-2xl bg-white p-8 shadow-sm">

      <h1 className="text-3xl font-bold">
        {title}
      </h1>

      <div className="mt-6 flex flex-wrap gap-4">

        <div className="rounded-xl bg-slate-100 px-5 py-3">

          <p className="text-xs text-slate-500">
            Score
          </p>

          <h2 className="text-2xl font-bold">

            {score} / {total}

          </h2>

        </div>

        <div
          className={`rounded-xl px-5 py-7 font-semibold ${
            status === "published"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >

          {status}

        </div>

      </div>

    </div>

  );

}