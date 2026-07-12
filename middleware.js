// src/middleware.js

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(request) {
 if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/login', '/api/auth'];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/api/auth/')
  );

  // Allow public routes
  if (isPublicRoute) {
    // Redirect to dashboard if already logged in
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user needs to change password
  if (token.mustChangePassword && pathname !== '/dashboard/change-password') {
    return NextResponse.redirect(new URL('/dashboard/change-password', request.url));
  }

  // API route protection
  if (pathname.startsWith('/api/')) {
    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', token.id);
    requestHeaders.set('x-user-level', token.userLevel);
    requestHeaders.set('x-user-permissions', JSON.stringify(token.permissions || []));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};