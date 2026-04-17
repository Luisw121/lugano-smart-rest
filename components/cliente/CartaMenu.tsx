'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, SlidersHorizontal, X, ChevronUp } from 'lucide-react'
import type { Locale } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import CartaProducto from './CartaProducto'

interface Trad { idioma_id: string; nombre: string; descripcion?: string | null }
interface Alergeno {
  id: string; slug: string; icono: string
  traducciones: { idioma_id: string; nombre: string }[]
}
interface Producto {
  id: string; precio: number; disponible: boolean; imagen_url: string | null
  categoria_id: string | null
  traducciones: { idioma_id: string; nombre: string; descripcion: string | null }[]
  alergenos: { alergeno: Alergeno }[]
}
interface Categoria {
  id: string; slug: string; orden: number
  traducciones: { idioma_id: string; nombre: string }[]
}

interface Props {
  categorias: Categoria[]
  productos: Producto[]
  alergenos: Alergeno[]
  dict: Record<string, Record<string, string>>
  locale: Locale
}

const HERO_BG = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80'

export default function CartaMenu({ categorias, productos: prodIniciales, alergenos, dict, locale }: Props) {
  const t = dict.carta

  const [productos, setProductos]               = useState<Producto[]>(prodIniciales)
  const [busqueda, setBusqueda]                 = useState('')
  const [categoriaActiva, setCategoriaActiva]   = useState<string | null>(null)
  const [alergenosActivos, setAlergenosActivos] = useState<Set<string>>(new Set())
  const [mostrarFiltros, setMostrarFiltros]     = useState(false)
  const [showScrollTop, setShowScrollTop]       = useState(false)

  const supabase = createClient()
  const seccionRefs = useRef<Map<string, HTMLElement>>(new Map())

  useEffect(() => {
    const channel = supabase
      .channel('carta-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'productos' }, (payload) => {
        setProductos((prev) =>
          prev.map((p) => p.id === payload.new.id ? { ...p, disponible: payload.new.disponible as boolean } : p)
        )
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleAlergeno = useCallback((id: string) => {
    setAlergenosActivos((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  function nombre(trads: Trad[], fallback = '—') {
    return trads.find((t) => t.idioma_id === locale)?.nombre ?? trads[0]?.nombre ?? fallback
  }

  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    return productos.filter((p) => {
      if (alergenosActivos.size > 0) {
        const ids = p.alergenos.map((a) => a.alergeno.id)
        if (ids.some((id) => alergenosActivos.has(id))) return false
      }
      if (q) {
        const trad = p.traducciones.find((t) => t.idioma_id === locale) ?? p.traducciones[0]
        return trad?.nombre.toLowerCase().includes(q) || trad?.descripcion?.toLowerCase().includes(q)
      }
      return true
    })
  }, [productos, alergenosActivos, busqueda, locale])

  const categoriasSorted = useMemo(() => [...categorias].sort((a, b) => a.orden - b.orden), [categorias])

  const porCategoria = useMemo(() => {
    return categoriasSorted.map((cat) => ({
      cat,
      items: productosFiltrados.filter((p) => p.categoria_id === cat.id),
    })).filter(({ items }) => items.length > 0)
  }, [categoriasSorted, productosFiltrados])

  function scrollACategoria(catId: string) {
    setCategoriaActiva(catId)
    const el = seccionRefs.current.get(catId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Emoji per categoria slug
  const catEmoji: Record<string, string> = {
    antipasti: '🫒', primi: '🍝', secondi: '🥩', contorni: '🥗', dolci: '🍮', bevande: '🍷',
  }

  return (
    <div className="pb-20">

      {/* ── Hero ───────────────────────────────────────────── */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={HERO_BG}
          alt="Lugano Smart Rest"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 text-center px-4">
          <p className="text-white/70 text-xs uppercase tracking-[0.3em] mb-2 font-medium">
            Lugano · Svizzera
          </p>
          <h1 className="text-white text-3xl font-black tracking-tight leading-none">
            Lugano Smart Rest
          </h1>
          <p className="text-white/80 text-sm mt-2">{t.subtitulo}</p>
        </div>
      </div>

      {/* ── Buscador + Filtros ─────────────────────────────── */}
      <div className="px-4 pt-5 pb-2 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" strokeWidth={1.5} />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t.buscar}
            className="w-full pl-10 pr-10 py-3 bg-white border border-stone-200 rounded-2xl text-sm
                       placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10
                       focus:border-stone-300 shadow-sm transition-all"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Filtros alérgenos */}
        <button
          onClick={() => setMostrarFiltros((v) => !v)}
          className={[
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors w-full justify-between',
            mostrarFiltros || alergenosActivos.size > 0
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-white text-stone-600 border-stone-200',
          ].join(' ')}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} />
            <span>{t.alergenos_titulo}</span>
            {alergenosActivos.size > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{alergenosActivos.size}</span>
            )}
          </div>
          {mostrarFiltros && <X className="w-4 h-4" strokeWidth={1.5} />}
        </button>

        {mostrarFiltros && (
          <div className="p-4 bg-white border border-stone-100 rounded-2xl shadow-sm space-y-3">
            <p className="text-xs text-stone-500 leading-relaxed">{t.alergenos_info}</p>
            <div className="flex flex-wrap gap-2">
              {alergenos.map((al) => {
                const activo = alergenosActivos.has(al.id)
                const nom = al.traducciones.find((tr) => tr.idioma_id === locale)?.nombre ?? al.traducciones[0]?.nombre ?? al.slug
                return (
                  <button
                    key={al.id}
                    onClick={() => toggleAlergeno(al.id)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                      activo ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300',
                    ].join(' ')}
                  >
                    <span className="text-base leading-none">{al.icono}</span>
                    {nom}
                    {activo && <X className="w-3 h-3 ml-0.5" strokeWidth={2.5} />}
                  </button>
                )
              })}
            </div>
            {alergenosActivos.size > 0 && (
              <button onClick={() => setAlergenosActivos(new Set())} className="text-xs text-stone-500 underline underline-offset-2">
                Rimuovi tutti i filtri
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Nav categorías ─────────────────────────────────── */}
      {categoriasSorted.length > 0 && (
        <div className="sticky top-11 z-30 bg-stone-50/95 backdrop-blur-sm border-b border-stone-100">
          <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-none">
            {porCategoria.map(({ cat }) => {
              const activa = categoriaActiva === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollACategoria(cat.id)}
                  className={[
                    'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all',
                    activa
                      ? 'bg-stone-900 text-white shadow-sm scale-[1.02]'
                      : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:bg-stone-50',
                  ].join(' ')}
                >
                  <span>{catEmoji[cat.slug] ?? '🍽️'}</span>
                  {nombre(cat.traducciones)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Contenido por categoría ────────────────────────── */}
      <div className="px-4 pt-6 space-y-10">
        {porCategoria.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-lg font-semibold text-stone-400">{t.sin_resultados}</p>
            <p className="text-sm text-stone-300">{t.sin_resultados_sub}</p>
          </div>
        ) : (
          porCategoria.map(({ cat, items }) => (
            <section
              key={cat.id}
              ref={(el) => { if (el) seccionRefs.current.set(cat.id, el) }}
            >
              {/* Cabecera de sección */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{catEmoji[cat.slug] ?? '🍽️'}</span>
                <div>
                  <h2 className="text-lg font-black text-stone-900 tracking-tight">{nombre(cat.traducciones)}</h2>
                  <p className="text-xs text-stone-400">{items.length} {items.length === 1 ? 'piatto' : 'piatti'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {items.map((prod) => (
                  <CartaProducto
                    key={prod.id}
                    producto={prod}
                    locale={locale}
                    dict={t}
                    alergenosActivos={alergenosActivos}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* ── Scroll top ─────────────────────────────────────── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-4 w-10 h-10 bg-stone-900 text-white rounded-full
                     flex items-center justify-center shadow-lg hover:bg-stone-800 transition-all active:scale-90 z-50"
          aria-label={t.volver_arriba}
        >
          <ChevronUp className="w-5 h-5" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
