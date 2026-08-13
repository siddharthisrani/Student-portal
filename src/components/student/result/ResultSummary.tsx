"use client";

interface Props {
  totalMarks: number;
  obtainedMarks: number;
  correct: number;
  wrong: number;
  skipped: number;
}

export default function ResultSummary({
  totalMarks,
  obtainedMarks,
  correct,
  wrong,
  skipped,
}: Props) {

  const percentage =
    totalMarks === 0
      ? 0
      : Math.round(
          (obtainedMarks / totalMarks) * 100
        );

  const cards = [
    {
      title: "Percentage",
      value: `${percentage}%`,
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      title: "Correct",
      value: correct,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Wrong",
      value: wrong,
      color: "bg-red-100 text-red-700",
    },
    {
      title: "Skipped",
      value: skipped,
      color: "bg-yellow-100 text-yellow-700",
    },
  ];

  return (

    <div className="grid grid-cols-2 gap-5 md:grid-cols-4">

      {cards.map((card) => (

        <div
          key={card.title}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >

          <p className="text-sm text-slate-500">

            {card.title}

          </p>

          <div
            className={`mt-4 inline-flex rounded-xl px-4 py-2 text-2xl font-bold ${card.color}`}
          >

            {card.value}

          </div>

        </div>

      ))}

    </div>

  );

}