import { Metadata } from 'next';
import TestManager from '@/components/admin/TestManager';

export const metadata: Metadata = { title: 'Tests | DNDC Admin Portal' };

export default function TestsPage() {
  return <TestManager />;
}
