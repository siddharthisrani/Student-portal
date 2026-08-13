"use client";

interface Props {
  question:any;
  value?:string;
  onChange:(value:string)=>void;
}

export default function TextPlayer({
question,
value,
onChange,
}:Props) {

    console.log("TextPlayer Rendered");
  return (
    <div className="space-y-6">

      <div className="rounded-2xl bg-white p-8 shadow-sm">

        <h2 className="text-2xl font-semibold">
          {question.question}
        </h2>

      </div>

      <textarea
value={value ?? ""}
onChange={(e)=>onChange(e.target.value)}
        rows={10}
        placeholder="Write your answer here..."
        className="w-full rounded-2xl border border-slate-300 p-5 outline-none focus:border-indigo-500"
      />

    </div>
  );
}