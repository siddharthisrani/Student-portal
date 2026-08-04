import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const publicPaths = ['/', '/login', '/api/auth/login', '/api/auth/logout'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static files
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/og-') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('dndc_auth_token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = verifyToken(token);

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('dndc_auth_token');
    return response;
  }

  // Role-based routing
  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/student/dashboard', request.url));
  }

  if (pathname.startsWith('/student') && user.role !== 'student') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Redirect logged-in users from login page
  if (pathname === '/login') {
    const redirectUrl = user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
