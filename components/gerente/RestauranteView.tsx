'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, UtensilsCrossed, Users, Armchair } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Zona = 'sala' | 'terraza' | 'privado'

interface Mesa {
  id: string
  numero: number
  capacidad: number
  estado: string
  zona: Zona
  activo: boolean
}

interface Props {
  mesasIniciales: Mesa[]
}

const ZONAS: { value: Zona; label: string; emoji: string }[] = [
  { value: 'sala',     label: 'Sala',     emoji: '🍽️' },
  { value: 'terraza',  label: 'Terrazza', emoji: '☀️' },
  { value: 'privado',  label: 'Privato',  emoji: '🔒' },
]

const estadoColor: Record<string, string> = {
  libre:    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  ocupada:  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  reservada:'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
}

const estadoLabel: Record<string, string> = {
  libre: 'Libero', ocupada: 'Occupato', reservada: 'Riservato',
}

export default function RestauranteView({ mesasIniciales }: Props) {
  const [mesas, setMesas]         = useState<Mesa[]>(mesasIniciales)
  const [zonaFiltro, setZonaFiltro] = useState<Zona | 'todas'>('todas')
  const [modal, setModal]         = useState<{ open: boolean; mesa: Mesa | null }>({ open: false, mesa: null })
  const [form, setForm]           = useState({ numero: '', capacidad: '4', zona: 'sala' as Zona })
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const supabase = createClient()

  async function recargar() {
    const { data } = await supabase.from('mesas').select('*').eq('activo', true).order('numero')
    setMesas((data ?? []) as Mesa[])
  }

  function abrirNuevo() {
    const siguiente = mesas.length > 0 ? Math.max(...mesas.map(m => m.numero)) + 1 : 1
    setForm({ numero: String(siguiente), capacidad: '4', zona: 'sala' })
    setError('')
    setModal({ open: true, mesa: null })
  }

  function abrirEditar(m: Mesa) {
    setForm({ numero: String(m.numero), capacidad: String(m.capacidad), zona: m.zona })
    setError('')
    setModal({ open: true, mesa: m })
  }

  async function guardar() {
    const num = parseInt(form.numero)
    const cap = parseInt(form.capacidad)
    if (!num || num < 1)  { setError('Numero tavolo non valido'); return }
    if (!cap || cap < 1)  { setError('Capacità non valida'); return }

    // Check duplicate numero
    const duplicado = mesas.find(m => m.numero === num && m.id !== modal.mesa?.id)
    if (duplicado) { setError(`Il tavolo ${num} esiste già`); return }

    setLoading(true); setError('')
    let dbError = null
    if (modal.mesa) {
      const { error } = await supabase.from('mesas')
        .update({ numero: num, capacidad: cap, zona: form.zona })
        .eq('id', modal.mesa.id)
      dbError = error
    } else {
      const { error } = await supabase.from('mesas')
        .insert({ numero: num, capacidad: cap, zona: form.zona, estado: 'libre', activo: true })
      dbError = error
    }
    setLoading(false)
    if (dbError) { setError(`Errore DB: ${dbError.message}`); return }
    setModal({ open: false, mesa: null })
    await recargar()
  }

  async function eliminar(id: string) {
    await supabase.from('mesas').update({ activo: false }).eq('id', id)
    setConfirmDelete(null)
    await recargar()
  }

  const mesasFiltradas = mesas.filter(m => zonaFiltro === 'todas' || m.zona === zonaFiltro)

  const stats = {
    total:    mesas.length,
    libres:   mesas.filter(m => m.estado === 'libre').length,
    ocupadas: mesas.filter(m => m.estado === 'ocupada').length,
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestione Tavoli</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Aggiungi, modifica o elimina i tavoli del ristorante</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900
                     text-sm font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Aggiungi tavolo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Totale tavoli', value: stats.total,    color: 'text-gray-900 dark:text-white' },
          { label: 'Liberi',        value: stats.libres,   color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Occupati',      value: stats.ocupadas, color: 'text-red-600 dark:text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Zona filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[{ value: 'todas' as const, label: 'Tutte le zone', emoji: '🍴' }, ...ZONAS].map(z => (
          <button
            key={z.value}
            onClick={() => setZonaFiltro(z.value)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors',
              zonaFiltro === z.value
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            <span>{z.emoji}</span> {z.label}
          </button>
        ))}
      </div>

      {/* Grid de mesas */}
      {mesasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UtensilsCrossed className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" strokeWidth={1} />
          <p className="text-gray-400 dark:text-gray-500">Nessun tavolo trovato</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Aggiungi il primo tavolo con il pulsante in alto</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {mesasFiltradas
            .sort((a, b) => a.numero - b.numero)
            .map(m => {
              const zona = ZONAS.find(z => z.value === m.zona)
              return (
                <div
                  key={m.id}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Number badge */}
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">#{m.numero}</span>
                    </div>
                    <span className="text-lg">{zona?.emoji ?? '🍽️'}</span>
                  </div>

                  <div className="px-4 py-3 space-y-2">
                    {/* Estado */}
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor[m.estado] ?? estadoColor.libre}`}>
                      {estadoLabel[m.estado] ?? m.estado}
                    </span>

                    {/* Capacidad */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Users className="w-3 h-3" strokeWidth={1.5} />
                      <span>{m.capacidad} persone</span>
                    </div>

                    {/* Zona */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                      <Armchair className="w-3 h-3" strokeWidth={1.5} />
                      <span>{zona?.label ?? m.zona}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 pt-1 border-t border-gray-50 dark:border-gray-800">
                      <button
                        onClick={() => abrirEditar(m)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-500 dark:text-gray-400
                                   hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Pencil className="w-3 h-3" strokeWidth={1.5} />
                        Modifica
                      </button>
                      <button
                        onClick={() => setConfirmDelete(m.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-400
                                   hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
                      >
                        <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              {modal.mesa ? 'Modifica Tavolo' : 'Nuovo Tavolo'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Numero tavolo
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.numero}
                  onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                             rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Posti a sedere
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[2, 4, 6, 8, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => setForm(f => ({ ...f, capacidad: String(n) }))}
                      className={[
                        'flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                        form.capacidad === String(n)
                          ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300',
                      ].join(' ')}
                    >
                      <Users className="w-3 h-3" strokeWidth={1.5} /> {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Zona
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ZONAS.map(z => (
                    <button
                      key={z.value}
                      onClick={() => setForm(f => ({ ...f, zona: z.value }))}
                      className={[
                        'flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-medium border transition-colors',
                        form.zona === z.value
                          ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300',
                      ].join(' ')}
                    >
                      <span className="text-lg">{z.emoji}</span>
                      {z.label}
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
                onClick={() => setModal({ open: false, mesa: null })}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={guardar}
                disabled={loading}
                className="flex-1 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-medium
                           hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {loading ? '...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Eliminare questo tavolo?</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Questa azione non può essere annullata</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => eliminar(confirmDelete)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
