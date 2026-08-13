"use client";

import CodeEditor from "../../../shared/CodeEditor";
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

export default function CodingReview({
  question,
  answer,
  marks,
  feedback,
  setMarks,
  setFeedback,
  readOnly,
}: Props) {

  const maxMarks = Number(
    question.marks ?? answer.maxMarks ?? 0
  );

  return (
    <div className="space-y-5">

      {/* Question */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">

        <h2 className="text-xl font-bold text-slate-900">
          {question.question}
        </h2>

        <div className="mt-2 text-sm text-slate-500">
          Maximum Marks:{" "}
          <span className="font-semibold text-slate-700">
            {maxMarks}
          </span>
        </div>

      </div>

      {/* Student Code */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">

        <p className="mb-3 text-sm font-semibold text-slate-700">
          Student Answer
        </p>

        <CodeEditor
          language={question.language}
          value={
            answer.answer ??
            question.starterCode ??
            ""
          }
          readOnly
        />

      </div>

      {/* Marks */}
      <MarksPanel
        value={Math.min(
          Math.max(0, Number(marks) || 0),
          maxMarks
        )}
        max={maxMarks}
        feedback={feedback}
        onMarksChange={(value) => {
          const validMarks = Math.min(
            Math.max(0, Number(value) || 0),
            maxMarks
          );

          setMarks(validMarks);
        }}
        onFeedbackChange={setFeedback}
        readOnly={readOnly}
      />

    </div>
  );
}