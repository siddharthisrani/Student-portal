"use client";

interface Option {
  id: string;
  text: string;
}

interface Props {
  options: Option[];
  correctAnswer: string;

  onOptionChange: (
    optionId: string,
    value: string
  ) => void;

  onCorrectAnswerChange: (
    optionId: string
  ) => void;

  onRemoveOption: (
    optionId: string
  ) => void;

  labels: string[];
}

export default function MCQQuestion({
  options,
  correctAnswer,
  onOptionChange,
  onCorrectAnswerChange,
  onRemoveOption,
  labels,
}: Props) {
  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <div
          key={option.id}
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 transition-all hover:border-purple-300 hover:bg-purple-50"
        >
          <button
            type="button"
            onClick={() =>
              onCorrectAnswerChange(option.id)
            }
            className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition
            ${
              correctAnswer === option.id
                ? "border-purple-600 bg-purple-600 text-white"
                : "border-slate-300 text-slate-600 hover:border-purple-400"
            }`}
          >
            {labels[index]}
          </button>

          <input
            value={option.text}
            onChange={(e) =>
              onOptionChange(
                option.id,
                e.target.value
              )
            }
            placeholder={`Option ${labels[index]}`}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2"
          />

          {options.length > 2 && (
            <button
              type="button"
              onClick={() =>
                onRemoveOption(option.id)
              }
              className="text-red-500"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}