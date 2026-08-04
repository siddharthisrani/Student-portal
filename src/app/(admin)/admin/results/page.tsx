import { Metadata } from 'next';
import ResultsManager from '@/components/admin/ResultsManager';

export const metadata: Metadata = { title: 'Results | DNDC Admin Portal' };

export default function AdminResultsPage() {
  return <ResultsManager />;
}
