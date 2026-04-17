'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { UtensilsCrossed, QrCode } from 'lucide-react'
import { ROLES, type Rol } from '@/lib/roles'
import AccesoModal from '@/components/ui/AccesoModal'
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

export default function HomePage() {
  const params = useParams()
  const locale = (params.locale as Locale) ?? 'it'
  const [rolSeleccionado, setRol] = useState<Rol | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-none">Lugano Smart Rest</h1>
            <p className="text-xs text-gray-400 mt-0.5">Lugano, Svizzera</p>
          </div>
        </div>
        {/* Selector idioma */}
        <div className="flex gap-1">
          {(['it','en','es'] as Locale[]).map((l) => (
            <Link
              key={l}
              href={`/${l}`}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                l === locale ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {l === 'it' ? '🇮🇹' : l === 'en' ? '🇬🇧' : '🇪🇸'}
            </Link>
          ))}
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <p className="text-sm text-gray-500 mb-10 tracking-wide">
          {subtitulo[locale]}
        </p>

        {/* Cards de rol */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {(Object.entries(ROLES) as [Rol, typeof ROLES[Rol]][]).map(([key, info]) => {
            const label = info.label[locale as keyof typeof info.label] ?? info.label.it
            const desc  = info.desc[locale as keyof typeof info.desc]   ?? info.desc.it
            return (
              <button
                key={key}
                onClick={() => setRol(key)}
                className="group relative overflow-hidden rounded-3xl p-6 text-left
                           transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]
                           shadow-md"
              >
                {/* Fondo gradiente */}
                <div className={`absolute inset-0 bg-gradient-to-br ${info.color}`} />
                {/* Círculo decorativo */}
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />

                <div className="relative z-10 text-white">
                  <span className="text-4xl block mb-4">{info.emoji}</span>
                  <h2 className="text-xl font-bold leading-tight">{label}</h2>
                  <p className="text-sm text-white/70 mt-1 leading-snug">{desc}</p>
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
                       bg-white border-2 border-dashed border-gray-200 rounded-3xl
                       hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-2xl">
                📱
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{cartaLabel[locale]}</p>
                <p className="text-xs text-gray-400">{cartaDesc[locale]}</p>
              </div>
            </div>
            <QrCode className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" strokeWidth={1.5} />
          </Link>
        </div>
      </main>

      {/* Modal PIN */}
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
