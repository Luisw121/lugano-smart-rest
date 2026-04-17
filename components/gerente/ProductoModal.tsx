'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { IngredienteConEstado, Unidad } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

const UNIDADES: Unidad[] = ['kg', 'g', 'l', 'ml', 'unidad', 'porciones']

interface Props {
  ingrediente: IngredienteConEstado | null
  dict: Record<string, Record<string, string | Record<string, string>>>
  onClose: () => void
  onSaved: () => void
}

interface FormState {
  nombre: string
  unidad: Unidad
  stock_actual: string
  stock_minimo: string
  costo_unidad: string
  proveedor: string
}

export default function ProductoModal({ ingrediente, dict, onClose, onSaved }: Props) {
  const m = (dict.inventario as Record<string, Record<string, string>>).modal
  const u = (dict.inventario as Record<string, Record<string, string>>).unidades

  const [form, setForm] = useState<FormState>({
    nombre:        ingrediente?.nombre ?? '',
    unidad:        ingrediente?.unidad ?? 'kg',
    stock_actual:  ingrediente?.stock_actual.toString() ?? '0',
    stock_minimo:  ingrediente?.stock_minimo.toString() ?? '0',
    costo_unidad:  ingrediente?.costo_unidad.toString() ?? '0',
    proveedor:     ingrediente?.proveedor ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const payload = {
      nombre:       form.nombre.trim(),
      unidad:       form.unidad,
      stock_actual: parseFloat(form.stock_actual) || 0,
      stock_minimo: parseFloat(form.stock_minimo) || 0,
      costo_unidad: parseFloat(form.costo_unidad) || 0,
      proveedor:    form.proveedor.trim() || null,
      activo:       true,
    }

    if (!payload.nombre) {
      setError('Il nome è obbligatorio')
      setSaving(false)
      return
    }

    const { error: dbError } = ingrediente
      ? await supabase.from('ingredientes').update(payload).eq('id', ingrediente.id)
      : await supabase.from('ingredientes').insert(payload)

    setSaving(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {ingrediente ? m.titolo_modifica : m.titolo_nuovo}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Nome */}
          <Field label={m.nome}>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => update('nombre', e.target.value)}
              className={inputCls}
              placeholder="es. Farina 00"
              required
            />
          </Field>

          {/* Unidad */}
          <Field label={m.unita}>
            <select
              value={form.unidad}
              onChange={(e) => update('unidad', e.target.value as Unidad)}
              className={inputCls}
            >
              {UNIDADES.map((un) => (
                <option key={un} value={un}>
                  {u[un] ?? un}
                </option>
              ))}
            </select>
          </Field>

          {/* Stock actual + mínimo */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={m.stock_attuale}>
              <input
                type="number"
                min="0"
                step="0.001"
                value={form.stock_actual}
                onChange={(e) => update('stock_actual', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={m.stock_minimo}>
              <input
                type="number"
                min="0"
                step="0.001"
                value={form.stock_minimo}
                onChange={(e) => update('stock_minimo', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Costo */}
          <Field label={m.costo_unita}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">CHF</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.costo_unidad}
                onChange={(e) => update('costo_unidad', e.target.value)}
                className={`${inputCls} pl-12`}
              />
            </div>
          </Field>

          {/* Fornitore */}
          <Field label={m.fornitore}>
            <input
              type="text"
              value={form.proveedor}
              onChange={(e) => update('proveedor', e.target.value)}
              className={inputCls}
              placeholder="es. Ticino Formaggi SA"
            />
          </Field>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {m.annulla}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gray-900 rounded-xl text-sm font-medium text-white
                         hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '...' : m.salva}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl ' +
  'focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 ' +
  'placeholder-gray-400 transition-all'
