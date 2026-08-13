"use client";

interface Props{
    value:number;
    onChange:(value:number)=>void;
}

export default function MarksInput({
    value,
    onChange,
}:Props){

return (
  <div className="flex items-center justify-end border-t border-slate-100 pt-5">

    <div className="flex items-center gap-3">

      <span className="text-sm font-medium text-slate-600">
        Marks
      </span>

      <input
        type="number"
        value={value}
        min={1}
        max={100}
        onChange={(e) =>
          onChange(Number(e.target.value))
        }
        className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center font-semibold"
      />

    </div>

  </div>
);

}