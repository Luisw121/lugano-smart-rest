'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, ChefHat, ImageOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/lib/i18n/config'

interface Trad { idioma_id: string; nombre: string; descripcion: string | null }
interface Categoria {
  id: string; slug: string; orden: number
  traducciones: { idioma_id: string; nombre: string }[]
}
interface Producto {
  id: string; precio: number; disponible: boolean
  imagen_url: string | null; activo: boolean; categoria_id: string | null
  traducciones: Trad[]
}

interface Props {
  productosIniciales: Producto[]
  categorias: Categoria[]
  dict: Record<string, unknown>
  locale: Locale
}

interface FormState {
  categoria_id: string
  precio: string
  imagen_url: string
  disponible: boolean
  nombre_it: string; nombre_en: string; nombre_es: string
  desc_it: string;   desc_en: string;   desc_es: string
}

const EMPTY_FORM: FormState = {
  categoria_id: '', precio: '', imagen_url: '',
  disponible: true,
  nombre_it: '', nombre_en: '', nombre_es: '',
  desc_it: '', desc_en: '', desc_es: '',
}

export default function PlatosView({ productosIniciales, categorias, locale }: Props) {
  const [productos, setProductos] = useState<Producto[]>(productosIniciales)
  const [modal, setModal] = useState<{ open: boolean; producto: Producto | null }>({ open: false, producto: null })
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [catActiva, setCatActiva] = useState<string | null>(null)

  const supabase = createClient()

  function catNombre(cat: Categoria) {
    return cat.traducciones.find((t) => t.idioma_id === locale)?.nombre
      ?? cat.traducciones[0]?.nombre ?? cat.slug
  }

  function prodNombre(p: Producto) {
    return p.traducciones.find((t) => t.idioma_id === locale)?.nombre
      ?? p.traducciones[0]?.nombre ?? '—'
  }

  async function recargar() {
    const { data } = await supabase
      .from('productos')
      .select('id, precio, disponible, imagen_url, activo, categoria_id, traducciones:productos_traducciones(idioma_id, nombre, descripcion)')
      .eq('activo', true).order('categoria_id').order('precio')
    if (data) setProductos(data as Producto[])
  }

  function abrirNuevo() {
    setForm({ ...EMPTY_FORM, categoria_id: categorias[0]?.id ?? '' })
    setModal({ open: true, producto: null })
  }

  function abrirEditar(p: Producto) {
    const get = (lang: string) => p.traducciones.find((t) => t.idioma_id === lang)
    setForm({
      categoria_id: p.categoria_id ?? '',
      precio: p.precio.toString(),
      imagen_url: p.imagen_url ?? '',
      disponible: p.disponible,
      nombre_it: get('it')?.nombre ?? '', nombre_en: get('en')?.nombre ?? '', nombre_es: get('es')?.nombre ?? '',
      desc_it: get('it')?.descripcion ?? '', desc_en: get('en')?.descripcion ?? '', desc_es: get('es')?.descripcion ?? '',
    })
    setModal({ open: true, producto: p })
  }

  async function guardar() {
    if (!form.nombre_it.trim()) return
    const precio = parseFloat(form.precio)
    if (!precio || precio <= 0) return
    setLoading(true)

    if (modal.producto) {
      // Update producto
      await supabase.from('productos').update({
        categoria_id: form.categoria_id || null,
        precio,
        imagen_url: form.imagen_url.trim() || null,
        disponible: form.disponible,
      }).eq('id', modal.producto.id)

      // Upsert traducciones
      for (const [lang, nombre, desc] of [
        ['it', form.nombre_it, form.desc_it],
        ['en', form.nombre_en, form.desc_en],
        ['es', form.nombre_es, form.desc_es],
      ] as const) {
        if (!nombre.trim()) continue
        await supabase.from('productos_traducciones').upsert({
          producto_id: modal.producto.id, idioma_id: lang,
          nombre: nombre.trim(), descripcion: desc.trim() || null,
        }, { onConflict: 'producto_id,idioma_id' })
      }
    } else {
      // Insert producto
      const { data } = await supabase.from('productos').insert({
        categoria_id: form.categoria_id || null,
        precio,
        imagen_url: form.imagen_url.trim() || null,
        disponible: form.disponible,
        activo: true,
      }).select('id').single()

      if (data) {
        for (const [lang, nombre, desc] of [
          ['it', form.nombre_it, form.desc_it],
          ['en', form.nombre_en, form.desc_en],
          ['es', form.nombre_es, form.desc_es],
        ] as const) {
          if (!nombre.trim()) continue
          await supabase.from('productos_traducciones').insert({
            producto_id: data.id, idioma_id: lang,
            nombre: nombre.trim(), descripcion: desc.trim() || null,
          })
        }
      }
    }

    setLoading(false)
    setModal({ open: false, producto: null })
    await recargar()
  }

  async function toggleDisponible(p: Producto) {
    await supabase.from('productos').update({ disponible: !p.disponible }).eq('id', p.id)
    setProductos((prev) => prev.map((x) => x.id === p.id ? { ...x, disponible: !x.disponible } : x))
  }

  async function eliminar(id: string) {
    await supabase.from('productos').update({ activo: false }).eq('id', id)
    setConfirmDelete(null)
    await recargar()
  }

  const productosFiltrados = catActiva
    ? productos.filter((p) => p.categoria_id === catActiva)
    : productos

  const f = (k: keyof FormState, v: string | boolean) => setForm((prev) => ({ ...prev, [k]: v }))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu & Piatti</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestisci i piatti, le foto e la disponibilità</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900
                     text-sm font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Aggiungi piatto
        </button>
      </div>

      {/* Filtro categorías */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setCatActiva(null)}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            !catActiva ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Tutti ({productos.length})
        </button>
        {categorias.map((cat) => {
          const count = productos.filter((p) => p.categoria_id === cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setCatActiva(cat.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                catActiva === cat.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {catNombre(cat)} ({count})
            </button>
          )
        })}
      </div>

      {/* Grid de platos */}
      {productosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ChefHat className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-3" strokeWidth={1} />
          <p className="text-gray-400 dark:text-gray-500">Nessun piatto trovato</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productosFiltrados.map((p) => {
            const cat = categorias.find((c) => c.id === p.categoria_id)
            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                  p.disponible ? 'border-gray-100 dark:border-gray-800' : 'border-dashed border-gray-200 dark:border-gray-700 opacity-60'
                }`}
              >
                {/* Imagen */}
                <div className="w-full h-36 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={prodNombre(p)} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-8 h-8 text-gray-300 dark:text-gray-600" strokeWidth={1} />
                    </div>
                  )}
                  {/* Badge disponibilidad */}
                  <div className="absolute top-2 right-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      p.disponible
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                    }`}>
                      {p.disponible ? 'Disponibile' : 'Non disp.'}
                    </span>
                  </div>
                  {/* Categoría */}
                  {cat && (
                    <div className="absolute bottom-2 left-2">
                      <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                        {catNombre(cat)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{prodNombre(p)}</p>
                    <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums flex-shrink-0">
                      CHF {p.precio.toFixed(2)}
                    </span>
                  </div>
                  {p.traducciones.find((t) => t.idioma_id === locale)?.descripcion && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mb-3">
                      {p.traducciones.find((t) => t.idioma_id === locale)?.descripcion}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-50 dark:border-gray-800">
                    <button
                      onClick={() => toggleDisponible(p)}
                      title={p.disponible ? 'Nascondi' : 'Mostra'}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      {p.disponible ? <Eye className="w-4 h-4" strokeWidth={1.5} /> : <EyeOff className="w-4 h-4" strokeWidth={1.5} />}
                    </button>
                    <button
                      onClick={() => abrirEditar(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Pencil className="w-3 h-3" strokeWidth={1.5} />
                      Modifica
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      className="ml-auto p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal crear/editar ─────────────────────────────── */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {modal.producto ? 'Modifica piatto' : 'Nuovo piatto'}
              </h2>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Categoria + Precio */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Categoria</label>
                  <select
                    value={form.categoria_id}
                    onChange={(e) => f('categoria_id', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— Nessuna —</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{catNombre(c)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Prezzo (CHF)</label>
                  <input
                    type="number" min="0" step="0.50"
                    value={form.precio}
                    onChange={(e) => f('precio', e.target.value)}
                    className={inputCls}
                    placeholder="18.50"
                  />
                </div>
              </div>

              {/* URL immagine */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">URL Immagine</label>
                <input
                  type="url"
                  value={form.imagen_url}
                  onChange={(e) => f('imagen_url', e.target.value)}
                  className={inputCls}
                  placeholder="https://images.unsplash.com/..."
                />
                {form.imagen_url && (
                  <div className="mt-2 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={form.imagen_url} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Disponibile toggle */}
              <div className="flex items-center justify-between py-2 px-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Disponibile in menu</span>
                <button
                  onClick={() => f('disponible', !form.disponible)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.disponible ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.disponible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Nomi per lingua */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nomi & Descrizioni</p>
                {([['it', '🇮🇹', form.nombre_it, form.desc_it, 'nombre_it', 'desc_it'],
                   ['en', '🇬🇧', form.nombre_en, form.desc_en, 'nombre_en', 'desc_en'],
                   ['es', '🇪🇸', form.nombre_es, form.desc_es, 'nombre_es', 'desc_es']] as const).map(([lang, flag, nom, desc, kn, kd]) => (
                  <div key={lang} className="space-y-1.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{flag} {lang.toUpperCase()}</p>
                    <input
                      type="text"
                      value={nom}
                      onChange={(e) => f(kn as keyof FormState, e.target.value)}
                      className={inputCls}
                      placeholder="Nome del piatto..."
                    />
                    <textarea
                      value={desc}
                      onChange={(e) => f(kd as keyof FormState, e.target.value)}
                      rows={2}
                      className={`${inputCls} resize-none`}
                      placeholder="Descrizione breve..."
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => setModal({ open: false, producto: null })}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={guardar}
                disabled={loading || !form.nombre_it.trim() || !form.precio}
                className="flex-1 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-semibold
                           hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                {loading ? '...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete ────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-5">
              Eliminare questo piatto dal menu?
            </p>
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

const inputCls =
  'w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl ' +
  'text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 ' +
  'dark:focus:ring-white/10 focus:border-gray-300 dark:focus:border-gray-600 transition-all'
