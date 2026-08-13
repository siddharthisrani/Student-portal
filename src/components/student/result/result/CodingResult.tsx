"use client";

import CodeEditor from "@/components/shared/CodeEditor";

interface Props {
  answer: any;
}

export default function CodingResult({
  answer,
}: Props) {

  const question =
    answer.questionId;

  return (

    <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm">

      <h2 className="text-2xl font-bold">

        {question.question}

      </h2>

      <CodeEditor
        language={question.language}
        value={answer.answer || ""}
        readOnly
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