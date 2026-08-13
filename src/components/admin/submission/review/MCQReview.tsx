"use client";

export default function MCQReview({
  question,
  answer,
}: any) {

  return (

    <div className="rounded-2xl border bg-white p-6">

      <h2 className="mb-5 text-xl font-bold">

        {question.question}

      </h2>

      <div className="space-y-3">

        {question.options.map(
          (option: any) => {

            const isCorrect =
              option.id ===
              question.correctAnswer;

            const isStudent =
              option.id ===
              answer.answer;

            return (

              <div
                key={option.id}
                className={`rounded-xl border p-4

                ${
                  isCorrect

                    ? "border-green-500 bg-green-50"

                    : isStudent

                    ? "border-red-500 bg-red-50"

                    : ""

                }

                `}
              >

                {option.text}

              </div>

            );

          }
        )}

      </div>

      <div className="mt-6 rounded-xl bg-slate-100 p-4">

        <strong>

          Marks :

        </strong>

        {" "}

        {answer.obtainedMarks}

        /

        {answer.maxMarks}

      </div>

    </div>

  );

}