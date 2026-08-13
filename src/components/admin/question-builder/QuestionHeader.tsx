"use client";

import {
GripVertical,
Trash2,
Copy,
} from "lucide-react";

interface Props{

index:number;

type:string;

canDelete:boolean;

onDuplicate:()=>void;

onDelete:()=>void;

onTypeChange:(type:string)=>void;

}

export default function QuestionHeader({

index,

type,

canDelete,

onDuplicate,

onDelete,

onTypeChange,

}:Props){

return (
  <div className="flex items-center justify-between border-b bg-gradient-to-r from-slate-50 to-white px-6 py-4">

    <div className="flex items-center gap-4">

      <GripVertical className="h-5 w-5 cursor-grab text-slate-300" />

      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-sm font-bold text-white shadow-md">
        {index + 1}
      </div>

      <div>

        <h3 className="font-semibold text-slate-800">
          Question {index + 1}
        </h3>

        <p className="text-xs text-slate-500 capitalize">
          {type.replace("_", " ")}
        </p>

      </div>

    </div>

    <div className="flex items-center gap-3">

      <select
        value={type}
        onChange={(e) =>
          onTypeChange(e.target.value)
        }
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        <option value="mcq">📝 MCQ</option>

<option value="image_mcq">
🖼 Image MCQ
</option>

<option value="pdf_mcq">
📄 PDF MCQ
</option>

<option value="text">
✍ Theory
</option>

<option value="coding">
💻 Coding
</option>

<option value="sql">
🗄 SQL
</option>

<option value="excel">
📊 Excel
</option>

<option value="upload">
📁 File Upload
</option>
      </select>

      <button
        onClick={onDuplicate}
        className="rounded-xl p-2 hover:bg-slate-100"
      >
        <Copy className="h-4 w-4" />
      </button>

      <button
        disabled={!canDelete}
        onClick={onDelete}
        className="rounded-xl p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
      </button>

    </div>

  </div>
)

}