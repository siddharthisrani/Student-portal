'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Search, Download, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface ResultRow {
  _id: string;
  student: { name: string; studentId: string; course: string };
  test: { title: string; date: string };
  totalScore: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
  timeTaken: number;
  correctAnswers: number;
  wrongAnswers: number;
}

export default function ResultsManager() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '20',
        ...(search && { search }),
      });
      const res = await fetch(`/api/results?${params}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
        setTotal(data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({ export: 'csv', ...(search && { search }) });
      const res = await fetch(`/api/results?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dndc_results.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed');
    }
  };

  const totalPages = Math.ceil(total / 20);
  const passRate = results.length > 0 ? Math.round((results.filter((r) => r.isPassed).length / results.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" /> Results
          </h1>
          <p className="text-slate-500 mt-1">{total} total submissions • {passRate}% pass rate</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name, ID, test name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        />
      </div>

      {/* Stats Row */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Pass Rate',
              value: `${passRate}%`,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50',
            },
            {
              label: 'Avg Score',
              value: `${Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)}%`,
              color: 'text-purple-600',
              bg: 'bg-purple-50',
            },
            {
              label: 'Shown',
              value: results.length,
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl ${bg} p-4 text-center`}>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading results...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500">No results found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Test</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((result) => (
                  <tr key={result._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 flex-shrink-0">
                          {result.student?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{result.student?.name}</p>
                          <p className="text-xs text-slate-400">{result.student?.studentId} · {result.student?.course}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="font-medium text-slate-900">{result.test?.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-base font-bold ${result.isPassed ? 'text-emerald-600' : 'text-red-500'}`}>
                        {result.percentage}%
                      </p>
                      <p className="text-xs text-slate-400">{result.totalScore}/{result.totalMarks}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        result.isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {result.isPassed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {result.isPassed ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                      {formatDateTime(result.submittedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-500">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-slate-600">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
