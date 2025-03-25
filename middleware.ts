import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Debug info
  const pathname = req.nextUrl.pathname;
  console.log(`Middleware processing: ${pathname}`);
  
  // Sla de auth routes en static resources over
  if (
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('.jpg') ||
    pathname.includes('.png') ||
    pathname.includes('.svg') ||
    pathname.includes('.css') ||
    pathname.includes('.js')
  ) {
    console.log(`Middleware skipped for: ${pathname}`);
    return res;
  }

  try {
    console.log('Creating middleware Supabase client');
    // Create client with explicit configuration
    const supabase = createMiddlewareClient(
      { req, res },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    );
    
    // Refresh session if expired
    console.log('Checking auth session in middleware');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth session error in middleware:', error.message);
    }
    
    // Log session status
    console.log('Session status in middleware:', {
      exists: !!session,
      userId: session?.user?.id || 'none',
      isError: !!error
    });
    
    // If no session, redirect to signin for protected routes
    if (!session && pathname.startsWith('/dashboard')) {
      console.log(`No session found, redirecting to signin from: ${pathname}`);
      const redirectUrl = new URL('/auth/signin', req.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    return res;
  } catch (e: any) {
    console.error('Middleware error:', {
      message: e.message,
      stack: e.stack,
      name: e.name,
      source: 'middleware.ts'
    });
    
    // Continue the request despite the error - this prevents middleware failures
    // from completely blocking user access
    return res;
  }
}

// Matcher configuratie - specificeer welke paden de middleware moet uitvoeren
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 