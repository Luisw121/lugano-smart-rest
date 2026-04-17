'use client'

import { useState } from 'react'
import { Clock, LogIn, LogOut, ChefHat, Users, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/i18n/config'

type Rol = 'camarero' | 'cocinero' | 'responsable_sala'

interface Fichaje {
  id: string
  tipo: 'entrada' | 'salida'
  created_at: string
  empleado: { nombre: string; rol: Rol } | null
}

interface Props {
  fichajesIniciales: Fichaje[]
  dict: Record<string, unknown>
  locale: Locale
}

const rolIcons: Record<Rol, React.ElementType> = {
  camarero: Users,
  cocinero: ChefHat,
  responsable_sala: UserCheck,
}

export default function FichajesView({ fichajesIniciales, dict }: Props) {
  const emp = (dict.empleados ?? {}) as Record<string, string>
  const [fichajes, setFichajes] = useState<Fichaje[]>(fichajesIniciales)

  const supabase = createClient()

  async function recargar() {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('fichajes')
      .select('*, empleado:empleados(nombre, rol)')
      .gte('created_at', hoy.toISOString())
      .order('created_at', { ascending: false })
    if (data) setFichajes(data as Fichaje[])
  }

  const entradas = fichajes.filter((f) => f.tipo === 'entrada').length
  const salidas = fichajes.filter((f) => f.tipo === 'salida').length
  const enTurno = entradas - salidas

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{emp.fichajes_titolo}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{emp.fichajes_sottotitolo}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: emp.en_turno, value: enTurno, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: emp.fichaje_entrada, value: entradas, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: emp.fichaje_salida, value: salidas, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{emp.fecha}</h2>
          <button
            onClick={recargar}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            ↻ Refresh
          </button>
        </div>

        {fichajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Clock className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" strokeWidth={1} />
            <p className="text-sm text-gray-400 dark:text-gray-500">{emp.sin_fichajes}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {fichajes.map((f) => {
              const RolIcon = f.empleado ? rolIcons[f.empleado.rol] ?? Users : Users
              return (
                <div key={f.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    f.tipo === 'entrada'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {f.tipo === 'entrada'
                      ? <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                      : <LogOut className="w-4 h-4 text-red-500 dark:text-red-400" strokeWidth={1.5} />
                    }
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <RolIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {f.empleado?.nombre ?? '—'}
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    f.tipo === 'entrada'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {f.tipo === 'entrada' ? emp.fichaje_entrada : emp.fichaje_salida}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                    {new Date(f.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
