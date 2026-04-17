import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@/lib/i18n/config'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes and static assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check if locale is already in path
  const hasLocale = locales.some(
    (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  )

  if (hasLocale) return NextResponse.next()

  // Detect preferred locale from Accept-Language header
  const acceptLang = request.headers.get('Accept-Language') ?? ''
  const preferred = acceptLang.split(',')[0].split('-')[0].toLowerCase()
  const locale = (locales as readonly string[]).includes(preferred)
    ? preferred
    : defaultLocale

  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
