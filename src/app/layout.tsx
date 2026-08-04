import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://student.dndc.in'),
  title: {
  default: "DNDC Student Portal",
  template: "%s | DNDC Student Portal",
},
  description:
    'DNDC Student Assessment Portal — Daily coding tests, MCQs, programming practice, and progress tracking for MERN Stack, Java, Python, Data Analytics, AI/ML, Flutter students in Bhopal.',
  keywords: [
    'Student Assessment Portal',
    'Online Coding Test',
    'Programming Practice',
    'MERN Practice Test',
    'Java MCQ Test',
    'Python Quiz',
    'Data Analytics Test',
    'AI Practice Questions',
    'DNDC Student Portal',
    'Coding Assessment Platform',
    'Bhopal IT Institute',
    'DNDC Exam',
    'Online Test Bhopal',
  ],
  authors: [{ name: 'DNDC - Data & Development Center', url: 'https://dndc.in' }],
  creator: 'DNDC',
  publisher: 'DNDC',
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
  icon: "/favicon.ico",
  shortcut: "/favicon.ico",
  apple: "/apple-icon.png",
},
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    countryName: "India",
    url: 'https://student.dndc.in',
    siteName: 'DNDC Student Assessment Portal',
    title: {
  default: "DNDC Student Portal",
  template: "%s | DNDC Student Portal",
},
    description:
      'Daily coding tests, MCQs, and progress tracking for DNDC students. Prepare for placements with structured assessments.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DNDC Student Assessment Portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DNDC Student Assessment Portal',
    description: 'Daily coding tests and progress tracking for DNDC students in Bhopal.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://student.dndc.in',
  },
  manifest: "/manifest.json",
  category: "education",
  applicationName: "DNDC Student Portal",
  verification: {
  google: process.env.GOOGLE_SITE_VERIFICATION,
},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#6B46C1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              "hasCredential": "Certification",
              name: 'DNDC - Data & Development Center',
              url: 'https://dndc.in',
              logo: 'https://dndc.in/logo.png',
              description: 'Best IT Training Institute in Bhopal offering MERN Stack, Python, Java, Data Analytics, AI/ML courses',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'MP Nagar Zone-1',
                addressLocality: 'Bhopal',
                addressRegion: 'Madhya Pradesh',
                addressCountry: 'IN',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+91-6261437008',
                contactType: 'customer service',
              },
              sameAs: ['https://student.dndc.in'],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
