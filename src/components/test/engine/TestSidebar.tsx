"use client";

import {
  getQuestionStatus,
} from "./questionStatus";
import {
  CircularProgressbar,
} from "react-circular-progressbar";

import "react-circular-progressbar/dist/styles.css";

interface Props {
  current: number;
  questions: any[];
  answers: Record<string, any>;
  reviews: number[];
  visited: number[];
  onSelect: (index: number) => void;
}

export default function TestSidebar({
  current,
  questions,
  answers,
  reviews,
  visited,
  onSelect,
}: Props) {
  return (
  <aside className="flex h-full w-80 flex-col border-r bg-white">

    {/* Header */}
    <div className="border-b p-6">

      <div className="flex items-center gap-4">

        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
          S
        </div>

        <div>

          <h2 className="font-semibold text-slate-800">
            Student
          </h2>

          <p className="text-sm text-slate-500">
            DNDC Assessment
          </p>

        </div>

      </div>

    </div>

    {/* Stats */}

    <div className="p-6">

      <h3 className="mb-4 text-lg font-semibold">
        Question Palette
      </h3>

      <div className="mb-6 flex justify-center">

  <div className="w-36">

    <CircularProgressbar
  value={
    (Object.keys(answers).length /
      questions.length) *
    100
  }
  text={`${Object.keys(answers).length}/${questions.length}`}
  styles={{
    path: {
      stroke: "#4f46e5",
      strokeLinecap: "round",
    },
    trail: {
      stroke: "#e5e7eb",
    },
    text: {
      fill: "#111827",
      fontSize: "16px",
      fontWeight: "bold",
    },
  }}
/>

    <p className="mt-3 text-center text-sm text-slate-500">
      Questions Answered
    </p>

  </div>

</div>

    </div>

    {/* Palette */}

    <div className="flex-1 overflow-y-auto px-6">

      <div className="grid grid-cols-4 gap-3">

        {questions.map((q, index) => {

         const status = getQuestionStatus(
  index,
  current,
  visited,
  reviews,
  answers,
  q._id
);

let bg = "";

switch (status) {

  case "current":
    bg =
      "bg-indigo-600 text-white ring-4 ring-indigo-200";
    break;

  case "answered":
    bg =
      "bg-green-500 text-white";
    break;

  case "review":
    bg =
      "bg-orange-500 text-white";
    break;

  case "visited":
    bg =
      "bg-blue-100 text-blue-700";
    break;

  default:
    bg =
      "bg-slate-100 text-slate-600";

}

          if (visited.includes(index)) {
            bg =
              "bg-blue-100 text-blue-700";
          }

          if (answers[q._id]) {
            bg =
              "bg-green-500 text-white";
          }

          if (reviews.includes(index)) {
            bg =
              "bg-orange-500 text-white";
          }

          if (current === index) {
            bg =
              "bg-indigo-600 text-white ring-4 ring-indigo-200";
          }

          return (

            <button
              key={q._id}
              onClick={() =>
                onSelect(index)
              }
              className={`h-14 rounded-2xl font-bold shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg ${bg}`}
            >
              {index + 1}
            </button>

          );

        })}

      </div>

    </div>

    {/* Legend */}

    <div className="border-t p-6">

      <div className="grid grid-cols-2 gap-3 text-sm">

        <div className="flex items-center gap-2">

          <div className="h-4 w-4 rounded bg-indigo-600"/>

          Current

        </div>

        <div className="flex items-center gap-2">

          <div className="h-4 w-4 rounded bg-green-500"/>

          Answered

        </div>

        <div className="flex items-center gap-2">

          <div className="h-4 w-4 rounded bg-orange-500"/>

          Review

        </div>

        <div className="flex items-center gap-2">

          <div className="h-4 w-4 rounded bg-blue-200"/>

          Visited

        </div>

      </div>

    </div>

  </aside>
);
}