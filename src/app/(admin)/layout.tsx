import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { ToastProvider } from '@/components/ui/toast';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'admin') {
    redirect('/student/dashboard');
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <AdminSidebar user={{ name: user.name, email: user.email }} />
        <main className="lg:pl-64">
          <div className="pt-16 lg:pt-0">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
