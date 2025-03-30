import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pagina's die authentication vereisen
const authRequiredPages = [
  '/dashboard',
  '/budget',
  '/actual',
  '/gl-accounts',
  '/products',
]

// Auth pagina's waar gebruikers niet naar toe moeten kunnen als ze ingelogd zijn
const authPages = [
  '/auth/signin',
  '/auth/signup',
]

// Routes die altijd toegankelijk moeten zijn, ongeacht auth status
const publicRoutes = [
  '/',
  '/api',
  '/auth/callback',
  '/auth/reset-password',
]

// Problematische routes die altijd toegankelijk moeten zijn (tijdelijke workaround)
const problemRoutes = [
  '/budget/expenses',
  '/budget/revenue',
  '/budget/overview',
  '/actual/expenses',
  '/actual/revenue',
  '/revenue/saas',
  '/revenue/consultancy',
  '/dashboard/forecasts',
  '/dashboard/products',
  '/dashboard/budget',
]

export async function middleware(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || Date.now().toString()
  const path = req.nextUrl.pathname
  
  console.log(`[${requestId}] Middleware processing: ${path}`)
  
  // Skip middleware for resources and static files
  if (
    path.includes('/_next') || 
    path.includes('/static') || 
    path.includes('/api/') ||
    path.endsWith('.ico') ||
    path.endsWith('.svg') ||
    path.endsWith('.jpg') ||
    path.endsWith('.png')
  ) {
    return NextResponse.next()
  }
  
  try {
    // Initialize response 
    const res = NextResponse.next()
    
    // Create supabase client with proper error handling
    const supabase = createMiddlewareClient({ req, res })
    
    // Check if the path is in the public routes
    const isPublicRoute = publicRoutes.some(route => 
      path === route || path.startsWith(`${route}/`)
    )
    
    // Check if on an auth page (signin/signup)
    const isAuthPage = authPages.some(page => 
      path === page || path.startsWith(`${page}/`)
    )
    
    // Check if on a protected page that requires authentication
    const isProtectedPage = authRequiredPages.some(page => 
      path === page || path.startsWith(`${page}/`)
    )
    
    // Check if on a problem route that should be accessible regardless of auth
    const isProblemRoute = problemRoutes.some(route => 
      path.startsWith(route)
    )
    
    // Always allow access to problem routes (temporary workaround)
    if (isProblemRoute) {
      console.log(`[${requestId}] Allowing access to problem route: ${path}`)
      return res
    }
    
    // Always allow access to public routes
    if (isPublicRoute) {
      console.log(`[${requestId}] Allowing access to public route: ${path}`)
      return res
    }
    
    // For all other routes, check authentication
    const { data: { user }, error } = await supabase.auth.getUser()
    const hasSession = !!user
    
    console.log(`[${requestId}] Auth status: logged in=${hasSession}, userId=${user?.id || 'none'}`)
    
    if (error) {
      console.error(`[${requestId}] Auth error:`, error.message)
    }
    
    // User is logged in but on an auth page - redirect to dashboard
    if (hasSession && isAuthPage) {
      console.log(`[${requestId}] Redirecting from auth page to dashboard (already logged in)`)
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    
    // User is not logged in but trying to access a protected page - redirect to login
    if (!hasSession && isProtectedPage) {
      console.log(`[${requestId}] Redirecting to login (auth required for ${path})`)
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    
    return res
  } catch (e) {
    console.error(`[${requestId}] Middleware error:`, e instanceof Error ? e.message : String(e))
    
    // On error, proceed to the requested page
    // This prevents redirect loops if there's an issue with the auth system
    return NextResponse.next()
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