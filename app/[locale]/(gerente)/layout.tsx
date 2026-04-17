import Link from 'next/link'
import { Package, Euro, BarChart3, UtensilsCrossed, QrCode, Users, Clock } from 'lucide-react'
import { getDictionary, type Locale } from '@/lib/i18n/config'
import ThemeToggle from '@/components/ui/ThemeToggle'
import LanguageSelector from '@/components/ui/LanguageSelector'

export default async function GerenteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const navItems = [
    { href: `/${locale}/inventario`, label: dict.nav.inventario, icon: Package },
    { href: `/${locale}/caja`,       label: dict.nav.cassa,      icon: Euro },
    { href: `/${locale}/metricas`,   label: dict.nav.metriche,   icon: BarChart3 },
    { href: `/${locale}/empleados`,  label: dict.nav.empleados,  icon: Users },
    { href: `/${locale}/fichajes`,   label: dict.nav.fichajes,   icon: Clock },
    { href: `/${locale}/qr`,         label: 'QR Codes',          icon: QrCode },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className="w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <UtensilsCrossed className="w-5 h-5 text-gray-900 dark:text-white" strokeWidth={1.5} />
            <span className="font-semibold text-sm tracking-tight text-gray-900 dark:text-white">
              Lugano Smart Rest
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 ml-7">Manager</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400
                         hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors group"
            >
              <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <ThemeToggle />
          <LanguageSelector currentLocale={locale as Locale} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
