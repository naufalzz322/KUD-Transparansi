import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow auth-related paths without token check
        if (
          pathname === '/login' ||
          pathname.startsWith('/api/auth')
        ) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!portal|qr-card|api/cron|_next/static|_next/image|favicon.ico).*)',
  ],
};
