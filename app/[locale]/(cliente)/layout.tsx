import { getDictionary, locales, localeFlags, type Locale } from '@/lib/i18n/config'
import { notFound } from 'next/navigation'

export default async function ClienteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale as Locale)) notFound()

  const dict = await getDictionary(locale as Locale)
  const carta = dict.carta as Record<string, string>

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sticky header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-11 flex items-center justify-between">
          <span className="text-xs font-bold text-stone-700 tracking-[0.15em] uppercase">
            Lugano Smart Rest
          </span>
          <div className="flex items-center gap-1">
            {locales.map((loc) => (
              <a
                key={loc}
                href={`/${loc}/carta`}
                className={[
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                  loc === locale
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-500 hover:bg-stone-100',
                ].join(' ')}
              >
                {localeFlags[loc]}
              </a>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto">{children}</main>

      <footer className="max-w-lg mx-auto px-4 py-10 text-center border-t border-stone-100 mt-8">
        <p className="text-xs font-bold text-stone-400 tracking-[0.2em] uppercase">Lugano Smart Rest</p>
        <p className="text-xs text-stone-300 mt-1">Via della Posta 12 · Lugano · +41 91 123 45 67</p>
        <p className="text-xs text-stone-300 mt-0.5">{carta.subtitulo}</p>
      </footer>
    </div>
  )
}
