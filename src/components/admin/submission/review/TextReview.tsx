"use client";

import MarksPanel from "../MarksPanel";

interface Props {
  question: any;
  answer: any;

  marks: number;
  feedback: string;

  setMarks: (marks: number) => void;
  setFeedback: (text: string) => void;
  readOnly: boolean;
}

export default function TextReview({
  question,
  answer,
  marks,
  feedback,
  setMarks,
  setFeedback,
  readOnly
}: Props) {

  return (

    <div className="rounded-2xl border bg-white p-6">

      <h2 className="text-xl font-bold">
        {question.question}
      </h2>

      <div className="mt-5 rounded-xl bg-slate-50 p-5 whitespace-pre-wrap">
        {answer.answer || "No Answer"}
      </div>

      <div className="mt-6">

        <MarksPanel
          value={marks}
          max={answer.maxMarks}
          feedback={feedback}
          onMarksChange={setMarks}
          onFeedbackChange={setFeedback}
          readOnly={readOnly}
        />

      </div>

    </div>

  );
}