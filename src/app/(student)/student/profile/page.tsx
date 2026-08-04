import { Metadata } from 'next';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import Student from '@/models/Student';
import Submission from '@/models/Submission';
import { formatDate, formatDateTime } from '@/lib/utils';
import { User, Mail, Phone, BookOpen, Calendar, Hash } from 'lucide-react';

export const metadata: Metadata = { title: 'Profile | DNDC Student Portal' };

export default async function StudentProfilePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  await connectDB();

  const student = await Student.findById(user.id).select('-password').lean();
  if (!student) redirect('/login');

  const stats = await Submission.aggregate([
    { $match: { studentId: student._id } },
    {
      $group: {
        _id: null,
        totalTests: { $sum: 1 },
        totalScore: { $sum: '$totalScore' },
        totalMarks: { $sum: '$totalMarks' },
        passedTests: { $sum: { $cond: ['$isPassed', 1, 0] } },
        highestScore: { $max: '$percentage' },
        avgScore: { $avg: '$percentage' },
      },
    },
  ]);

  const s = stats[0] || { totalTests: 0, passedTests: 0, highestScore: 0, avgScore: 0 };
  const st = student as unknown as {
    name: string; email: string; phone: string; studentId: string;
    course: string; batch: string; status: string; lastLogin: string; createdAt: string;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Your account information</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-purple-600 to-violet-700" />
        <div className="px-6 pb-6">
          <div className="-mt-8 mb-4 flex items-end gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border-4 border-white shadow-md bg-gradient-to-br from-purple-500 to-violet-600 text-white text-xl font-bold">
              {st.name.charAt(0).toUpperCase()}
            </div>
            <div className="mb-1">
              <h2 className="text-xl font-bold text-slate-900">{st.name}</h2>
              <p className="text-sm text-slate-500">{st.studentId}</p>
            </div>
            <span className={`mb-1 ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
              st.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
            }`}>
              {st.status}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Mail, label: 'Email', value: st.email },
              { icon: Phone, label: 'Phone', value: st.phone },
              { icon: Hash, label: 'Student ID', value: st.studentId },
              { icon: BookOpen, label: 'Course', value: st.course },
              { icon: Calendar, label: 'Batch', value: st.batch },
              { icon: User, label: 'Member Since', value: formatDate(st.createdAt) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                  <Icon className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-medium text-slate-900">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {st.lastLogin && (
            <p className="mt-4 text-xs text-slate-400 text-center">
              Last login: {formatDateTime(st.lastLogin)}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Tests Taken', value: s.totalTests, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Tests Passed', value: s.passedTests, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg Score', value: `${Math.round(s.avgScore || 0)}%`, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Highest Score', value: `${Math.round(s.highestScore || 0)}%`, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl ${bg} p-4 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Note:</strong> To update your profile or reset your password, please contact DNDC at{' '}
        <a href="tel:+916261437008" className="font-semibold underline">+91 62614 37008</a> or{' '}
        <a href="mailto:dndc.bpl@gmail.com" className="font-semibold underline">dndc.bpl@gmail.com</a>
      </div>
    </div>
  );
}
