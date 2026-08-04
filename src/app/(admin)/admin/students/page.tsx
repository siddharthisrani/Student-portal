import { Metadata } from 'next';
import StudentManager from '@/components/admin/StudentManager';

export const metadata: Metadata = { title: 'Students | DNDC Admin Portal' };

export default function StudentsPage() {
  return <StudentManager />;
}
