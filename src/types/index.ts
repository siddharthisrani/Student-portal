export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  avatar?: string;
  studentId?: string;
  course?: string;
  batch?: string;
}

export interface StudentData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  studentId: string;
  course: string;
  batch: string;
  status: 'active' | 'inactive';
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface TestData {
  _id: string;
  title: string;
  description: string;
  course: string;
  date: string;
  duration: number;
  totalMarks: number;
  totalQuestions: number;
  status: 'draft' | 'published' | 'expired';
  passingMarks: number;
  instructions: string[];
  createdAt: string;
}

export interface QuestionData {
  _id: string;
  testId: string;
  type: 'mcq' | 'image_mcq' | 'pdf_mcq' | 'text';
  question: string;
  options: { id: string; text: string }[];
  correctAnswer?: string;
  marks: number;
  imageUrl?: string;
  pdfUrl?: string;
  order: number;
}

export interface SubmissionData {
  _id: string;
  testId: TestData;
  studentId: StudentData;
  totalScore: number;
  totalMarks: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  isPassed: boolean;
  passingMarks: number;
  startedAt: string;
  submittedAt: string;
  timeTaken: number;
  isAutoSubmitted: boolean;
}

export interface DashboardStats {
  totalTests: number;
  completedTests: number;
  averageScore: number;
  highestScore: number;
  passedTests: number;
  failedTests: number;
}

export interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  totalTests: number;
  todaysTests: number;
  totalSubmissions: number;
  averageScore: number;
}

export type CourseType =
  | 'MERN Stack'
  | 'Java Full Stack'
  | 'Python Full Stack'
  | 'Data Analytics'
  | 'AI & Machine Learning'
  | 'Flutter'
  | 'UI/UX';

export const COURSES: CourseType[] = [
  'MERN Stack',
  'Java Full Stack',
  'Python Full Stack',
  'Data Analytics',
  'AI & Machine Learning',
  'Flutter',
  'UI/UX',
];

export const COURSE_COLORS: Record<string, string> = {
  'MERN Stack': 'from-green-500 to-emerald-600',
  'Java Full Stack': 'from-orange-500 to-red-600',
  'Python Full Stack': 'from-blue-500 to-cyan-600',
  'Data Analytics': 'from-purple-500 to-violet-600',
  'AI & Machine Learning': 'from-pink-500 to-rose-600',
  'Flutter': 'from-sky-500 to-blue-600',
  'UI/UX': 'from-yellow-500 to-amber-600',
};

export const COURSE_ICONS: Record<string, string> = {
  'MERN Stack': '⚛️',
  'Java Full Stack': '☕',
  'Python Full Stack': '🐍',
  'Data Analytics': '📊',
  'AI & Machine Learning': '🤖',
  'Flutter': '📱',
  'UI/UX': '🎨',
};
