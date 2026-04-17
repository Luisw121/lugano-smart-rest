'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { UtensilsCrossed, QrCode } from 'lucide-react'
import { ROLES, type Rol } from '@/lib/roles'
import AccesoModal from '@/components/ui/AccesoModal'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Link from 'next/link'

type Locale = 'it' | 'en' | 'es'

const cartaDesc: Record<Locale, string> = {
  it: 'Menu digitale per i clienti',
  en: 'Digital menu for customers',
  es: 'Menú digital para clientes',
}
const cartaLabel: Record<Locale, string> = {
  it: 'Carta digitale',
  en: 'Digital menu',
  es: 'Carta digital',
}
const subtitulo: Record<Locale, string> = {
  it: 'Seleziona il tuo ruolo per accedere',
  en: 'Select your role to access',
  es: 'Selecciona tu rol para acceder',
}

// Colores estáticos por rol para que Tailwind los incluya
const roleStyles: Record<Rol, { gradient: string; shadow: string }> = {
  manager: { gradient: 'bg-gradient-to-br from-gray-900 to-gray-700', shadow: 'hover:shadow-gray-300 dark:hover:shadow-gray-900' },
  sala:    { gradient: 'bg-gradient-to-br from-amber-600 to-amber-400', shadow: 'hover:shadow-amber-200 dark:hover:shadow-amber-900' },
  cucina:  { gradient: 'bg-gradient-to-br from-orange-700 to-red-500',  shadow: 'hover:shadow-orange-200 dark:hover:shadow-orange-900' },
}

export default function HomePage() {
  const params = useParams()
  const locale = (params.locale as Locale) ?? 'it'
  const [rolSeleccionado, setRol] = useState<Rol | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-white dark:text-gray-900" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none">Lugano Smart Rest</h1>
            <p className="text-xs text-gray-400 mt-0.5">Lugano, Svizzera</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="flex gap-1">
            {(['it','en','es'] as Locale[]).map((l) => (
              <Link
                key={l}
                href={`/${l}`}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  l === locale
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {l === 'it' ? '🇮🇹' : l === 'en' ? '🇬🇧' : '🇪🇸'}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10 tracking-wide">
          {subtitulo[locale]}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {(Object.entries(ROLES) as [Rol, typeof ROLES[Rol]][]).map(([key, info]) => {
            const label = info.label[locale as keyof typeof info.label] ?? info.label.it
            const desc  = info.desc[locale as keyof typeof info.desc]   ?? info.desc.it
            const styles = roleStyles[key]
            return (
              <button
                key={key}
                onClick={() => setRol(key)}
                className={`group relative overflow-hidden rounded-3xl p-6 text-left
                            transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]
                            shadow-md ${styles.gradient} ${styles.shadow}`}
              >
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                <div className="relative z-10 text-white">
                  <span className="text-4xl block mb-4">{info.emoji}</span>
                  <h2 className="text-xl font-bold leading-tight">{label}</h2>
                  <p className="text-sm text-white/80 mt-1 leading-snug">{desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Carta cliente — sin PIN */}
        <div className="mt-4 w-full max-w-2xl">
          <Link
            href={`/${locale}/carta`}
            className="group flex items-center justify-between w-full px-6 py-4
                       bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700
                       rounded-3xl hover:border-gray-300 dark:hover:border-gray-600 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-2xl">
                📱
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{cartaLabel[locale]}</p>
                <p className="text-xs text-gray-400">{cartaDesc[locale]}</p>
              </div>
            </div>
            <QrCode className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" strokeWidth={1.5} />
          </Link>
        </div>
      </main>

      {rolSeleccionado && (
        <AccesoModal
          rol={rolSeleccionado}
          locale={locale}
          onClose={() => setRol(null)}
        />
      )}
    </div>
  )
}
