import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require authentication
const protectedRoutes = ['/craft', '/breakdown']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the path is in the protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = await getToken({ req: request })
    
    // If the user isn't authenticated, redirect to the login page
    if (!token) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', encodeURI(pathname))
      return NextResponse.redirect(url)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 