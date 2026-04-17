'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChefHat, Bell } from 'lucide-react'
import type { Pedido, PedidoItem, Producto, ProductoTrad, Locale } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import KdsTarjeta from './KdsTarjeta'

type FiltroEstado = 'todos' | 'pendiente' | 'en_preparacion' | 'listo'

interface Props {
  pedidosIniciales: Pedido[]
  productos: (Producto & { traducciones: ProductoTrad[] })[]
  dict: Record<string, Record<string, string | Record<string, string>>>
  locale: Locale
}

const SIGUIENTE_ESTADO: Record<string, string> = {
  pendiente:      'en_preparacion',
  en_preparacion: 'listo',
  listo:          'entregado',
}

export default function KdsBoard({ pedidosIniciales, productos, dict, locale }: Props) {
  const t = dict.kds as Record<string, string | Record<string, string>>
  const filtrosDict = t.filtros as Record<string, string>

  const [pedidos, setPedidos]       = useState<Pedido[]>(pedidosIniciales)
  const [filtro, setFiltro]         = useState<FiltroEstado>('todos')
  const [ahora, setAhora]           = useState(Date.now())
  const [nuevaComanda, setNueva]    = useState(false)
  const prevCount                   = useRef(pedidosIniciales.length)

  const supabase = createClient()

  // ── Reloj interno — refresca minutos transcurridos ────────
  useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  // ── Supabase Realtime ──────────────────────────────────────
  const refreshPedidos = useCallback(async () => {
    const { data } = await supabase
      .from('pedidos')
      .select(`*, mesa:mesas(numero, zona), items:pedido_items(*)`)
      .not('estado', 'in', '("pagado","cancelado")')
      .order('created_at', { ascending: true })
    if (!data) return

    // Alerta visual si llegó una comanda nueva
    if (data.length > prevCount.current) {
      setNueva(true)
      setTimeout(() => setNueva(false), 3000)
    }
    prevCount.current = data.length
    setPedidos(data as Pedido[])
  }, [supabase])

  useEffect(() => {
    const channel = supabase
      .channel('kds-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' },        refreshPedidos)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedido_items' },   refreshPedidos)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, refreshPedidos])

  // ── Avanzar estado de ítem ─────────────────────────────────
  async function avanzarItem(itemId: string, estadoActual: string) {
    const next = SIGUIENTE_ESTADO[estadoActual]
    if (!next) return
    await supabase.from('pedido_items').update({ estado: next }).eq('id', itemId)
    // Realtime lo propaga; igual forzamos refresco local para respuesta inmediata
    setPedidos((prev) =>
      prev.map((p) => ({
        ...p,
        items: ((p.items ?? []) as PedidoItem[]).map((i) =>
          i.id === itemId ? { ...i, estado: next } : i
        ),
      }))
    )
  }

  // ── Filtrar pedidos con ítems relevantes ───────────────────
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const items = (p.items ?? []) as PedidoItem[]
      const activos = items.filter((i) => i.estado !== 'entregado')
      if (activos.length === 0) return false
      if (filtro === 'todos') return true
      return activos.some((i) => i.estado === filtro)
    })
  }, [pedidos, filtro])

  // Contadores para badges de filtro
  const contadores = useMemo(() => {
    const all = pedidos.flatMap((p) =>
      ((p.items ?? []) as PedidoItem[]).filter((i) => i.estado !== 'entregado')
    )
    return {
      todos:          all.length,
      pendiente:      all.filter((i) => i.estado === 'pendiente').length,
      en_preparacion: all.filter((i) => i.estado === 'en_preparacion').length,
      listo:          all.filter((i) => i.estado === 'listo').length,
    }
  }, [pedidos])

  function minutosDesde(isoDate: string): number {
    return Math.floor((ahora - new Date(isoDate).getTime()) / 60_000)
  }

  const FILTROS: FiltroEstado[] = ['todos', 'pendiente', 'en_preparacion', 'listo']

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white">
      {/* Header KDS */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <ChefHat className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
          <h1 className="text-sm font-semibold text-white tracking-tight">
            {t.titolo as string}
          </h1>
          {nuevaComanda && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500 rounded-full animate-bounce">
              <Bell className="w-3.5 h-3.5 text-white" strokeWidth={2} />
              <span className="text-xs font-bold text-white">{filtrosDict.pendiente}!</span>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-xl p-1">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filtro === f
                  ? 'bg-white text-gray-900'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700',
              ].join(' ')}
            >
              {filtrosDict[f]}
              {contadores[f] > 0 && (
                <span
                  className={[
                    'px-1.5 py-0.5 rounded-full text-xs font-bold leading-none',
                    filtro === f ? 'bg-gray-200 text-gray-700' : 'bg-gray-700 text-gray-300',
                    f === 'pendiente' && contadores[f] > 0 ? 'bg-amber-500 text-white' : '',
                  ].join(' ')}
                >
                  {contadores[f]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {pedidosFiltrados.length} {t.comanda as string}{pedidosFiltrados.length !== 1 ? 'e' : 'a'}
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Realtime attivo" />
        </div>
      </header>

      {/* Grid de comandas */}
      <div className="flex-1 overflow-y-auto p-5">
        {pedidosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <ChefHat className="w-16 h-16 text-gray-700" strokeWidth={0.8} />
            <p className="text-lg font-semibold text-gray-500">{t.sin_comandas as string}</p>
            <p className="text-sm text-gray-600">{t.sin_comandas_desc as string}</p>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {pedidosFiltrados.map((pedido) => (
              <KdsTarjeta
                key={pedido.id}
                pedido={pedido as Pedido & { mesa?: { numero: number; zona: string } }}
                productos={productos}
                filtro={filtro}
                minutosTranscurridos={minutosDesde(pedido.created_at)}
                locale={locale}
                dict={t as Record<string, string>}
                onAvanzarItem={avanzarItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status bar inferior */}
      <footer className="px-6 py-2 bg-gray-900 border-t border-gray-800 flex items-center gap-6 flex-shrink-0">
        <span className="text-xs text-gray-500 tabular-nums">
          {new Date(ahora).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="flex items-center gap-4">
          {[
            { label: filtrosDict.pendiente,      count: contadores.pendiente,      dot: 'bg-gray-400' },
            { label: filtrosDict.en_preparacion, count: contadores.en_preparacion, dot: 'bg-amber-400' },
            { label: filtrosDict.listo,          count: contadores.listo,          dot: 'bg-emerald-400' },
          ].map(({ label, count, dot }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dot}`} />
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-xs font-bold text-gray-300">{count}</span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  )
}
