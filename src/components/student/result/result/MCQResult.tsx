"use client";

interface Props {
  answer: any;
}

export default function MCQResult({
  answer,
}: Props) {

  const question =
    answer.questionId;

  return (

    <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">

      <h2 className="text-2xl font-bold">

        {question.question}

      </h2>

      <div className="space-y-3">

        {question.options.map(
          (option: any) => {

            const selected =
              answer.answer === option.id;

            const correct =
              question.correctAnswer === option.id;

            return (

              <div
                key={option.id}
                className={`rounded-xl border p-4

                ${
                  correct
                    ? "border-green-500 bg-green-50"
                    : selected
                    ? "border-red-500 bg-red-50"
                    : "border-slate-200"
                }

                `}
              >

                {option.text}

              </div>

            );

          }
        )}

      </div>

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