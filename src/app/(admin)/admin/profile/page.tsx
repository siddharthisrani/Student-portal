import { Metadata } from 'next';
import { getAuthUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Settings, Mail, Calendar, Shield } from 'lucide-react';

export const metadata: Metadata = { title: 'Profile | DNDC Admin Portal' };

export default async function AdminProfilePage() {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') redirect('/login');

  await connectDB();
  const admin = await Admin.findById(user.id).lean();
  if (!admin) redirect('/login');

  const a = admin as unknown as { name: string; email: string; createdAt: string; lastLogin: string; isActive: boolean };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Profile</h1>
        <p className="text-slate-500 mt-1">Your administrator account</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-slate-800 to-slate-900" />
        <div className="px-6 pb-6">
          <div className="-mt-8 mb-4 flex items-end gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white text-xl font-bold border-4 border-white shadow-md">
              {a.name.charAt(0).toUpperCase()}
            </div>
            <div className="mb-1">
              <h2 className="text-xl font-bold text-slate-900">{a.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                <Shield className="h-3 w-3" /> Administrator
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Mail, label: 'Email', value: a.email },
              { icon: Settings, label: 'Role', value: 'Administrator' },
              { icon: Calendar, label: 'Member Since', value: formatDate(a.createdAt) },
              { icon: Calendar, label: 'Last Login', value: a.lastLogin ? formatDateTime(a.lastLogin) : 'N/A' },
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
        </div>
      </div>
    </div>
  );
}
