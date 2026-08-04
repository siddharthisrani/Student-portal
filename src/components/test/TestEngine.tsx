'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle,
  BookOpen, Flag, Send
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface Option {
  id: string;
  text: string;
}

interface Question {
  _id: string;
  type: 'mcq' | 'image_mcq' | 'pdf_mcq' | 'text';
  question: string;
  options: Option[];
  marks: number;
  imageUrl?: string;
  pdfUrl?: string;
  order: number;
}

interface Test {
  _id: string;
  title: string;
  description: string;
  duration: number;
  totalMarks: number;
  totalQuestions: number;
  passingMarks: number;
  instructions: string[];
}

interface TestEngineProps {
  test: Test;
  questions: Question[];
}

type Screen = 'instructions' | 'test' | 'confirm' | 'submitting' | 'result';

export default function TestEngine({ test, questions }: TestEngineProps) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('instructions');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [timeLeft, setTimeLeft] = useState(test.duration * 60);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [isAutoSubmit, setIsAutoSubmit] = useState(false);
  const [result, setResult] = useState<{
    totalScore: number;
    totalMarks: number;
    percentage: number;
    correctAnswers: number;
    wrongAnswers: number;
    skippedAnswers: number;
    isPassed: boolean;
    submissionId: string;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const submitTest = useCallback(
    async (auto = false) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setScreen('submitting');

      try {
        const res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: test._id,
            answers,
            startedAt: startedAt?.toISOString(),
            isAutoSubmitted: auto,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setResult(data.result);
          setScreen('result');
        } else {
          alert(data.message || 'Submission failed');
          setScreen('test');
        }
      } catch {
        alert('Network error during submission. Please try again.');
        setScreen('test');
      }
    },
    [answers, startedAt, test._id]
  );

  // Timer
  useEffect(() => {
    if (screen !== 'test') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsAutoSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen]);

  // Auto submit when timer hits 0
  useEffect(() => {
    if (isAutoSubmit) {
      submitTest(true);
    }
  }, [isAutoSubmit, submitTest]);

  const startTest = () => {
    setStartedAt(new Date());
    setScreen('test');
  };

  const selectAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === optionId ? null : optionId,
    }));
  };

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const currentQuestion = questions[currentIndex];
  const isWarning = timeLeft <= 60 && timeLeft > 0;
  const isCritical = timeLeft <= 30 && timeLeft > 0;

  // Instructions Screen
  if (screen === 'instructions') {
    return (
      <div className="min-h-screen p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-violet-700 px-6 py-5 text-white">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-5 w-5 text-white/80" />
                <span className="text-sm text-white/80">Test Instructions</span>
              </div>
              <h1 className="text-xl font-bold">{test.title}</h1>
              {test.description && <p className="text-sm text-white/80 mt-1">{test.description}</p>}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{test.totalQuestions}</p>
                <p className="text-xs text-slate-500 mt-0.5">Questions</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{test.totalMarks}</p>
                <p className="text-xs text-slate-500 mt-0.5">Total Marks</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{test.duration}</p>
                <p className="text-xs text-slate-500 mt-0.5">Minutes</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-6">
              <h2 className="font-semibold text-slate-900 mb-3">Instructions</h2>
              <ul className="space-y-2">
                {test.instructions.map((inst, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    {inst}
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  Passing marks: {test.passingMarks} out of {test.totalMarks}
                </li>
              </ul>
            </div>

            {/* Warning */}
            <div className="mx-6 mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Important:</strong> Once you start the test, you cannot pause it. The test will auto-submit when
                  time runs out. Each test can only be attempted once.
                </p>
              </div>
            </div>

            {/* Action */}
            <div className="p-6 pt-2">
              <button
                onClick={startTest}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 hover:from-purple-700 hover:to-violet-800 active:scale-[0.98] transition-all"
              >
                Start Test Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Submitting Screen
  if (screen === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <h2 className="text-lg font-semibold text-slate-900">Submitting your test...</h2>
          <p className="text-slate-500 text-sm mt-1">Please wait, do not close this page.</p>
        </div>
      </div>
    );
  }

  // Result Screen
  if (screen === 'result' && result) {
    const grade =
      result.percentage >= 90 ? 'A+' :
      result.percentage >= 80 ? 'A' :
      result.percentage >= 70 ? 'B+' :
      result.percentage >= 60 ? 'B' :
      result.percentage >= 50 ? 'C' :
      result.percentage >= 40 ? 'D' : 'F';

    return (
      <div className="min-h-screen p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Result Header */}
            <div
              className={`px-6 py-8 text-center ${
                result.isPassed
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                  : 'bg-gradient-to-br from-red-500 to-rose-600'
              } text-white`}
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                {result.isPassed ? (
                  <CheckCircle2 className="h-8 w-8 text-white" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-bold">{result.isPassed ? '🎉 Congratulations!' : 'Better Luck Next Time'}</h1>
              <p className="text-white/80 mt-1 text-sm">
                {result.isPassed
                  ? 'You have passed this test!'
                  : `You need ${test.passingMarks} marks to pass.`}
              </p>
              <div className="mt-4 text-5xl font-black">{result.percentage}%</div>
              <div className="text-white/80 text-sm mt-1">
                Grade: <span className="font-bold text-white">{grade}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              <div className="p-4 text-center">
                <p className="text-xl font-bold text-emerald-600">{result.correctAnswers}</p>
                <p className="text-xs text-slate-500 mt-0.5">Correct</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xl font-bold text-red-500">{result.wrongAnswers}</p>
                <p className="text-xs text-slate-500 mt-0.5">Wrong</p>
              </div>
              <div className="p-4 text-center">
                <p className="text-xl font-bold text-slate-400">{result.skippedAnswers}</p>
                <p className="text-xs text-slate-500 mt-0.5">Skipped</p>
              </div>
            </div>

            <div className="p-5 border-b border-slate-100">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Your Score</span>
                <span className="font-semibold text-slate-900">
                  {result.totalScore} / {result.totalMarks}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    result.isPassed ? 'bg-emerald-500' : 'bg-red-400'
                  }`}
                  style={{ width: `${result.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0</span>
                <span>Passing: {test.passingMarks}</span>
                <span>{result.totalMarks}</span>
              </div>
            </div>

            <div className="p-5 flex gap-3">
              <button
                onClick={() => router.push(`/student/results/${result.submissionId}`)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Review Answers
              </button>
              <button
                onClick={() => router.push('/student/dashboard')}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 py-2.5 text-sm font-bold text-white hover:from-purple-700 hover:to-violet-800 transition-all"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirm Submit Dialog
  if (screen === 'confirm') {
    const unanswered = questions.length - answeredCount;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Submit Test?</h3>
          <p className="text-sm text-slate-500 mb-4">
            {unanswered > 0
              ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Once submitted, you cannot retake this test.`
              : 'All questions answered! Once submitted, you cannot retake this test.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setScreen('test')}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => submitTest(false)}
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 py-2.5 text-sm font-bold text-white hover:from-purple-700 hover:to-violet-800 transition-all"
            >
              Submit Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test Screen
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Test Header */}
      <header className="fixed top-0 left-0 right-0 lg:left-64 z-30 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-slate-900 hidden sm:block">{test.title}</h1>
            <span className="text-xs text-slate-400 hidden sm:block">
              Q{currentIndex + 1}/{questions.length}
            </span>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${
              isCritical
                ? 'bg-red-100 text-red-700 timer-warning'
                : isWarning
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="text-sm font-bold tabular-nums">{formatDuration(timeLeft)}</span>
          </div>

          <button
            onClick={() => setScreen('confirm')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 px-4 py-1.5 text-xs font-bold text-white hover:from-purple-700 hover:to-violet-800 transition-all"
          >
            <Send className="h-3 w-3" />
            Submit
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-600 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 pt-[73px]">
        {/* Question Area */}
        <main className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                  {currentIndex + 1}
                </span>
                <span className="text-xs text-slate-400">{currentQuestion.marks} mark{currentQuestion.marks !== 1 ? 's' : ''}</span>
              </div>
              {answers[currentQuestion._id] && (
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Answered
                </div>
              )}
            </div>

            {/* Image */}
            {currentQuestion.imageUrl && (
              <div className="mb-4 rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question image"
                  className="w-full max-h-64 object-contain"
                />
              </div>
            )}

            {/* PDF */}
            {currentQuestion.pdfUrl && (
              <div className="mb-4">
                <a
                  href={currentQuestion.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  View Reference PDF
                </a>
              </div>
            )}

            {/* Question Text */}
            <p className="text-base text-slate-900 leading-relaxed mb-5">{currentQuestion.question}</p>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, i) => {
                const isSelected = answers[currentQuestion._id] === option.id;
                const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
                return (
                  <button
                    key={option.id}
                    onClick={() => selectAnswer(currentQuestion._id, option.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-all hover:border-purple-400 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {labels[i]}
                    </span>
                    <span className={`text-sm ${isSelected ? 'text-purple-700 font-medium' : 'text-slate-700'}`}>
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-sm text-slate-400">
                {answeredCount}/{questions.length} answered
              </span>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-all"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setScreen('confirm')}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 px-4 py-2 text-sm font-bold text-white hover:from-purple-700 hover:to-violet-800 transition-all"
                >
                  <Flag className="h-4 w-4" />
                  Finish
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Question Navigator - Desktop */}
        <aside className="hidden xl:block w-56 p-4 pt-6">
          <div className="sticky top-[80px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Questions</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, i) => {
                const isAnswered = !!answers[q._id];
                const isCurrent = i === currentIndex;
                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-purple-600 text-white shadow-md'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-emerald-100" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-slate-100" />
                <span>Not answered ({questions.length - answeredCount})</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
