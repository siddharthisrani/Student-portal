"use client";

interface Props {
  answer: any;
}

export default function UploadResult({
  answer,
}: Props) {

  return (

    <div className="rounded-2xl bg-white p-8 shadow-sm">

      <h2 className="text-2xl font-bold">
        {answer.questionId.question}
      </h2>

      <div className="mt-6">

        {answer.answer ? (

          <a
            href={answer.answer}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white inline-block"
          >
            Download Submitted File
          </a>

        ) : (

          <div className="rounded-xl border border-dashed p-8 text-center">

            No file submitted.

          </div>

        )}

      </div>

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