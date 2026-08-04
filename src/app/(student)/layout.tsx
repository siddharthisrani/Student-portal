import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import StudentSidebar from '@/components/layout/StudentSidebar';
import { ToastProvider } from '@/components/ui/toast';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'student') {
    redirect('/admin/dashboard');
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <StudentSidebar
          user={{
            name: user.name,
            email: user.email,
            studentId: undefined,
            course: undefined,
          }}
        />
        <main className="lg:pl-64">
          <div className="pt-16 lg:pt-0">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
