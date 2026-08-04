# DNDC Student Assessment Portal

## Overview
A complete, production-ready Student Test Portal for **DNDC (Data & Development Center)**, Bhopal.

- **Frontend URL**: https://exam.dndc.in
- **Tech Stack**: Next.js 16 + React 19 + TypeScript + Tailwind CSS + MongoDB Atlas
- **Deployment**: Vercel (Frontend) + MongoDB Atlas (Database) + Cloudinary (Media)

---

## Quick Start

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd dndc-exam-portal
npm install
```

### 2. Configure Environment
Copy `.env.local` and fill in your values:
```env


### 3. Seed the Database (Create First Admin)
```bash
npm run seed
```

### 4. Run Locally
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
npm run build
vercel deploy --prod
```

---

## Project Structure
```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/login/        # Login page (students + admins)
│   ├── (student)/student/   # Student portal pages
│   │   ├── dashboard/       # Student dashboard
│   │   ├── test/            # Today's test engine
│   │   ├── results/         # Test history & result review
│   │   └── profile/         # Student profile
│   ├── (admin)/admin/       # Admin portal pages
│   │   ├── dashboard/       # Admin dashboard
│   │   ├── students/        # Student management (CRUD)
│   │   ├── tests/           # Test management + question builder
│   │   │   └── [id]/questions/  # Question builder
│   │   ├── results/         # Results + CSV export
│   │   └── profile/         # Admin profile
│   ├── api/                 # REST API routes
│   │   ├── auth/            # login, logout, me
│   │   ├── students/        # CRUD
│   │   ├── tests/           # CRUD + today's test
│   │   ├── questions/       # Bulk save questions
│   │   ├── submissions/     # Submit test + get history
│   │   ├── results/         # Admin results + CSV export
│   │   ├── dashboard/       # student & admin stats
│   │   └── upload/          # Cloudinary upload
│   ├── page.tsx             # Public home page (SEO optimized)
│   ├── layout.tsx           # Root layout with metadata
│   ├── robots.ts            # robots.txt
│   └── sitemap.ts           # sitemap.xml
├── components/
│   ├── ui/                  # Button, Input, Card, Badge, Dialog, Select, Toast
│   ├── layout/              # StudentSidebar, AdminSidebar
│   ├── test/                # TestEngine (full test interface + timer)
│   └── admin/               # StudentManager, TestManager, QuestionBuilder, ResultsManager
├── lib/
│   ├── mongodb.ts           # Mongoose connection with caching
│   ├── auth.ts              # JWT sign/verify + cookie helpers
│   └── utils.ts             # formatDate, getGrade, cn, etc.
├── models/
│   ├── Admin.ts             # Admin model with bcrypt
│   ├── Student.ts           # Student model with bcrypt
│   ├── Test.ts              # Test model
│   ├── Question.ts          # Question model (mcq/image/pdf/text)
│   └── Submission.ts        # Submission model with answers
├── middleware.ts            # Auth + role-based route protection
├── types/index.ts           # TypeScript types + course constants
└── scripts/seed.ts          # Database seeder
```

---

## Features Implemented

### ✅ Public Home Page
- Hero section with DNDC branding (purple/violet gradient)
- Stats (2500+ students, 7+ years, 100% placement)
- About section with benefits
- 7 course cards (MERN, Java, Python, Data Analytics, AI/ML, Flutter, UI/UX)
- CTA section + Footer with contact info
- Full SEO (metadata, OG tags, Twitter cards, robots.txt, sitemap.xml, schema.org)

### ✅ Authentication
- Single login page for both students and admins
- Login by Student ID OR email
- JWT tokens in HTTP-only cookies (7-day expiry)
- Role-based middleware protection
- Auto-redirect after login based on role
- Secure logout

### ✅ Student Portal
- Beautiful sidebar with navigation
- Dashboard with stats (total tests, avg score, highest score)
- Today's test card showing status (available/completed)
- Recent activity feed
- **Full Test Engine**: timer, question navigator, auto-submit
- Instructions screen before test
- Confirmation dialog before submit
- Immediate result display with grade, pass/fail, score breakdown
- Answer review page showing correct/wrong/skipped with explanations
- Test history with all past results
- Profile page with account info

### ✅ Test Engine
- Supports 4 question types: MCQ, Image MCQ, PDF MCQ, Text
- Countdown timer with warning states (60s = amber, 30s = red, flashing)
- Desktop question navigator panel
- Progress bar
- One attempt per test (enforced at DB level with unique index)
- Auto-submit when timer expires
- Submission persists page refreshes

### ✅ Admin Portal
- Dashboard with stats + recent activity + course distribution chart
- **Student Management**: Create/Edit/Delete/Search/Filter/Paginate
- **Test Management**: Create/Edit/Delete/Publish/Expire
- **Question Builder**: Add unlimited questions, drag indicator, image upload, PDF upload, set correct answer
- **Results Manager**: View all submissions, search, export to CSV
- Quick action buttons

### ✅ Security
- HTTP-only JWT cookies
- Role middleware on all API routes
- Password hashing with bcrypt (cost factor 12)
- Input validation with Zod schemas
- Students can't see correct answers in questions API
- One submission per student per test (MongoDB unique compound index)

### ✅ Database
- MongoDB Atlas with Mongoose ODM
- Collections: admins, students, tests, questions, submissions
- Indexes for performance (date+course+status, testId+studentId unique)
- Connection caching for Next.js serverless

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | Public | Login (student/admin) |
| POST | /api/auth/logout | Any | Logout |
| GET | /api/auth/me | Any | Current user info |
| GET | /api/students | Admin | List students (search/filter/paginate) |
| POST | /api/students | Admin | Create student |
| PUT | /api/students/[id] | Admin | Update student |
| DELETE | /api/students/[id] | Admin | Delete student |
| GET | /api/tests | Any | List tests |
| POST | /api/tests | Admin | Create test |
| GET | /api/tests/[id] | Any | Get test + questions |
| PUT | /api/tests/[id] | Admin | Update test |
| DELETE | /api/tests/[id] | Admin | Delete test |
| GET | /api/tests/today | Student | Get today's test |
| POST | /api/questions | Admin | Bulk save questions |
| POST | /api/submissions | Student | Submit test |
| GET | /api/submissions | Any | Get submissions |
| GET | /api/submissions/[id] | Any | Get submission detail |
| GET | /api/results | Admin | All results (+ ?export=csv) |
| POST | /api/upload | Admin | Upload image/PDF to Cloudinary |
| GET | /api/dashboard/student | Student | Student dashboard stats |
| GET | /api/dashboard/admin | Admin | Admin dashboard stats |

---

## Deployment (Vercel)

### Steps:
1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Deploy

### Vercel Environment Variables to Add:
```
MONGODB_URI
JWT_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_APP_URL
```

### Custom Domain Setup:
1. Add `exam.dndc.in` in Vercel → Project → Domains
2. Add CNAME record in your DNS: `exam` → `cname.vercel-dns.com`

---

## Default Login Credentials (after seed)

| Role | Identifier | Password |


**⚠️ Change default passwords immediately after first login!**

---

## Route Structure Fix Required

After moving files, update all Link `href` values in sidebar navigation:

**StudentSidebar.tsx** — update navItems hrefs:
```typescript
{ href: '/student/dashboard', ... }
{ href: '/student/test', ... }
{ href: '/student/results', ... }
{ href: '/student/profile', ... }
```

**AdminSidebar.tsx** — update navItems hrefs:
```typescript
{ href: '/admin/dashboard', ... }
{ href: '/admin/students', ... }
{ href: '/admin/tests', ... }
{ href: '/admin/results', ... }
{ href: '/admin/profile', ... }
```

(These already point to the correct paths — the route groups `(student)` and `(admin)` are transparent to URLs.)

---

## Technology Credits

- **Next.js 16** — App Router, Server Components, Route Handlers
- **MongoDB Atlas** — Cloud database
- **Mongoose** — ODM
- **JWT** — Authentication
- **bcryptjs** — Password hashing
- **Cloudinary** — Image/PDF storage
- **Tailwind CSS v4** — Styling
- **Radix UI** — Accessible components
- **Lucide Icons** — Icons
- **Framer Motion** — Animations (available, integrate as needed)
- **Zod** — Validation

---

© 2026 DNDC — Data & Development Center, Bhopal, India
