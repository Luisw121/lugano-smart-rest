import Link from 'next/link'
import { UtensilsCrossed, LayoutGrid, ChefHat } from 'lucide-react'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import ThemeToggle from '@/components/ui/ThemeToggle'
import LanguageSelector from '@/components/ui/LanguageSelector'
import LogoutButton from '@/components/ui/LogoutButton'

export default async function SalaLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <header className="h-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-5 gap-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-4 h-4 text-gray-900 dark:text-white" strokeWidth={1.5} />
          <span className="font-semibold text-sm text-gray-900 dark:text-white tracking-tight">
            Lugano Smart Rest
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <Link
            href={`/${locale}/mesas`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} />
            {dict.nav.tavoli}
          </Link>
          <Link
            href={`/${locale}/kds`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChefHat className="w-3.5 h-3.5" strokeWidth={1.5} />
            {dict.nav.kds}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <div className="w-44">
            <LanguageSelector currentLocale={locale as Locale} />
          </div>
          <LogoutButton cookieName="lsr_sala" locale={locale} label="← Home" />
        </div>
      </header>

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
