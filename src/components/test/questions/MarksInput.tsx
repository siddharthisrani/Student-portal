interface Props {
    value:number;
    onChange:(value:number)=>void;
}

export default function MarksInput({
    value,
    onChange,
}:Props){

return(

<div className="flex items-center gap-3">

<label className="text-xs font-medium text-slate-600">
Marks
</label>

<input
type="number"
value={value}
min={0}
max={100}
onChange={(e)=>onChange(Number(e.target.value))}
className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-center text-sm focus:border-purple-500 focus:outline-none"
/>

</div>

)

}