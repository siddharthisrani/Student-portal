import { Metadata } from 'next';
import { getAuthUser } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import Submission from '@/models/Submission';
import Question from '@/models/Question';
import Link from 'next/link';
import { CheckCircle2, XCircle, Minus, ArrowLeft, Clock, Calendar } from 'lucide-react';
import { formatDateTime, getGrade } from '@/lib/utils';

export const metadata: Metadata = { title: 'Test Result | DNDC Student Portal' };

export default async function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const { id } = await params;
  await connectDB();

  const submission = await Submission.findById(id)
    .populate('testId', 'title course date duration totalMarks passingMarks instructions')
    .populate('studentId', 'name studentId course batch')
    .lean();

  if (!submission) notFound();

  const studentId = (submission.studentId as unknown as { _id: string })._id.toString();
  if (user.role === 'student' && studentId !== user.id) notFound();

  const questions = await Question.find({
    testId: (submission.testId as unknown as { _id: string })._id,
  })
    .sort({ order: 1 })
    .lean();

  const test = submission.testId as unknown as {
    title: string; course: string; date: string; totalMarks: number; passingMarks: number;
  };
  const student = submission.studentId as unknown as { name: string; studentId: string; course: string };

  const { grade, color, message } = getGrade(submission.percentage);

  // Build answer map
  const answerMap: Record<string, { selected: string | null; isCorrect: boolean }> = {};
  submission.answers.forEach((a) => {
    answerMap[a.questionId.toString()] = {
      selected: a.selectedAnswer,
      isCorrect: a.isCorrect,
    };
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-12">
      {/* Back */}
      <Link
        href="/student/results"
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to History
      </Link>

      {/* Result Card */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div
          className={`px-6 py-8 text-center ${
            submission.isPassed
              ? 'bg-gradient-to-br from-emerald-500 to-green-600'
              : 'bg-gradient-to-br from-red-500 to-rose-600'
          } text-white`}
        >
          <h1 className="text-lg font-bold mb-1">{test.title}</h1>
          <p className="text-white/70 text-sm mb-4">{test.course}</p>

          <div className="text-5xl font-black mb-1">{submission.percentage}%</div>
          <div className={`text-lg font-bold ${color.replace('text-', 'text-white')} opacity-90`}>
            Grade: {grade} — {message}
          </div>
          <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
            submission.isPassed ? 'bg-white/20 text-white' : 'bg-white/20 text-white'
          }`}>
            {submission.isPassed ? '✓ PASSED' : '✗ FAILED'}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
          <div className="p-4 text-center">
            <p className="text-xl font-bold text-slate-900">{submission.totalScore}/{submission.totalMarks}</p>
            <p className="text-xs text-slate-500 mt-0.5">Score</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xl font-bold text-emerald-600">{submission.correctAnswers}</p>
            <p className="text-xs text-slate-500 mt-0.5">Correct</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xl font-bold text-red-500">{submission.wrongAnswers}</p>
            <p className="text-xs text-slate-500 mt-0.5">Wrong</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xl font-bold text-slate-400">{submission.skippedAnswers}</p>
            <p className="text-xs text-slate-500 mt-0.5">Skipped</p>
          </div>
        </div>

        {/* Meta */}
        <div className="px-6 py-4 flex flex-wrap items-center gap-4 border-b border-slate-100 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDateTime(submission.submittedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {Math.floor(submission.timeTaken / 60)}m {submission.timeTaken % 60}s taken
          </span>
          {submission.isAutoSubmitted && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Auto-submitted
            </span>
          )}
        </div>
      </div>

      {/* Answer Review */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Answer Review</h2>
        <div className="space-y-4">
          {questions.map((q, index) => {
            const qId = (q as unknown as { _id: string })._id.toString();
            const ans = answerMap[qId];
            const isCorrect = ans?.isCorrect;
            const isSkipped = !ans?.selected;
            const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
            const questionData = q as unknown as {
              question: string; options: { id: string; text: string }[];
              correctAnswer: string; marks: number; imageUrl?: string;
            };

            return (
              <div key={qId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {index + 1}
                    </span>
                    <span className="text-xs text-slate-400">{questionData.marks} mark(s)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isSkipped
                        ? 'bg-slate-100 text-slate-500'
                        : isCorrect
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {isSkipped ? (
                      <><Minus className="h-3 w-3" />Skipped</>
                    ) : isCorrect ? (
                      <><CheckCircle2 className="h-3 w-3" />Correct</>
                    ) : (
                      <><XCircle className="h-3 w-3" />Incorrect</>
                    )}
                  </div>
                </div>

                {questionData.imageUrl && (
                  <img src={questionData.imageUrl} alt="question" className="mb-3 rounded-xl max-h-48 object-contain" />
                )}

                <p className="text-sm text-slate-900 mb-4 leading-relaxed">{questionData.question}</p>

                <div className="space-y-2">
                  {questionData.options.map((option, i) => {
                    const isThisCorrect = option.id === questionData.correctAnswer;
                    const isThisSelected = ans?.selected === option.id;

                    return (
                      <div
                        key={option.id}
                        className={`flex items-center gap-3 rounded-xl border-2 p-3 text-sm ${
                          isThisCorrect
                            ? 'border-emerald-400 bg-emerald-50'
                            : isThisSelected && !isThisCorrect
                            ? 'border-red-400 bg-red-50'
                            : 'border-slate-100 bg-white'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold flex-shrink-0 ${
                            isThisCorrect
                              ? 'bg-emerald-500 text-white'
                              : isThisSelected
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {labels[i]}
                        </span>
                        <span
                          className={
                            isThisCorrect
                              ? 'text-emerald-700 font-medium'
                              : isThisSelected
                              ? 'text-red-600'
                              : 'text-slate-700'
                          }
                        >
                          {option.text}
                        </span>
                        {isThisCorrect && (
                          <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500 flex-shrink-0" />
                        )}
                        {isThisSelected && !isThisCorrect && (
                          <XCircle className="ml-auto h-4 w-4 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
