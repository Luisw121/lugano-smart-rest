'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Delete, ChevronRight, Users, ChefHat, UserCheck } from 'lucide-react'
import type { Rol } from '@/lib/roles'
import { ROLES, COOKIE_MAX_AGE } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  rol: Rol
  locale: string
  onClose: () => void
}

type Fase = 'empleados' | 'pin'

interface Empleado {
  id: string
  nombre: string
  rol: 'camarero' | 'cocinero' | 'responsable_sala'
  pin: string
}

const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

const rolIcon: Record<string, React.ElementType> = {
  camarero: Users,
  cocinero: ChefHat,
  responsable_sala: UserCheck,
}

// Roles de empleado que corresponden a cada acceso
const ROL_EMPLEADOS: Record<string, string[]> = {
  sala:   ['camarero', 'responsable_sala'],
  cucina: ['cocinero'],
}

export default function AccesoModal({ rol, locale, onClose }: Props) {
  const info   = ROLES[rol]
  const router = useRouter()

  const usaEmpleados = rol === 'sala' || rol === 'cucina'

  const [fase, setFase]             = useState<Fase>(usaEmpleados ? 'empleados' : 'pin')
  const [empleados, setEmpleados]   = useState<Empleado[]>([])
  const [seleccionado, setSeleccionado] = useState<Empleado | null>(null)
  const [loadingEmp, setLoadingEmp] = useState(usaEmpleados)

  const [pin,   setPin]   = useState('')
  const [shake, setShake] = useState(false)
  const [ok,    setOk]    = useState(false)

  const supabase = createClient()

  // Cargar empleados para sala/cucina
  useEffect(() => {
    if (!usaEmpleados) return
    const roles = ROL_EMPLEADOS[rol] ?? []
    supabase
      .from('empleados')
      .select('id, nombre, rol, pin')
      .in('rol', roles)
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => {
        setEmpleados((data ?? []) as Empleado[])
        setLoadingEmp(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function elegirEmpleado(emp: Empleado) {
    setSeleccionado(emp)
    setPin('')
    setFase('pin')
  }

  function press(d: string) {
    if (d === '⌫') { setPin((p) => p.slice(0, -1)); return }
    if (d === '')   return
    if (pin.length >= 4) return
    setPin((p) => p + d)
  }

  async function verificarPin(currentPin: string) {
    let correcto = false

    if (usaEmpleados && seleccionado) {
      correcto = currentPin === seleccionado.pin
    } else {
      correcto = currentPin === info.pin()
    }

    if (correcto) {
      setOk(true)
      document.cookie = `${info.cookieName}=1; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`

      // Registrar fichaje automático si es empleado identificado
      if (seleccionado) {
        // Detect entrada/salida based on last fichaje today
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
        const { data: lastFichaje } = await supabase
          .from('fichajes')
          .select('tipo')
          .eq('empleado_id', seleccionado.id)
          .gte('created_at', hoy.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const tipo = lastFichaje?.tipo === 'entrada' ? 'salida' : 'entrada'
        await supabase.from('fichajes').insert({ empleado_id: seleccionado.id, tipo })
      }

      setTimeout(() => router.push(info.homeUrl(locale)), 400)
    } else {
      setShake(true)
      setTimeout(() => { setShake(false); setPin('') }, 600)
    }
  }

  useEffect(() => {
    if (pin.length === 4) verificarPin(pin)
  }, [pin]) // eslint-disable-line react-hooks/exhaustive-deps

  const labelStr = info.label[locale as keyof typeof info.label] ?? info.label.it

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full overflow-hidden
                    transition-all ${shake ? 'animate-shake' : ''} ${ok ? 'scale-95 opacity-0' : ''}
                    ${fase === 'empleados' ? 'max-w-sm' : 'max-w-xs'}`}
        style={{ transition: ok ? 'all 0.3s ease' : undefined }}
      >
        {/* Header */}
        <div className={`bg-gradient-to-br ${info.color} px-6 py-6 text-white text-center relative`}>
          <button
            onClick={fase === 'pin' && usaEmpleados ? () => { setFase('empleados'); setPin('') } : onClose}
            className="absolute top-4 left-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            {fase === 'pin' && usaEmpleados
              ? <ChevronRight className="w-4 h-4 rotate-180" strokeWidth={2} />
              : <X className="w-4 h-4" strokeWidth={1.5} />
            }
          </button>
          <div className="text-3xl mb-1">{info.emoji}</div>
          <h2 className="text-lg font-bold">{labelStr}</h2>
          {fase === 'pin' && seleccionado && (
            <p className="text-white/80 text-sm mt-0.5">{seleccionado.nombre}</p>
          )}
        </div>

        {/* ── Fase: lista empleados ─────────────────────── */}
        {fase === 'empleados' && (
          <div className="p-4">
            {loadingEmp ? (
              <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-sm">…</div>
            ) : empleados.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">Nessun dipendente trovato</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Aggiungili dalla sezione Manager</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {empleados.map((emp) => {
                  const Icon = rolIcon[emp.rol] ?? Users
                  return (
                    <button
                      key={emp.id}
                      onClick={() => elegirEmpleado(emp)}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl
                                 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700
                                 transition-colors text-left group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
                      </div>
                      <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{emp.nombre}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" strokeWidth={1.5} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Fase: PIN ─────────────────────────────────── */}
        {fase === 'pin' && (
          <div className="px-6 pt-5 pb-6">
            {/* Dots */}
            <div className="flex justify-center gap-3 mb-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-150 ${
                    i < pin.length
                      ? ok ? 'bg-emerald-500 scale-125' : 'bg-gray-900 dark:bg-white scale-110'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Teclado */}
            <div className="grid grid-cols-3 gap-2">
              {DIGITS.map((d, i) => (
                <button
                  key={i}
                  onClick={() => press(d)}
                  disabled={d === ''}
                  className={`h-14 rounded-2xl text-lg font-semibold transition-all active:scale-95
                    ${d === '' ? 'invisible' : ''}
                    ${d === '⌫'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'}`}
                >
                  {d === '⌫' ? <Delete className="w-5 h-5 mx-auto" strokeWidth={1.5} /> : d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
