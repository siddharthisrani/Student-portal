"use client";

interface Props {
  answers: any[];
  current: number;
  onSelect: (index: number) => void;
}

export default function ResultSidebar({
  answers,
  current,
  onSelect,
}: Props) {

  function getColor(answer: any) {

    if (current === answers.indexOf(answer))
      return "bg-indigo-600 text-white";

    if (
      answer.answer === null ||
      answer.answer === "" ||
      answer.answer === undefined
    ) {
      return "bg-slate-200 text-slate-600";
    }

    if (answer.obtainedMarks === answer.maxMarks) {
      return "bg-green-500 text-white";
    }

    if (
      answer.obtainedMarks > 0 &&
      answer.obtainedMarks < answer.maxMarks
    ) {
      return "bg-yellow-500 text-white";
    }

    return "bg-red-500 text-white";
  }

  return (

    <div className="rounded-2xl bg-white p-5 shadow-sm">

      <h2 className="mb-5 text-lg font-bold">

        Questions

      </h2>

      <div className="grid grid-cols-4 gap-3">

        {answers.map((answer, index) => (

          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`h-12 rounded-xl font-semibold transition ${getColor(answer)}`}
          >

            {index + 1}

          </button>

        ))}

      </div>

      <div className="mt-8 space-y-2 text-sm">

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-green-500" />
          Correct
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-yellow-500" />
          Partial Marks
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-500" />
          Wrong
        </div>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-300" />
          Skipped
        </div>

      </div>

    </div>

  );

}