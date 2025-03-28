import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Always set the cookie with these base options
            const baseOptions = {
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              maxAge: 100 * 365 * 24 * 60 * 60, // 100 years, never expire
            }
            response.cookies.set({
              name,
              value,
              ...baseOptions,
              ...options,
            })
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              path: '/',
              maxAge: -1,
            })
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()

    // Log session status
    console.log('Session status in middleware:', {
      exists: !!session,
      userId: session?.user?.id || 'none',
      isError: !!error
    })

    // Public routes that don't require authentication
    const publicRoutes = [
      '/auth/signin',
      '/auth/signup',
      '/auth/callback',
      '/auth/reset-password'
    ]

    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // If there's a session and we're on a public route, redirect to dashboard
    if (session && isPublicRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If there's no session and we're not on a public route, redirect to signin
    if (!session && !isPublicRoute) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to signin page
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 