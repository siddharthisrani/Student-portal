"use client";

interface Props {
  answer: any;
}

export default function SQLResult({
  answer,
}: Props) {

  return (

    <div className="rounded-2xl bg-white p-8 shadow-sm">

      <h2 className="text-2xl font-bold">
        {answer.questionId.question}
      </h2>

      <pre className="mt-6 rounded-xl bg-slate-100 p-5 overflow-auto">
        {answer.answer || "No SQL Query Submitted"}
      </pre>

      <div className="mt-6 rounded-xl bg-slate-100 p-4">

        <p>
          Marks:
          <strong>
            {" "}
            {answer.obtainedMarks} / {answer.maxMarks}
          </strong>
        </p>

        {answer.feedback && (
          <p className="mt-2">
            Feedback:
            <strong> {answer.feedback}</strong>
          </p>
        )}

      </div>

    </div>

  );

}