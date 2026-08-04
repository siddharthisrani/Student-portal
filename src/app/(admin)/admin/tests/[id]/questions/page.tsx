import { Metadata } from 'next';
import QuestionBuilder from '@/components/admin/QuestionBuilder';

export const metadata: Metadata = { title: 'Question Builder | DNDC Admin' };

export default async function QuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuestionBuilder testId={id} />;
}
