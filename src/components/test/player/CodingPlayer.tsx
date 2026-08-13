"use client";

import CodeEditor from "@/components/shared/CodeEditor";
interface Props {
  question: any;
  value?: string;
  onChange: (value: string) => void;
}



export default function CodingPlayer({
  question,
  value,
  onChange,
}: Props)

{

console.log("CodingPlayer Rendered");


  return (

    

    <div className="space-y-6">

      <div className="rounded-2xl bg-white p-8 shadow-sm">

        <h2 className="text-2xl font-semibold">

          {question.question}

        </h2>

      </div>

    <CodeEditor

language={
question.language
}

value={
value ??
question.starterCode
}

onChange={
onChange
}

/>

      <div className="grid grid-cols-2 gap-5">

        <div>

          <label className="mb-2 block text-sm font-semibold">

            Sample Input

          </label>

          <textarea

            rows={6}

            readOnly

            value={question.sampleInput}

            className="w-full rounded-xl border p-4"

          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-semibold">

            Sample Output

          </label>

          <textarea

            rows={6}

            readOnly

            value={question.sampleOutput}

            className="w-full rounded-xl border p-4"

          />

        </div>

      </div>

    </div>

  );

}