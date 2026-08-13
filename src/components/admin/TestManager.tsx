'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Plus, Edit2, Trash2, Eye, BookOpen, Calendar,
  Clock, CheckCircle2, XCircle, X, ChevronRight
} from 'lucide-react';
import { COURSES } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Test {
  _id: string;
  title: string;
  description: string;
  course: string;
  date: string;
  duration: number;
  totalMarks: number;
  totalQuestions: number;
  status: 'draft' | 'published' | 'expired';
  passingMarks: number;
  targetType:
  | "all"
  | "course"
  | "batch"
  | "students";
batch: string;
studentIds: string[];
}

 type TestForm = {
  title: string;
  description: string;

  targetType: "all" | "course" | "batch" | "students";

  course: string;

  batch: string;

  studentIds: string[];

  date: string;

  duration: number;

  passingMarks: number;

  status: "draft" | "published" | "expired";
};

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-600',
};

const INITIAL_FORM: TestForm = {
  title: "",
  description: "",

  targetType: "course",

  course: "All",

  batch: "All",

  studentIds: [],

  date: "",

  duration: 30,

  passingMarks: 0,

  status: "draft",
};

export default function TestManager() {
  const [tests, setTests] = useState<Test[]>([]);
  const [batches, setBatches] = useState<string[]>([]);

  const [studentSearch, setStudentSearch] = useState("");

const [students, setStudents] = useState<
  {
    _id: string;
    name: string;
    studentId: string;
    batch: string;
    course: string;
  }[]
>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
 

const [form, setForm] = useState<TestForm>({
  ...INITIAL_FORM,
});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tests?limit=50');
      const data = await res.json();
      if (data.success) setTests(data.tests);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBatches = async (course: string) => {
  if (
    course === "All" ||
    !course
  ) {
    setBatches([]);
    return;
  }

  try {
    const res = await fetch(
      `/api/batches?course=${encodeURIComponent(
        course
      )}`
    );

    const data = await res.json();

    if (data.success) {
      setBatches(data.batches);
    }
  } catch (error) {
    console.error(error);
  }
};

const fetchStudents = async (
  course: string,
  keyword = ""
) => {
  try {
    const res = await fetch(
      `/api/students/search?course=${encodeURIComponent(
        course
      )}&q=${encodeURIComponent(keyword)}`
    );

    const data = await res.json();

    if (data.success) {
      setStudents(data.students);
    }
  } catch (error) {
    console.error(error);
  }
};

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const openCreate = () => {
    setEditingTest(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setForm({
      ...INITIAL_FORM,
      date: tomorrow.toISOString().split('T')[0],
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (test: Test) => {
  setEditingTest(test);

  const studentIds = Array.isArray(test.studentIds)
    ? test.studentIds.map((id: any) => id.toString())
    : [];

  setForm({
    title: test.title,
    description: test.description,

    targetType: test.targetType,

    course: test.course,

    batch: test.batch,

    studentIds,

    date: new Date(test.date).toISOString().split("T")[0],

    duration: test.duration,

    passingMarks: test.passingMarks,

    status: test.status,
  });

  // Load required data immediately when editing
  if (test.targetType === "batch") {
    fetchBatches(test.course);
  }

  if (test.targetType === "students") {
    setStudentSearch("");

    // IMPORTANT:
    // Load all students of this course immediately.
    // This makes previously selected students visible
    // without clicking the search input.
    fetchStudents(test.course, "");
  }

  setError('');
  setShowModal(true);
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(
        editingTest ? `/api/tests/${editingTest._id}` : '/api/tests',
        {
          method: editingTest ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            duration: Number(form.duration),
            passingMarks: Number(form.passingMarks),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }

      showToast('success', editingTest ? 'Test updated!' : 'Test created!');
      setShowModal(false);
      fetchTests();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Test deleted');
        setDeleteConfirm(null);
        fetchTests();
      }
    } catch {
      showToast('error', 'Delete failed');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/tests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchTests();
      showToast('success', `Test ${status}!`);
    } catch {
      showToast('error', 'Failed to update status');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-purple-600" /> Tests
          </h1>
          <p className="text-slate-500 mt-1">{tests.length} total tests</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:from-purple-700 hover:to-violet-800 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" /> Create Test
        </button>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1,2,3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-3 w-3/4" />
              <div className="h-3 bg-slate-100 rounded mb-2 w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <p className="font-medium text-slate-900 mb-1">No tests created yet</p>
          <p className="text-sm text-slate-500 mb-4">Create your first test to get started</p>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Create Test
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tests.map((test) => (
            <div key={test._id} className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-semibold text-slate-900 leading-snug">{test.title}</h3>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[test.status]}`}>
                    {test.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{test.course}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(test.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{test.duration}m</span>
                    <span>{test.totalQuestions} Q</span>
                    <span>{test.totalMarks} marks</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(test)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <Link href={`/admin/tests/${test._id}/questions`} className="rounded-lg p-1.5 text-slate-400 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button onClick={() => setDeleteConfirm(test._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {test.status === 'draft' && (
                  <button
                    onClick={() => handleStatusChange(test._id, 'published')}
                    className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200 transition-colors"
                  >
                    Publish <ChevronRight className="h-3 w-3" />
                  </button>
                )}
                {test.status === 'published' && (
                  <button
                    onClick={() => handleStatusChange(test._id, 'expired')}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Expire
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-lg">
                {editingTest ? 'Edit Test' : 'Create New Test'}
              </h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[82vh] px-8 py-7 space-y-8">
              {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>}

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Test Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. React Hooks MCQ Test" required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Description (optional)</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of the test..." rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none resize-none" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4 space-y-4">

<h3 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
Assign Test To
</h3>

<label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-purple-50">

<input
type="radio"
value="all"
checked={form.targetType==="all"}
onChange={(e)=>
setForm({
...form,
targetType: e.target.value as
  | "all"
  | "course"
  | "batch"
  | "students",
course:"All",
batch:"All"
})
}
/>

All Students

</label>

<label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-purple-50">

<input
type="radio"
value="course"
checked={form.targetType==="course"}
onChange={(e)=>
setForm({
...form,
targetType: e.target.value as
  | "all"
  | "course"
  | "batch"
  | "students"
})
}
/>

Course

</label>

<label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-purple-50">

<input
type="radio"
value="batch"
checked={form.targetType==="batch"}
onChange={(e)=>
setForm({
...form,
targetType: e.target.value as
  | "all"
  | "course"
  | "batch"
  | "students"
})
}
/>

Batch

</label>

<label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-purple-50">

<input
type="radio"
value="students"
checked={form.targetType==="students"}
onChange={(e) => {
  setStudents([]);
  setStudentSearch("");

  setForm((prev) => ({
    ...prev,
    targetType: "students",
    studentIds: [],
  }));

  fetchStudents(form.course);
}}
/>

Selected Students

</label>

</div>
{form.targetType !== "all" && (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-700">
      Course
    </label>

    <select
      value={form.course}
      onChange={(e) => {
  const course = e.target.value;

  // clear old UI
  setStudents([]);
  setStudentSearch("");

  setForm((prev) => ({
    ...prev,
    course,
    batch: "All",
    studentIds: [],
  }));

  fetchBatches(course);

  if (form.targetType === "students") {
    fetchStudents(course);
  }
}}
      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
    >
      <option value="All">All Courses</option>

      {COURSES.map((course) => (
        <option key={course} value={course}>
          {course}
        </option>
      ))}
    </select>
  </div>
)}

{form.targetType === "batch" && (
  <div>
    <label className="mb-1 block text-xs font-medium text-slate-700">
      Batch
    </label>

    <select
      value={form.batch}
      onChange={(e) =>
        setForm((p) => ({
          ...p,
          batch: e.target.value,
        }))
      }
      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
    >
      <option value="All">All Batches</option>

      {batches.map((batch) => (
        <option
          key={batch}
          value={batch}
        >
          {batch}
        </option>
      ))}
    </select>
  </div>
)}

{form.targetType === "students" && (
  <div className="space-y-4">

    {/* Search */}

    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        Search Student
      </label>

      <input
        type="text"
        placeholder="🔍 Search by Name or Student ID..."
        value={studentSearch}
        onChange={(e) => {
          setStudentSearch(e.target.value);
          fetchStudents(form.course, e.target.value);
        }}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
      />
    </div>

    {/* Selected Chips */}

    {form.studentIds.length > 0 && (
      <div className="rounded-2xl border border-purple-200 bg-purple-50 p-3">
  <div className="mb-2 flex items-center justify-between">

    <p className="text-sm font-semibold text-purple-700">
      Selected Students
    </p>

    <span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs text-white">
      {form.studentIds.length}
    </span>

  </div>

  <div className="flex flex-wrap gap-2">

        {students
          .filter((s) => form.studentIds.includes(s._id))
          .map((student) => (
            <span
              key={student._id}
              className="flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
            >
              {student.name}

              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    studentIds: prev.studentIds.filter(
                      (id) => id !== student._id
                    ),
                  }))
                }
              >
                ✕
              </button>
            </span>
          ))}
          </div>
      </div>
    )}

    {/* Student List */}

   <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-inner">

      {students.length === 0 ? (
        <p className="p-4 text-center text-sm text-slate-500">
          No students found
        </p>
      ) : (
        students.map((student) => {
          const selected = form.studentIds.includes(student._id);

          return (
            <label
              key={student._id}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all mb-2
${
  selected
    ? "border-purple-500 bg-purple-50"
    : "border-slate-200 hover:border-purple-300 hover:bg-slate-50"
}`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => {
                  setForm((prev) => ({
                    ...prev,
                    studentIds: selected
                      ? prev.studentIds.filter(
                          (id) => id !== student._id
                        )
                      : [...prev.studentIds, student._id],
                  }));
                }}
              />

              <div className="flex-1">

                <p className="font-medium text-slate-900">
                  {student.name}
                </p>

                <p className="text-xs text-slate-500">
                  {student.studentId} • {student.batch}
                </p>

              </div>

            </label>
          );
        })
      )}
    </div>

  </div>
)}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Test Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Duration (minutes)</label>
                  <input type="number" value={form.duration} min={5} max={300}
                    onChange={(e) => setForm((p) => ({ ...p, duration: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Passing Marks</label>
                  <input type="number" value={form.passingMarks} min={0}
                    onChange={(e) => setForm((p) => ({ ...p, passingMarks: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Status</label>
                <select value={form.status} onChange={(e) =>
  setForm((p) => ({
    ...p,
    status: e.target.value as
      | "draft"
      | "published"
      | "expired",
  }))
}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 py-2.5 text-sm font-bold text-white disabled:opacity-70">
                  {submitting ? 'Saving...' : editingTest ? 'Update Test' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Test?</h3>
            <p className="text-sm text-slate-500 mb-5">This will permanently delete the test and all its questions.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
