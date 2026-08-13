"use client";

import { RotateCcw } from "lucide-react";
import CodeEditor from "../../shared/CodeEditor";
import { CODE_TEMPLATES } from "./codeTemplates";

interface Props {
  language?: string;
  starterCode?: string;
  sampleInput?: string;
  sampleOutput?: string;

  onLanguageChange: (language: string) => void;
  onCodeChange: (code: string) => void;
  onSampleInputChange: (value: string) => void;
  onSampleOutputChange: (value: string) => void;
}

export default function CodingQuestion({
  language = "javascript",
  starterCode = "",
  sampleInput = "",
  sampleOutput = "",

  onLanguageChange,
  onCodeChange,
  onSampleInputChange,
  onSampleOutputChange,
}: Props) {
  const resetTemplate = () => {
    onCodeChange(
      CODE_TEMPLATES[language] || ""
    );
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5">

      {/* Header */}

      <div className="flex items-center justify-between">

        <h3 className="text-lg font-semibold">
          💻 Coding Question
        </h3>

      </div>

      {/* Language */}

      <div className="flex flex-wrap items-center gap-3">

        <div>

          <label className="mb-2 block text-sm font-medium">
            Programming Language
          </label>

          <select
            value={language}
            onChange={(e) => {

              const lang = e.target.value;

              onLanguageChange(lang);

              onCodeChange(
                CODE_TEMPLATES[lang]
              );

            }}
            className="rounded-xl border border-slate-300 px-4 py-2"
          >

            <option value="javascript">JavaScript</option>

            <option value="typescript">TypeScript</option>

            <option value="java">Java</option>

            <option value="python">Python</option>

            <option value="cpp">C++</option>

            <option value="csharp">C#</option>

            <option value="php">PHP</option>

          </select>

        </div>

        <button
          type="button"
          onClick={resetTemplate}
          className="mt-7 flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-100"
        >

          <RotateCcw className="h-4 w-4" />

          Reset Template

        </button>

      </div>

      {/* Editor */}

      <div>

        <label className="mb-2 block text-sm font-medium">
          Starter Code
        </label>

        <CodeEditor
          language={language}
          value={starterCode}
          onChange={onCodeChange}
        />

      </div>

      {/* Sample IO */}

      <div className="grid gap-5 md:grid-cols-2">

        <div>

          <label className="mb-2 block text-sm font-medium">
            Sample Input
          </label>

          <textarea
            rows={6}
            value={sampleInput}
            onChange={(e) =>
              onSampleInputChange(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 p-4"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium">
            Sample Output
          </label>

          <textarea
            rows={6}
            value={sampleOutput}
            onChange={(e) =>
              onSampleOutputChange(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 p-4"
          />

        </div>

      </div>

    </div>
  );
}