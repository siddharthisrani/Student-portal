import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | DNDC Student Assessment Portal',
  description: 'Login to the DNDC Student Assessment Portal to access your daily tests and track your progress.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
