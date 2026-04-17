'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Delete } from 'lucide-react'
import type { Rol } from '@/lib/roles'
import { ROLES, COOKIE_MAX_AGE } from '@/lib/roles'
import { useRouter } from 'next/navigation'

interface Props {
  rol: Rol
  locale: string
  onClose: () => void
}

const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export default function AccesoModal({ rol, locale, onClose }: Props) {
  const info    = ROLES[rol]
  const router  = useRouter()
  const [pin,   setPin]   = useState('')
  const [shake, setShake] = useState(false)
  const [ok,    setOk]    = useState(false)

  function press(d: string) {
    if (d === '⌫') { setPin((p) => p.slice(0, -1)); return }
    if (d === '')   return
    const next = pin + d
    if (next.length > 6) return
    setPin(next)
  }

  useEffect(() => {
    if (pin.length < 4) return
    const correct = info.pin()
    if (pin === correct) {
      setOk(true)
      // Guardar cookie de sesión
      document.cookie = `${info.cookieName}=1; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`
      setTimeout(() => {
        router.push(info.homeUrl(locale))
      }, 400)
    } else if (pin.length >= correct.length) {
      setShake(true)
      setTimeout(() => { setShake(false); setPin('') }, 600)
    }
  }, [pin]) // eslint-disable-line react-hooks/exhaustive-deps

  const labelStr = info.label[locale as keyof typeof info.label] ?? info.label.it

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden
                       transition-transform ${shake ? 'animate-shake' : ''} ${ok ? 'scale-95 opacity-0' : ''}`}
           style={{ transition: ok ? 'all 0.3s ease' : undefined }}>

        {/* Header del rol */}
        <div className={`bg-gradient-to-br ${info.color} px-6 py-8 text-white text-center relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <div className="text-4xl mb-2">{info.emoji}</div>
          <h2 className="text-xl font-bold">{labelStr}</h2>
        </div>

        {/* PIN display */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex justify-center gap-3 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-150 ${
                  i < pin.length
                    ? ok ? 'bg-emerald-500 scale-125' : 'bg-gray-900 scale-110'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Teclado numérico */}
          <div className="grid grid-cols-3 gap-2">
            {DIGITS.map((d, i) => (
              <button
                key={i}
                onClick={() => press(d)}
                disabled={d === ''}
                className={`
                  h-14 rounded-2xl text-lg font-semibold transition-all active:scale-95
                  ${d === '' ? 'invisible' : ''}
                  ${d === '⌫'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-900 hover:bg-gray-100 active:bg-gray-200'}
                `}
              >
                {d === '⌫' ? <Delete className="w-5 h-5 mx-auto" strokeWidth={1.5} /> : d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  )
}
