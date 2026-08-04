'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, Save, ArrowLeft, GripVertical, Image, FileText,
  CheckCircle2, XCircle, AlertCircle, Upload
} from 'lucide-react';

interface Option {
  id: string;
  text: string;
}

interface Question {
  _id?: string;
  type: 'mcq' | 'image_mcq' | 'pdf_mcq' | 'text';
  question: string;
  options: Option[];
  correctAnswer: string;
  marks: number;
  imageUrl?: string;
  pdfUrl?: string;
  order: number;
}

interface QuestionBuilderProps {
  testId: string;
}

const generateId = () => Math.random().toString(36).substring(2, 8);

const createBlankQuestion = (order: number): Question => ({
  type: 'mcq',
  question: '',
  options: [
    { id: generateId(), text: '' },
    { id: generateId(), text: '' },
    { id: generateId(), text: '' },
    { id: generateId(), text: '' },
  ],
  correctAnswer: '',
  marks: 1,
  order,
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

  const handleSave = async () => {
    setSaving(true);
    setError('');

    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1}: Question text is required.`);
        setSaving(false);
        return;
      }
      if (!q.correctAnswer) {
        setError(`Question ${i + 1}: Please select the correct answer.`);
        setSaving(false);
        return;
      }
      for (const opt of q.options) {
        if (!opt.text.trim()) {
          setError(`Question ${i + 1}: All option texts are required.`);
          setSaving(false);
          return;
        }
      }
    }

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, questions }),
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
          <div key={qIndex} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Question Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-100">
              <GripVertical className="h-4 w-4 text-slate-300" />
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                {qIndex + 1}
              </div>
              <select
                value={q.type}
                onChange={(e) => updateQuestion(qIndex, { type: e.target.value as Question['type'] })}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:outline-none focus:border-purple-400"
              >
                <option value="mcq">MCQ</option>
                <option value="image_mcq">MCQ with Image</option>
                <option value="pdf_mcq">MCQ with PDF</option>
                <option value="text">Text Question</option>
              </select>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => duplicateQuestion(qIndex)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 text-xs"
                  title="Duplicate"
                >
                  ⎘
                </button>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  disabled={questions.length === 1}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Image Upload */}
              {(q.type === 'image_mcq') && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Question Image</label>
                  {q.imageUrl ? (
                    <div className="relative">
                      <img src={q.imageUrl} alt="question" className="h-32 rounded-xl object-contain border border-slate-200" />
                      <button
                        onClick={() => updateQuestion(qIndex, { imageUrl: undefined })}
                        className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-5 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all">
                      {uploadingFor === `${qIndex}-image` ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                      ) : (
                        <>
                          <Image className="h-6 w-6 text-slate-400" />
                          <span className="text-xs text-slate-500">Click to upload image (JPG, PNG, WebP)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(qIndex, file, 'image');
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
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Question Text</label>
                <textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                  placeholder="Enter your question here..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                />
              </div>

              {/* Options */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600">Answer Options</label>
                  {q.options.length < 6 && (
                    <button
                      onClick={() => addOption(qIndex)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {q.options.map((opt, optIndex) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuestion(qIndex, { correctAnswer: opt.id })}
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold border-2 transition-all ${
                          q.correctAnswer === opt.id
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-400'
                        }`}
                        title="Set as correct answer"
                      >
                        {labels[optIndex]}
                      </button>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateOption(qIndex, opt.id, e.target.value)}
                        placeholder={`Option ${labels[optIndex]}`}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                          q.correctAnswer === opt.id
                            ? 'border-emerald-400 bg-emerald-50 focus:ring-emerald-400/20'
                            : 'border-slate-200 focus:border-purple-400 focus:ring-purple-400/20'
                        }`}
                      />
                      {q.options.length > 2 && (
                        <button
                          onClick={() => removeOption(qIndex, opt.id)}
                          className="text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {!q.correctAnswer && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    Click a letter (A, B, C, D) to mark it as the correct answer.
                  </p>
                )}
              </div>

              {/* Marks */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-slate-600">Marks:</label>
                <input
                  type="number"
                  value={q.marks}
                  min={0}
                  max={100}
                  onChange={(e) => updateQuestion(qIndex, { marks: Number(e.target.value) })}
                  className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-center focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add Question Button */}
        <button
          onClick={addQuestion}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Question
        </button>
      </div>
    </div>
  );
}
