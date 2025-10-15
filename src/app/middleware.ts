import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// تعريف الصلاحيات لكل مسار
const routePermissions: Record<string, string[]> = {
  '/dashboard': ['admin', 'editor', 'viewer'],
  '/adv': ['admin', 'editor'],
  '/ashtrak': ['admin', 'editor'],
  '/material': ['admin', 'editor'],
  '/quiz': ['admin', 'editor'],
  '/quiz_parent': ['admin', 'editor'],
  '/quiz_form': ['admin', 'editor'],
  '/voice': ['admin', 'editor'],
  '/print': ['admin', 'printer'],
  '/delv': ['admin', 'printer'],
  '/print_bill': ['admin', 'printer'],
  '/users': ['admin'],
  '/settings': ['admin'],
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const token = request.cookies.get('authToken')?.value
  const userRole = request.cookies.get('userRole')?.value

  // الصفحات المسموح الوصول إليها بدون تسجيل دخول
  const publicPaths = ['/login']
  
  if (!token && !publicPaths.includes(path)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // التحقق من الصلاحيات إذا كان المسار محميًا
  if (token && routePermissions[path]) {
    const allowedRoles = routePermissions[path]
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|unauthorized).*)',
  ],
}