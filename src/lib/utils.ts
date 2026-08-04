import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculatePercentage(score: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}

export function getGrade(percentage: number): { grade: string; color: string; message: string } {
  if (percentage >= 90) return { grade: 'A+', color: 'text-emerald-500', message: 'Outstanding Performance!' };
  if (percentage >= 80) return { grade: 'A', color: 'text-green-500', message: 'Excellent Work!' };
  if (percentage >= 70) return { grade: 'B+', color: 'text-blue-500', message: 'Good Performance!' };
  if (percentage >= 60) return { grade: 'B', color: 'text-indigo-500', message: 'Above Average!' };
  if (percentage >= 50) return { grade: 'C', color: 'text-yellow-500', message: 'Average Performance' };
  if (percentage >= 40) return { grade: 'D', color: 'text-orange-500', message: 'Below Average' };
  return { grade: 'F', color: 'text-red-500', message: 'Needs Improvement' };
}

export function generateStudentId(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `DNDC${year}${random}`;
}

export function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, '').trim();
}
