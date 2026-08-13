"use client";

interface Props {
  answer: any;
}

export default function TextResult({
  answer,
}: Props) {

  const question =
    answer.questionId;

  return (

    <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">

      <h2 className="text-2xl font-bold">

        {question.question}

      </h2>

      <textarea
        readOnly
        value={answer.answer || ""}
        rows={12}
        className="w-full rounded-xl border p-5"
      />

      <div className="rounded-xl bg-slate-100 p-4">

        <p>

          Marks :

          <strong>

            {" "}
            {answer.obtainedMarks} /
            {answer.maxMarks}

          </strong>

        </p>

        {answer.feedback && (

          <p className="mt-3">

            Feedback :

            <strong>

              {" "}
              {answer.feedback}

            </strong>

          </p>

        )}

      </div>

    </div>

  );

}