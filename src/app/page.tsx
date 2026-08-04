import { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen, Code2, Brain, BarChart3, Smartphone, Palette,
  CheckCircle2, ArrowRight, Star, Users, Trophy, Clock,
  FlaskConical, Shield, Zap, Target
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'DNDC Student Assessment Portal | Daily Coding Tests & MCQs',
  description: 'The official student assessment portal for DNDC Bhopal. Attend daily coding tests, MCQ quizzes, and track your progress across MERN Stack, Java, Python, Data Analytics, AI/ML, Flutter courses.',
};

const courses = [
  {
    icon: Code2,
    name: 'MERN Stack',
    desc: 'MongoDB, Express, React, Node.js — Build full-stack JavaScript apps.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    tags: ['MongoDB', 'React', 'Node.js'],
  },
  {
    icon: FlaskConical,
    name: 'Java Full Stack',
    desc: 'Spring Boot, Hibernate, React — Enterprise-grade Java development.',
    color: 'from-orange-500 to-red-600',
    bg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    tags: ['Spring Boot', 'Hibernate', 'MySQL'],
  },
  {
    icon: Zap,
    name: 'Python Full Stack',
    desc: 'Django, Flask, React — Python-powered web development.',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    tags: ['Django', 'Flask', 'PostgreSQL'],
  },
  {
    icon: BarChart3,
    name: 'Data Analytics',
    desc: 'Excel, SQL, Power BI, Python — Turn data into decisions.',
    color: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    tags: ['Power BI', 'SQL', 'Python'],
  },
  {
    icon: Brain,
    name: 'AI & Machine Learning',
    desc: 'TensorFlow, Scikit-Learn — Build intelligent systems.',
    color: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50',
    iconColor: 'text-pink-600',
    tags: ['TensorFlow', 'PyTorch', 'NLP'],
  },
  {
    icon: Smartphone,
    name: 'Flutter',
    desc: 'Dart, Flutter — Cross-platform mobile app development.',
    color: 'from-sky-500 to-cyan-600',
    bg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    tags: ['Dart', 'Flutter', 'Firebase'],
  },
  {
    icon: Palette,
    name: 'UI/UX Design',
    desc: 'Figma, Design Thinking — Create stunning user experiences.',
    color: 'from-amber-500 to-yellow-600',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    tags: ['Figma', 'Prototyping', 'Research'],
  },
];

const benefits = [
  {
    icon: Target,
    title: 'Daily Practice Tests',
    desc: 'Concept-focused tests every day to reinforce learning and identify weak areas.',
  },
  {
    icon: Trophy,
    title: 'Instant Results',
    desc: 'Get scores, correct answers, and performance analytics immediately after submission.',
  },
  {
    icon: BookOpen,
    title: 'Track Progress',
    desc: 'View your complete test history, percentages, and improvement over time.',
  },
  {
    icon: Shield,
    title: 'Secure & Fair',
    desc: 'One attempt per test, auto-submit timer, and tamper-proof submissions.',
  },
];

const stats = [
  { value: '2500+', label: 'Students Trained' },
  { value: '7+', label: 'Years of Excellence' },
  { value: '100%', label: 'Placement Assistance' },
  { value: '95%', label: 'Placement Success' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 text-white">
              <span className="text-sm font-bold">D</span>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">DNDC</div>
              <div className="text-xs text-slate-500 leading-none">Exam Portal</div>
            </div>
          </Link>

          <div className="hidden items-center gap-6 sm:flex">
            <Link href="#about" className="text-sm text-slate-600 hover:text-purple-600 transition-colors">
              About
            </Link>
            <Link href="#courses" className="text-sm text-slate-600 hover:text-purple-600 transition-colors">
              Courses
            </Link>
            <Link
              href="https://dndc.in"
              target="_blank"
              className="text-sm text-slate-600 hover:text-purple-600 transition-colors"
            >
              Main Website
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 px-5 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:from-purple-700 hover:to-violet-800 active:scale-[0.98]"
            >
              Student Login
            </Link>
          </div>

          {/* Mobile login button */}
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white sm:hidden"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-purple-100/60 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-amber-100/60 blur-3xl" />
          <div className="absolute top-1/3 left-0 h-48 w-48 rounded-full bg-emerald-100/40 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span className="text-xs font-semibold text-purple-700">Daily Tests Now Live</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent">
                DNDC Student
              </span>
              <br />
              Assessment Portal
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-600 leading-relaxed">
              Daily coding tests, MCQs, assignments and progress tracking — designed to keep DNDC students sharp,
              consistent, and placement-ready.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/login"
                className="group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 px-8 py-4 text-base font-bold text-white shadow-xl shadow-purple-200 hover:shadow-purple-300 hover:from-purple-700 hover:to-violet-800 transition-all active:scale-[0.98]"
              >
                Student Login
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="https://dndc.in"
                target="_blank"
                className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 hover:border-purple-300 hover:text-purple-700 transition-all active:scale-[0.98]"
              >
                Visit Main Website
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-100 bg-white/60 p-6 text-center shadow-sm backdrop-blur-sm"
              >
                <div className="text-3xl font-bold text-purple-700">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 text-xs font-semibold text-purple-700">
                <Star className="h-3 w-3" />
                Why Regular Testing?
              </div>
              <h2 className="mb-6 text-3xl font-bold text-slate-900 sm:text-4xl">
                Daily Tests Drive{' '}
                <span className="bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent">
                  Placement Success
                </span>
              </h2>
              <p className="mb-8 text-lg text-slate-600 leading-relaxed">
                Research shows that consistent daily testing improves retention by 40% compared to passive learning.
                The DNDC Assessment Portal ensures every student stays sharp, identifies weak areas early, and builds
                the test-taking confidence needed for placement interviews.
              </p>
              <div className="space-y-4">
                {[
                  'Reinforces concepts learned in class daily',
                  'Prepares students for placement aptitude tests',
                  'Builds speed and accuracy under time pressure',
                  'Tracks individual progress and improvement',
                ].map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                    <span className="text-slate-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                      <Icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="mb-1.5 font-semibold text-slate-900 text-sm">{benefit.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{benefit.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-semibold text-amber-700">
              <BookOpen className="h-3 w-3" />
              Our Courses
            </div>
            <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Choose What You{' '}
              <span className="bg-gradient-to-r from-purple-600 to-violet-700 bg-clip-text text-transparent">
                Want to Become
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-slate-600">
              Practice tests available for all DNDC courses. Tailored questions to match your specific learning track.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => {
              const Icon = course.icon;
              return (
                <div
                  key={course.name}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-default"
                >
                  <div
                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${course.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${course.iconColor}`} />
                  </div>
                  <h3 className="mb-2 font-bold text-slate-900">{course.name}</h3>
                  <p className="mb-3 text-xs text-slate-500 leading-relaxed">{course.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-purple-600 via-violet-700 to-purple-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-amber-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white">
            <Users className="h-3 w-3" />
            For DNDC Students Only
          </div>
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Ready to Test Your Knowledge?
          </h2>
          <p className="mb-10 text-lg text-purple-100">
            Login with your Student ID and password provided by DNDC to access today&apos;s test.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-purple-700 shadow-2xl hover:bg-purple-50 transition-all active:scale-[0.98]"
          >
            Login to Portal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 text-white">
                  <span className="text-sm font-bold">D</span>
                </div>
                <div>
                  <div className="font-bold text-slate-900">DNDC</div>
                  <div className="text-xs text-slate-500">Data &amp; Development Center</div>
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Best IT Training Institute in Bhopal. Transforming students into industry-ready professionals.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-slate-900">Courses</h4>
              <ul className="space-y-2">
                {['MERN Stack', 'Java Full Stack', 'Python Full Stack', 'Data Analytics', 'AI & Machine Learning'].map(
                  (c) => (
                    <li key={c}>
                      <span className="text-sm text-slate-500">{c}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-slate-900">Portal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-sm text-slate-500 hover:text-purple-600 transition-colors">
                    Student Login
                  </Link>
                </li>
                <li>
                  <Link href="https://dndc.in" target="_blank" className="text-sm text-slate-500 hover:text-purple-600 transition-colors">
                    Main Website
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold text-slate-900">Contact</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  MP Nagar Zone-1, Bhopal
                </li>
                <li>+91 6261437008</li>
                <li>dndc.bpl@gmail.com</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-100 pt-8 text-center">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} DNDC — Data &amp; Development Center. Crafted with passion in Bhopal, India.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
