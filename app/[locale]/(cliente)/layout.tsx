import { getDictionary, locales, localeFlags, localeNames, type Locale } from '@/lib/i18n/config'
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
      {/* Mini header con selector de idioma */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-11 flex items-center justify-between">
          <span className="text-xs font-semibold text-stone-500 tracking-widest uppercase">
            Lugano Smart Rest
          </span>
          <div className="flex items-center gap-1">
            {locales.map((loc) => (
              <a
                key={loc}
                href={`/${loc}/carta`}
                className={[
                  'px-2 py-1 rounded-lg text-xs font-medium transition-colors',
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

      <footer className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-xs text-stone-400">
          Lugano Smart Rest · Lugano, Svizzera
        </p>
      </footer>
    </div>
  )
}
