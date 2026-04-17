'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, UserCheck, UserX, Clock, ChefHat, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/i18n/config'

type Rol = 'camarero' | 'cocinero' | 'responsable_sala'

interface Empleado {
  id: string
  nombre: string
  pin: string
  rol: Rol
  activo: boolean
  created_at: string
  ultimo_fichaje?: string | null
  ultimo_fichaje_at?: string | null
  en_turno?: boolean | null
}

interface Props {
  empleadosIniciales: Empleado[]
  dict: Record<string, unknown>
  locale: Locale
}

const rolIcons: Record<Rol, React.ElementType> = {
  camarero: Users,
  cocinero: ChefHat,
  responsable_sala: UserCheck,
}

const rolColors: Record<Rol, string> = {
  camarero: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  cocinero: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  responsable_sala: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
}

export default function EmpleadosView({ empleadosIniciales, dict }: Props) {
  const emp = (dict.empleados ?? {}) as Record<string, unknown>
  const com = (dict.comun ?? {}) as Record<string, string>
  const roles = (emp.roles ?? {}) as Record<Rol, string>

  const [empleados, setEmpleados] = useState<Empleado[]>(empleadosIniciales)
  const [modal, setModal] = useState<{ open: boolean; empleado: Empleado | null }>({ open: false, empleado: null })
  const [form, setForm] = useState({ nombre: '', pin: '', rol: 'camarero' as Rol })
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [error, setError] = useState('')

  const supabase = createClient()

  async function recargar() {
    const { data: emp } = await supabase.from('empleados').select('*').eq('activo', true).order('nombre')
    if (!emp) return
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const { data: fiches } = await supabase
      .from('fichajes').select('empleado_id, tipo, created_at')
      .gte('created_at', hoy.toISOString()).order('created_at', { ascending: false })
    const lastFichaje = new Map<string, { tipo: string; created_at: string }>()
    for (const f of fiches ?? []) {
      if (!lastFichaje.has(f.empleado_id)) lastFichaje.set(f.empleado_id, { tipo: f.tipo, created_at: f.created_at })
    }
    setEmpleados(emp.map((e) => {
      const lf = lastFichaje.get(e.id)
      return { ...e, ultimo_fichaje: lf?.tipo ?? null, ultimo_fichaje_at: lf?.created_at ?? null, en_turno: lf?.tipo === 'entrada' }
    }) as Empleado[])
  }

  function abrirNuevo() {
    setForm({ nombre: '', pin: '', rol: 'camarero' })
    setError('')
    setModal({ open: true, empleado: null })
  }

  function abrirEditar(e: Empleado) {
    setForm({ nombre: e.nombre, pin: e.pin, rol: e.rol })
    setError('')
    setModal({ open: true, empleado: e })
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError(String(emp.nombre)); return }
    if (!/^\d{4}$/.test(form.pin)) { setError(String(emp.pin)); return }
    setLoading(true)
    setError('')
    if (modal.empleado) {
      await supabase
        .from('empleados')
        .update({ nombre: form.nombre.trim(), pin: form.pin, rol: form.rol })
        .eq('id', modal.empleado.id)
    } else {
      await supabase
        .from('empleados')
        .insert({ nombre: form.nombre.trim(), pin: form.pin, rol: form.rol, activo: true })
    }
    setLoading(false)
    setModal({ open: false, empleado: null })
    await recargar()
  }

  async function eliminar(id: string) {
    await supabase.from('empleados').update({ activo: false }).eq('id', id)
    setConfirmDelete(null)
    await recargar()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{String(emp.titolo)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{String(emp.sottotitolo)}</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900
                     text-sm font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          {String(emp.aggiungi)}
        </button>
      </div>

      {/* Grid de empleados */}
      {empleados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" strokeWidth={1} />
          <p className="text-gray-400 dark:text-gray-500">{String(emp.sin_empleados)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {empleados.map((e) => {
            const RolIcon = rolIcons[e.rol]
            return (
              <div
                key={e.id}
                className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800
                           shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <RolIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{e.nombre}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${rolColors[e.rol]}`}>
                        {roles[e.rol] ?? e.rol}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {e.en_turno ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">
                        <UserCheck className="w-3 h-3" /> {String(emp.en_turno)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-full text-xs">
                        <UserX className="w-3 h-3" /> {String(emp.fuera_turno)}
                      </span>
                    )}
                  </div>
                </div>

                {e.ultimo_fichaje_at && (
                  <div className="flex items-center gap-1.5 mb-4 text-xs text-gray-400 dark:text-gray-500">
                    <Clock className="w-3 h-3" strokeWidth={1.5} />
                    <span>{String(emp.ultimo_fichaje)}: {new Date(e.ultimo_fichaje_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                      e.ultimo_fichaje === 'entrada'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}>
                      {e.ultimo_fichaje === 'entrada' ? String(emp.fichaje_entrada) : String(emp.fichaje_salida)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-gray-50 dark:border-gray-800">
                  <button
                    onClick={() => abrirEditar(e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                               text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Pencil className="w-3 h-3" strokeWidth={1.5} />
                    {com.editar}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(e.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                               text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
                  >
                    <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                    {com.eliminar}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              {modal.empleado ? String(emp.modal_editar) : String(emp.modal_nuevo)}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  {String(emp.nombre)}
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                             rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none
                             focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-all"
                  placeholder="Mario Rossi"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  {String(emp.pin)}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={form.pin}
                  onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                             rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none
                             focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-all tracking-[0.5em] font-mono"
                  placeholder="1234"
                />
                <p className="mt-1 text-xs text-gray-400">{String(emp.pin_placeholder)}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  {String(emp.rol)}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(roles) as Rol[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setForm((f) => ({ ...f, rol: r }))}
                      className={[
                        'py-2.5 px-2 rounded-xl text-xs font-medium border transition-colors text-center',
                        form.rol === r
                          ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600',
                      ].join(' ')}
                    >
                      {roles[r]}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal({ open: false, empleado: null })}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {com.cancelar}
              </button>
              <button
                onClick={guardar}
                disabled={loading}
                className="flex-1 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-medium
                           hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {loading ? com.cargando : com.guardar}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-5">
              {String(emp.confirmar_eliminar)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {com.cancelar}
              </button>
              <button
                onClick={() => eliminar(confirmDelete)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium
                           hover:bg-red-700 transition-colors"
              >
                {com.eliminar}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
