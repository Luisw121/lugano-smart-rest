import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@/lib/i18n/config'

// Rutas que requieren cookie de sesión y qué cookie necesitan
const RUTAS_PROTEGIDAS: Record<string, string> = {
  '/inventario': 'lsr_manager',
  '/caja':       'lsr_manager',
  '/metricas':   'lsr_manager',
  '/qr':         'lsr_manager',
  '/empleados':  'lsr_manager',
  '/fichajes':   'lsr_manager',
  '/mesas':      'lsr_sala',
  '/kds':        'lsr_cucina',
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Añadir locale si falta
  const hasLocale = locales.some(
    (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
  )

  if (!hasLocale) {
    const acceptLang = request.headers.get('Accept-Language') ?? ''
    const preferred = acceptLang.split(',')[0].split('-')[0].toLowerCase()
    const locale = (locales as readonly string[]).includes(preferred) ? preferred : defaultLocale
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url))
  }

  // Protección de rutas por cookie de rol
  const segmento = '/' + pathname.split('/').slice(2).join('/')
  const rutaBase = '/' + (pathname.split('/')[2] ?? '')
  const cookieRequerida = RUTAS_PROTEGIDAS[rutaBase]

  if (cookieRequerida) {
    const cookie = request.cookies.get(cookieRequerida)
    if (!cookie || cookie.value !== '1') {
      const locale = pathname.split('/')[1]
      return NextResponse.redirect(new URL(`/${locale}`, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
