'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Edit2, Trash2, RefreshCw, Filter,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, X
} from 'lucide-react';
import { COURSES } from '@/types';

interface Student {
  _id: string;
  name: string;
  email: string;
  phone: string;
  studentId: string;
  course: string;
  batch: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const INITIAL_FORM = {
  name: '', email: '', phone: '', studentId: '',
  password: '', course: '', batch: '', status: 'active',
};

export default function StudentManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '15',
        ...(search && { search }),
        ...(courseFilter && { course: courseFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/students?${params}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setTotal(data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, courseFilter, statusFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const openCreate = () => {
    setEditingStudent(null);
    setForm({ ...INITIAL_FORM });
    setError('');
    setShowModal(true);
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setForm({
      name: student.name, email: student.email, phone: student.phone,
      studentId: student.studentId, password: '', course: student.course,
      batch: student.batch, status: student.status,
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const body = { ...form };
      if (editingStudent && !body.password) delete (body as { password?: string }).password;

      const res = await fetch(
        editingStudent ? `/api/students/${editingStudent._id}` : '/api/students',
        {
          method: editingStudent ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        return;
      }

      showToast('success', editingStudent ? 'Student updated!' : 'Student created!');
      setShowModal(false);
      fetchStudents();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Student deleted');
        setDeleteConfirm(null);
        fetchStudents();
      }
    } catch {
      showToast('error', 'Delete failed');
    }
  };

  const totalPages = Math.ceil(total / 15);

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
            <Users className="h-6 w-6 text-purple-600" /> Students
          </h1>
          <p className="text-slate-500 mt-1">{total} total students</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:from-purple-700 hover:to-violet-800 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <select
          value={courseFilter}
          onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
        >
          <option value="">All Courses</option>
          {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={fetchStudents} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 flex-shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{student.name}</p>
                          <p className="text-xs text-slate-400">{student.studentId} · {student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                        {student.course}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{student.batch}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        student.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(student)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(student._id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-slate-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-lg">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Rahul Sharma', required: true },
                  { name: 'email', label: 'Email', type: 'email', placeholder: 'student@gmail.com', required: true },
                  { name: 'phone', label: 'Phone', type: 'tel', placeholder: '9876543210', required: true },
                  { name: 'studentId', label: 'Student ID', type: 'text', placeholder: 'DNDC26001', required: true },
                  { name: 'password', label: editingStudent ? 'New Password (optional)' : 'Password', type: 'password', placeholder: '••••••••', required: !editingStudent },
                  { name: 'batch', label: 'Batch', type: 'text', placeholder: 'Batch 2026-A', required: true },
                ].map(({ name, label, type, placeholder, required }) => (
                  <div key={name}>
                    <label className="mb-1 block text-xs font-medium text-slate-700">{label}</label>
                    <input
                      type={type}
                      value={form[name as keyof typeof form]}
                      onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                      placeholder={placeholder}
                      required={required}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Course</label>
                  <select
                    value={form.course}
                    onChange={(e) => setForm((p) => ({ ...p, course: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Select Course</option>
                    {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 py-2.5 text-sm font-bold text-white disabled:opacity-70 hover:from-purple-700 hover:to-violet-800"
                >
                  {submitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Student?</h3>
            <p className="text-sm text-slate-500 mb-5">This action cannot be undone. All data associated with this student will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
