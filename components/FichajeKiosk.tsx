'use client'

import { useState, useEffect } from 'react'
import { UtensilsCrossed, LogIn, LogOut, Delete, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/i18n/config'

type Rol = 'camarero' | 'cocinero' | 'responsable_sala'
type Fase = 'pin' | 'confirmar' | 'ok' | 'error'

interface Empleado {
  id: string
  nombre: string
  rol: Rol
}

interface FichajeHoy {
  tipo: 'entrada' | 'salida'
  created_at: string
}

interface Props {
  dict: Record<string, unknown>
  locale: Locale
}

const rolLabel: Record<Rol, Record<string, string>> = {
  camarero:          { it: 'Cameriere',       en: 'Waiter',         es: 'Camarero' },
  cocinero:          { it: 'Cuoco',           en: 'Cook',           es: 'Cocinero' },
  responsable_sala:  { it: 'Resp. Sala',      en: 'Floor Manager',  es: 'Resp. Sala' },
}

export default function FichajeKiosk({ dict, locale }: Props) {
  const emp = (dict.empleados ?? {}) as Record<string, string>
  const com = (dict.comun ?? {}) as Record<string, string>

  const [pin, setPin] = useState('')
  const [fase, setFase] = useState<Fase>('pin')
  const [empleado, setEmpleado] = useState<Empleado | null>(null)
  const [tipoFichaje, setTipoFichaje] = useState<'entrada' | 'salida'>('entrada')
  const [fichajesHoy, setFichajesHoy] = useState<FichajeHoy[]>([])
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const [horaActual, setHoraActual] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const tick = () => setHoraActual(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Auto-reset after ok/error
  useEffect(() => {
    if (fase === 'ok' || fase === 'error') {
      const t = setTimeout(() => { setFase('pin'); setPin(''); setEmpleado(null) }, 3000)
      return () => clearTimeout(t)
    }
  }, [fase])

  function presionar(digit: string) {
    if (pin.length >= 4) return
    setPin((p) => p + digit)
  }

  function borrar() {
    setPin((p) => p.slice(0, -1))
  }

  async function verificarPin() {
    if (pin.length !== 4) return
    setLoading(true)

    const { data } = await supabase
      .from('empleados')
      .select('id, nombre, rol')
      .eq('pin', pin)
      .eq('activo', true)
      .single()

    if (!data) {
      setLoading(false)
      setShake(true)
      setTimeout(() => { setShake(false); setPin('') }, 600)
      return
    }

    // Get today's fichajes for this employee
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const { data: fiches } = await supabase
      .from('fichajes')
      .select('tipo, created_at')
      .eq('empleado_id', data.id)
      .gte('created_at', hoy.toISOString())
      .order('created_at', { ascending: false })

    const ultimo = fiches?.[0]?.tipo
    const siguiente = ultimo === 'entrada' ? 'salida' : 'entrada'

    setEmpleado(data as Empleado)
    setFichajesHoy((fiches ?? []) as FichajeHoy[])
    setTipoFichaje(siguiente)
    setLoading(false)
    setFase('confirmar')
  }

  async function confirmarFichaje() {
    if (!empleado) return
    setLoading(true)
    await supabase.from('fichajes').insert({ empleado_id: empleado.id, tipo: tipoFichaje })
    setLoading(false)
    setFase('ok')
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
          <UtensilsCrossed className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">Lugano Smart Rest</p>
          <p className="text-gray-500 text-xs mt-0.5" suppressHydrationWarning>{horaActual}</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-xs">

        {/* ─── Fase PIN ─────────────────────────────────── */}
        {fase === 'pin' && (
          <div className={shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}>
            <p className="text-center text-gray-400 text-sm mb-6">{emp.fichar ?? 'Inserisci il tuo PIN'}</p>

            {/* Dots */}
            <div className="flex justify-center gap-4 mb-8">
              {[0,1,2,3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    i < pin.length ? 'bg-white scale-110' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {keys.map((k, idx) => {
                if (k === '') return <div key={idx} />
                if (k === '⌫') return (
                  <button
                    key={idx}
                    onClick={borrar}
                    className="h-16 rounded-2xl bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-colors active:scale-95"
                  >
                    <Delete className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                )
                return (
                  <button
                    key={k}
                    onClick={() => presionar(k)}
                    className="h-16 rounded-2xl bg-gray-800 text-white text-xl font-semibold hover:bg-gray-700 transition-colors active:scale-95"
                  >
                    {k}
                  </button>
                )
              })}
            </div>

            <button
              onClick={verificarPin}
              disabled={pin.length !== 4 || loading}
              className="mt-5 w-full py-4 bg-white text-gray-900 rounded-2xl text-sm font-semibold
                         hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : (com.confirmar ?? 'Conferma')}
            </button>
          </div>
        )}

        {/* ─── Fase confirmar ───────────────────────────── */}
        {fase === 'confirmar' && empleado && (
          <div className="text-center space-y-6">
            <div>
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">
                {tipoFichaje === 'entrada' ? '👋' : '🏃'}
              </div>
              <p className="text-white text-xl font-bold">{empleado.nombre}</p>
              <p className="text-gray-500 text-sm mt-1">{rolLabel[empleado.rol]?.[locale] ?? empleado.rol}</p>
            </div>

            {/* Historial hoy */}
            {fichajesHoy.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-3 text-left space-y-1.5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{emp.fichajes_titolo ?? 'Oggi'}</p>
                {fichajesHoy.slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className={f.tipo === 'entrada' ? 'text-emerald-400' : 'text-red-400'}>
                      {f.tipo === 'entrada' ? '↗ ' : '↙ '}{emp[`fichaje_${f.tipo}`] ?? f.tipo}
                    </span>
                    <span className="text-gray-500">
                      {new Date(f.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Acción a confirmar */}
            <div className={`rounded-2xl p-4 ${tipoFichaje === 'entrada' ? 'bg-emerald-900/40 border border-emerald-700/50' : 'bg-red-900/40 border border-red-700/50'}`}>
              <div className="flex items-center justify-center gap-3">
                {tipoFichaje === 'entrada'
                  ? <LogIn className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                  : <LogOut className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                }
                <span className={`text-lg font-bold ${tipoFichaje === 'entrada' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {emp[`fichaje_${tipoFichaje}`] ?? tipoFichaje}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setFase('pin'); setPin('') }}
                className="py-3.5 rounded-xl bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                {com.cancelar ?? 'Annulla'}
              </button>
              <button
                onClick={confirmarFichaje}
                disabled={loading}
                className={`py-3.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  tipoFichaje === 'entrada'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {loading ? '...' : (com.confirmar ?? 'Conferma')}
              </button>
            </div>
          </div>
        )}

        {/* ─── Fase OK ──────────────────────────────────── */}
        {fase === 'ok' && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" strokeWidth={1} />
            <p className="text-white text-lg font-semibold">{empleado?.nombre}</p>
            <p className="text-emerald-400 text-sm">
              {tipoFichaje === 'entrada' ? emp.fichaje_entrada : emp.fichaje_salida} ✓
            </p>
            <p className="text-gray-600 text-xs flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        {/* ─── Fase Error ───────────────────────────────── */}
        {fase === 'error' && (
          <div className="text-center space-y-4 py-4">
            <XCircle className="w-16 h-16 text-red-400 mx-auto" strokeWidth={1} />
            <p className="text-red-400 text-sm">PIN non riconosciuto</p>
          </div>
        )}
      </div>

      {/* Footer hint */}
      {fase === 'pin' && (
        <p className="mt-10 text-gray-700 text-xs text-center">
          Lugano Smart Rest · Sistema di Gestione
        </p>
      )}

    </div>
  )
}
