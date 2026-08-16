'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, Save, ArrowLeft, GripVertical, Image, FileText,
  CheckCircle2, XCircle, AlertCircle, Upload
} from 'lucide-react';
import TextQuestion from "./question-builder/TextQuestion";
import QuestionHeader  from './question-builder/QuestionHeader';
import MarksInput from './question-builder/MarksInput';
import MCQQuestion from "./question-builder/MCQQuestion";
import CodingQuestion from "./question-builder/CodingQuestion";
import SQLQuestion from "./question-builder/SQLQuestion";
import ExcelQuestion from "./question-builder/ExcelQuestion";
import UploadQuestion from "./question-builder/UploadQuestion";
import BulkMCQUpload from "./question-builder/BulkMCQUpload";

interface Option {
  id: string;
  text: string;
}

interface Question {

  _id?: string;

  type:
    | "mcq"
    | "image_mcq"
    | "pdf_mcq"
    | "text"
    | "coding"
    | "sql"
    | "excel"
    | "upload";

  question: string;

  options: Option[];

  correctAnswer: string;

  marks: number;

  imageUrl?: string;

  pdfUrl?: string;

  order: number;

  // --------------------
  // Coding
  // --------------------

language?: string;
starterCode?: string;
sampleInput?: string;
sampleOutput?: string;

// Future use (optional)
boilerplateCode?: string;

  // --------------------
  // SQL
  // --------------------

   tableName?: string;
  dataFileUrl?: string;
  dataFileName?: string;
  dataFileType?: string;

  // --------------------
  // Excel
  // --------------------

  excelTemplate?: string;

  // --------------------
  // Upload
  // --------------------

  allowedExtensions?: string[];

  maxFileSize?: number;


}

interface QuestionBuilderProps {
  testId: string;
}

const generateId = () => Math.random().toString(36).substring(2, 8);

const createBlankQuestion = (order: number): Question => ({
  type: "mcq",
 
  // Common
  question: "",
  marks: 1,
  order,

  // MCQ
  options: [
    { id: generateId(), text: "" },
    { id: generateId(), text: "" },
    { id: generateId(), text: "" },
    { id: generateId(), text: "" },
  ],
  correctAnswer: "",

  // Media
  imageUrl: "",
  pdfUrl: "",

  // Coding
language: "javascript",

starterCode: "",

sampleInput: "",

sampleOutput: "",

boilerplateCode: "",

  // SQL
tableName: "",
dataFileUrl: "",
dataFileName: "",
dataFileType: "",


  // Excel
  excelTemplate: "",

  // Upload Question
  allowedExtensions: [],
  maxFileSize: 10, // MB
});

export default function QuestionBuilder({ testId }: QuestionBuilderProps) {
  const router = useRouter();
  const [testTitle, setTestTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([createBlankQuestion(0)]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const fetchTest = useCallback(async () => {
    const res = await fetch(`/api/tests/${testId}`);
    const data = await res.json();
    if (data.success) {
      setTestTitle(data.test.title);
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions.map((q: Question & { _id: string }, i: number) => ({
          ...q,
          _id: q._id?.toString(),
          order: i,
        })));
      }
    }
  }, [testId]);

  useEffect(() => { fetchTest(); }, [fetchTest]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createBlankQuestion(prev.length)]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i })));
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setQuestions((prev) => prev.map((q, i) => i === index ? { ...q, ...updates } : q));
  };

  const addOption = (index: number) => {
    const q = questions[index];
    if (q.options.length >= 6) return;
    updateQuestion(index, { options: [...q.options, { id: generateId(), text: '' }] });
  };

  const removeOption = (qIndex: number, optId: string) => {
    const q = questions[qIndex];
    if (q.options.length <= 2) return;
    const newOptions = q.options.filter((o) => o.id !== optId);
    const updates: Partial<Question> = { options: newOptions };
    if (q.correctAnswer === optId) updates.correctAnswer = '';
    updateQuestion(qIndex, updates);
  };

  const updateOption = (qIndex: number, optId: string, text: string) => {
    updateQuestion(qIndex, {
      options: questions[qIndex].options.map((o) => o.id === optId ? { ...o, text } : o),
    });
  };

  const duplicateQuestion = (index: number) => {
    const q = { ...questions[index], _id: undefined, order: questions.length };
    setQuestions((prev) => [...prev, q]);
  };

  const handleFileUpload = async (qIndex: number, file: File, type: 'image' | 'pdf') => {
    const key = `${qIndex}-${type}`;
    setUploadingFor(key);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        if (type === 'image') {
          updateQuestion(qIndex, { imageUrl: data.url });
        } else {
          updateQuestion(qIndex, { pdfUrl: data.url });
        }
      } else {
        alert('Upload failed: ' + data.message);
      }
    } finally {
      setUploadingFor(null);
    }
  };

  const handleBulkUpload = (newQuestions: Question[]) => {
    setQuestions((prev) => {
      // If the builder only has one empty default question, replace it entirely
      const isDefaultBlank = 
        prev.length === 1 && 
        prev[0].question === "" && 
        prev[0].type === "mcq";
        
      const base = isDefaultBlank ? [] : prev;

      // Merge arrays and recalculate the order property
      return [...base, ...newQuestions].map((q, i) => ({
        ...q,
        order: i,
      }));
    });
  };

 const handleDatasetUpload = async (
  qIndex: number,
  file: File
) => {
  const key = `${qIndex}-dataset`;

  setUploadingFor(key);

  try {
    const formData = new FormData();

    formData.append("file", file);

    const res = await fetch(
      "/api/upload/dataset",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(
        data.message ||
          "Dataset upload failed"
      );
    }

    updateQuestion(qIndex, {
      dataFileUrl: data.url,
      dataFileName: data.fileName,
      dataFileType: data.fileType,
    });
  } catch (error) {
    console.error(
      "Dataset upload error:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Dataset upload failed"
    );
  } finally {
    setUploadingFor(null);
  }
};

  const handleSave = async () => {
    setSaving(true);
    setError('');

// VALIDATION
// =========================

for (let i = 0; i < questions.length; i++) {

  const q = questions[i];

  if (!q.question.trim()) {
    setError(
      `Question ${i + 1}: Question text is required.`
    );
    setSaving(false);
    return;
  }

 

  // -------------------------
  // MCQ Validation
  // -------------------------

  if (
    q.type === "mcq" ||
    q.type === "image_mcq" ||
    q.type === "pdf_mcq"
  ) {

    if (!q.correctAnswer) {
      setError(
        `Question ${i + 1}: Please select the correct answer.`
      );

      setSaving(false);
      return;
    }

    for (const option of q.options) {

      if (!option.text.trim()) {

        setError(
          `Question ${i + 1}: Every option must contain text.`
        );

        setSaving(false);
        return;

      }

    }

  }

  // -------------------------
  // Coding Validation
  // -------------------------

  if (q.type === "coding") {

    if (!q.language) {

      setError(
        `Question ${i + 1}: Select a programming language.`
      );

      setSaving(false);
      return;

    }

    if (!q.starterCode?.trim()) {

      setError(
        `Question ${i + 1}: Starter code is required.`
      );

      setSaving(false);
      return;

    }

  }

  // -------------------------
  // SQL
  // -------------------------

  // -------------------------
// SQL Validation
// -------------------------

// -------------------------
// SQL Validation
// -------------------------

if (q.type === "sql") {
  // Dataset is optional.
  // Admin will manually review the student's SQL query.
}

}

  



    try {
      console.log(
  JSON.stringify(
    questions,
    null,
    2
  )
);

     const cleanedQuestions = questions.map((q) => ({
  ...q,

  options:
    q.type === "mcq" ||
    q.type === "image_mcq" ||
    q.type === "pdf_mcq"
      ? q.options
      : [],

  correctAnswer:
    q.type === "mcq" ||
    q.type === "image_mcq" ||
    q.type === "pdf_mcq"
      ? q.correctAnswer
      : "",
}));
const res = await fetch("/api/questions", {

  method: "POST",

  headers: {
    "Content-Type": "application/json",
  },

  body: JSON.stringify({

    testId,

    questions: cleanedQuestions,

  }),

});

      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchTest();
    } finally {
      setSaving(false);
    }
  };

  const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/tests')}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-bold text-slate-900 text-sm sm:text-base">{testTitle || 'Question Builder'}</h1>
              <p className="text-xs text-slate-400">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" /> Saved!
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-70 hover:from-purple-700 hover:to-violet-800 active:scale-[0.98] transition-all"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save All'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 pb-20">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-purple-200 hover:shadow-xl">
            {/* Question Header */}
            <QuestionHeader

index={qIndex}

type={q.type}

canDelete={questions.length>1}

onTypeChange={(type) => {

  const newType = type as Question["type"];

  updateQuestion(qIndex, {

    type: newType,

    options:
      newType === "mcq" ||
      newType === "image_mcq" ||
      newType === "pdf_mcq"
        ? [
            { id: generateId(), text: "" },
            { id: generateId(), text: "" },
            { id: generateId(), text: "" },
            { id: generateId(), text: "" },
          ]
        : [],

    correctAnswer: "",

    imageUrl: "",
    pdfUrl: "",

    language: "javascript",

    starterCode: "",

    sampleInput: "",

    sampleOutput: "",

    tableName: "",
dataFileUrl: "",
dataFileName: "",
dataFileType: "",

excelTemplate: "",

    allowedExtensions: [],

    maxFileSize: 10,

  });

}}

onDuplicate={()=>duplicateQuestion(qIndex)}

onDelete={()=>removeQuestion(qIndex)}

/>

            <div className="p-4 space-y-4">
              {/* Image Upload */}
      {/* Image Upload */}
{q.type === "image_mcq" && (
  <div>
    <label className="mb-1.5 block text-xs font-medium text-slate-600">
      Reference Image
    </label>

    {q.imageUrl ? (
      <div className="relative overflow-hidden rounded-xl border border-slate-200">
        <img
          src={q.imageUrl}
          alt="Question"
          className="max-h-60 w-full object-contain bg-slate-50"
        />

        <button
          type="button"
          onClick={() =>
            updateQuestion(qIndex, {
              imageUrl: undefined,
            })
          }
          className="absolute right-2 top-2 rounded-full bg-white p-1 shadow hover:bg-red-50"
        >
          <XCircle className="h-5 w-5 text-red-500" />
        </button>
      </div>
    ) : (
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-5 transition-all hover:border-purple-400 hover:bg-purple-50">

        {uploadingFor === `${qIndex}-image` ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        ) : (
          <>
            <Image className="h-6 w-6 text-slate-400" />

            <span className="text-xs text-slate-500">
              Click to upload image
            </span>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  handleFileUpload(
                    qIndex,
                    file,
                    "image"
                  );
                }
              }}
            />
          </>
        )}

      </label>
    )}
  </div>
)}

              {/* PDF Upload */}
              {q.type === 'pdf_mcq' && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Reference PDF</label>
                  {q.pdfUrl ? (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-3">
                      <FileText className="h-5 w-5 text-red-500" />
                      <a href={q.pdfUrl} target="_blank" className="text-sm text-blue-600 hover:underline truncate flex-1">
                        View PDF
                      </a>
                      <button onClick={() => updateQuestion(qIndex, { pdfUrl: undefined })} className="text-slate-400 hover:text-red-500">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-5 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all">
                      {uploadingFor === `${qIndex}-pdf` ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-slate-400" />
                          <span className="text-xs text-slate-500">Click to upload PDF</span>
                          <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(qIndex, file, 'pdf');
                            }}
                          />
                        </>
                      )}
                    </label>
                  )}
                </div>
              )}

              {/* Question Text */}
              {/* Question Text */}
<TextQuestion
  value={q.question}
  onChange={(question) =>
    updateQuestion(qIndex, {
      question,
    })
  }
/>

{/* Question Type UI */}

{(q.type === "mcq" ||
  q.type === "image_mcq" ||
  q.type === "pdf_mcq") && (
  <>
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">
          Answer Options
        </label>

        {q.options.length < 6 && (
          <button
            onClick={() => addOption(qIndex)}
            className="text-xs font-medium text-purple-600 hover:text-purple-700"
          >
            + Add Option
          </button>
        )}
      </div>

      <MCQQuestion
        options={q.options}
        labels={labels}
        correctAnswer={q.correctAnswer}
        onOptionChange={(optionId, value) =>
          updateOption(qIndex, optionId, value)
        }
        onCorrectAnswerChange={(optionId) =>
          updateQuestion(qIndex, {
            correctAnswer: optionId,
          })
        }
        onRemoveOption={(optionId) =>
          removeOption(qIndex, optionId)
        }
      />

      {!q.correctAnswer && (
        <p className="mt-2 text-xs text-amber-600">
          Click a letter to mark the correct answer.
        </p>
      )}
    </div>
  </>
)}

{q.type === "coding" && (
  <CodingQuestion
    language={q.language}
    starterCode={q.starterCode}
    sampleInput={q.sampleInput}
    sampleOutput={q.sampleOutput}
    onLanguageChange={(language) =>
      updateQuestion(qIndex, {
        language,
      })
    }
    onCodeChange={(starterCode) =>
      updateQuestion(qIndex, {
        starterCode,
      })
    }
    onSampleInputChange={(sampleInput) =>
      updateQuestion(qIndex, {
        sampleInput,
      })
    }
    onSampleOutputChange={(sampleOutput) =>
      updateQuestion(qIndex, {
        sampleOutput,
      })
    }
  />
)}

{q.type === "sql" && (
  <SQLQuestion
    question={q.question}
    marks={q.marks}
  />
)}

{q.type === "excel" && (
  <ExcelQuestion
    dataFileUrl={q.dataFileUrl}
    dataFileName={q.dataFileName}
    dataFileType={q.dataFileType}
    uploading={
      uploadingFor === `${qIndex}-dataset`
    }
    onDatasetUpload={(file) =>
      handleDatasetUpload(
        qIndex,
        file
      )
    }
    onRemoveDataset={() =>
      updateQuestion(qIndex, {
        dataFileUrl: "",
        dataFileName: "",
        dataFileType: "",
      })
    }
  />
)}

{q.type === "upload" && <UploadQuestion />}

              {/* Marks */}
              <MarksInput
    value={q.marks}
    onChange={(marks)=>
        updateQuestion(qIndex,{
            marks,
        })
    }
/>
            </div>
          </div>
        ))}

        {/* Add Question Button */}
        {/* Replace the old Add Question button with this grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          
          {/* Manual Add Button */}
          <button
            onClick={addQuestion}
            className="flex w-full h-full min-h-[160px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 p-6 text-sm font-medium text-slate-500 transition-all hover:border-purple-400 hover:bg-purple-50 hover:text-purple-600"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-purple-100">
              <Plus className="h-6 w-6" />
            </div>
            Add Single Question
          </button>

          {/* Bulk Upload Component */}
          <BulkMCQUpload onUpload={handleBulkUpload} />
          
        </div>
      </div>
    </div>
  );
}