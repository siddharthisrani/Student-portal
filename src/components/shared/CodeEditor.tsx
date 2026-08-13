"use client";

import Editor from "@monaco-editor/react";

interface Props {
  language: string;

  value: string;

  onChange?: (value: string) => void;

  readOnly?: boolean;
}

export default function CodeEditor({
  language,
  value,
  onChange,
  readOnly = false,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <Editor
        height="500px"
        language={language}
        value={value}
        theme="vs-dark"
        onChange={(value) => {
  if (onChange) {
    onChange(value ?? "");
  }
}}
       options={{
  readOnly,

  minimap: {
    enabled: false,
  },

  fontSize: 15,

  automaticLayout: true,

  wordWrap: "on",

  tabSize: 2,

  smoothScrolling: true,

  scrollBeyondLastLine: false,

  padding: {
    top: 16,
  },

  bracketPairColorization: {
    enabled: true,
  },

  guides: {
    bracketPairs: true,
  },
}}
      />
    </div>
  );
}