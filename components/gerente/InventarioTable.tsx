'use client'

import { useState, useMemo, useTransition } from 'react'
import { Plus, Search, Pencil, Trash2, TrendingDown, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import type { IngredienteConEstado, Locale } from '@/types/database'
import ProductoModal from './ProductoModal'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  ingredientes: IngredienteConEstado[]
  dict: Record<string, Record<string, string | Record<string, string>>>
  locale: Locale
}

const estadoConfig: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  ok:      { label: 'ok',      bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  bajo:    { label: 'basso',   bg: 'bg-amber-50',   text: 'text-amber-700',   icon: TrendingDown },
  critico: { label: 'critico', bg: 'bg-orange-50',  text: 'text-orange-700',  icon: AlertTriangle },
  agotado: { label: 'esaurito',bg: 'bg-red-50',     text: 'text-red-700',     icon: XCircle },
}

export default function InventarioTable({ ingredientes, dict, locale }: Props) {
  const inv = dict.inventario as Record<string, Record<string, string>>
  const col = inv.colonne
  const stateLabels = inv.stato
  const unidadesLabels = inv.unidades

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<IngredienteConEstado | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const supabase = createClient()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return ingredientes.filter(
      (i) =>
        i.nombre.toLowerCase().includes(q) ||
        (i.proveedor ?? '').toLowerCase().includes(q)
    )
  }, [ingredientes, search])

  async function handleDelete(id: string) {
    await supabase.from('ingredientes').update({ activo: false }).eq('id', id)
    setDeleteId(null)
    startTransition(() => router.refresh())
  }

  function openEdit(item: IngredienteConEstado) {
    setEditing(item)
    setModalOpen(true)
  }

  function openNew() {
    setEditing(null)
    setModalOpen(true)
  }

  function onSaved() {
    setModalOpen(false)
    startTransition(() => router.refresh())
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={inv.cerca as unknown as string}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl
                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10
                       focus:border-gray-300 transition-all"
          />
        </div>

        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium
                     rounded-xl hover:bg-gray-800 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          {inv.aggiungi as unknown as string}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[col.nome, col.unita, col.stock, col.minimo, col.costo, col.fornitore, col.stato, col.azioni].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-400">
                    {(dict.comun as Record<string, string>).sin_datos}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const cfg = estadoConfig[item.estado_stock] ?? estadoConfig.ok
                  const Icon = cfg.icon
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-900">{item.nombre}</td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {unidadesLabels[item.unidad] ?? item.unidad}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-semibold tabular-nums ${
                            item.estado_stock !== 'ok' ? cfg.text : 'text-gray-900'
                          }`}
                        >
                          {item.stock_actual.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 tabular-nums">
                        {item.stock_minimo.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 tabular-nums">
                        CHF {item.costo_unidad.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{item.proveedor ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                        >
                          <Icon className="w-3 h-3" strokeWidth={2} />
                          {stateLabels[item.estado_stock] ?? item.estado_stock}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {filtered.length} / {ingredientes.length} ingredienti
          </p>
          {isPending && (
            <span className="text-xs text-gray-400 animate-pulse">Aggiornamento...</span>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Conferma eliminazione</h3>
            <p className="text-sm text-gray-500 mb-6">
              Questa azione disattiverà l'ingrediente. Lo stock non verrà eliminato.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {(dict.comun as Record<string, string>).cancelar}
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2.5 bg-red-600 rounded-xl text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                {(dict.comun as Record<string, string>).eliminar}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ProductoModal
          ingrediente={editing}
          dict={dict}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
        />
      )}
    </>
  )
}
