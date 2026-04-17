'use client'

import { useRouter, usePathname } from 'next/navigation'
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n/config'
import { Globe } from 'lucide-react'
import { useState } from 'react'

export default function LanguageSelector({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function switchLocale(next: Locale) {
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/'))
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-600
                   hover:bg-gray-50 hover:text-gray-900 transition-colors"
      >
        <Globe className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
        <span>{localeFlags[currentLocale]}</span>
        <span className="flex-1 text-left">{localeNames[currentLocale]}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-100
                        rounded-lg shadow-lg shadow-gray-100 overflow-hidden z-50">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left transition-colors
                ${loc === currentLocale
                  ? 'bg-gray-50 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <span>{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
