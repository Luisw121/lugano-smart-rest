'use client'

import { useMemo, useState } from 'react'
import {
  TrendingUp, ShoppingBag, Receipt, AlertTriangle,
  LayoutGrid, ChefHat, Banknote, CreditCard, MoreHorizontal,
} from 'lucide-react'
import type { Locale } from '@/types/database'

interface Pedido { total: number; metodo_pago: string | null; created_at: string }
interface ItemRaw {
  producto_id: string; cantidad: number
  producto: { id: string; traducciones: { idioma_id: string; nombre: string }[] } | null
}
interface StockAlerta { id: string; nombre: string; estado_stock: string }

interface Props {
  pedidosHoy:     Pedido[]
  pedidosSemana:  Pedido[]
  itemsRaw:       ItemRaw[]
  stockAlertas:   StockAlerta[]
  ordenesActivas: number
  mesasOcupadas:  number
  itemsCocina:    number
  dict: Record<string, Record<string, string | Record<string, string>>>
  locale: Locale
}

type Periodo = 'hoy' | 'semana'

function chf(n: number) { return `CHF ${n.toFixed(2)}` }

const metodoIcon = { efectivo: Banknote, tarjeta: CreditCard, otros: MoreHorizontal } as const

export default function MetricasView({
  pedidosHoy, pedidosSemana, itemsRaw, stockAlertas,
  ordenesActivas, mesasOcupadas, itemsCocina,
  dict, locale,
}: Props) {
  const t  = dict.metricas  as Record<string, string | Record<string, string>>
  const tp = t.periodo      as Record<string, string>
  const tk = t.kpis         as Record<string, string>

  const [periodo, setPeriodo] = useState<Periodo>('hoy')

  const pedidos = periodo === 'hoy' ? pedidosHoy : pedidosSemana

  // ── KPIs ──────────────────────────────────────────────────
  const ingresos    = pedidos.reduce((s, p) => s + (p.total ?? 0), 0)
  const numOrdenes  = pedidos.length
  const ticketMedio = numOrdenes > 0 ? ingresos / numOrdenes : 0

  // ── Ventas por método de pago ─────────────────────────────
  const porMetodo = ['efectivo', 'tarjeta', 'otros'].map((m) => ({
    metodo: m,
    total: pedidos.filter((p) => p.metodo_pago === m).reduce((s, p) => s + (p.total ?? 0), 0),
    count: pedidos.filter((p) => p.metodo_pago === m).length,
  }))
  const maxMetodo = Math.max(...porMetodo.map((x) => x.total), 1)

  // ── Top platos ────────────────────────────────────────────
  const topPlatos = useMemo(() => {
    const map = new Map<string, { nombre: string; cantidad: number; ingresos: number }>()
    itemsRaw.forEach((item) => {
      const nombre =
        item.producto?.traducciones?.find((t) => t.idioma_id === locale)?.nombre ??
        item.producto?.traducciones?.[0]?.nombre ??
        '—'
      const prev = map.get(item.producto_id) ?? { nombre, cantidad: 0, ingresos: 0 }
      map.set(item.producto_id, { nombre, cantidad: prev.cantidad + item.cantidad, ingresos: prev.ingresos })
    })
    return [...map.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 7)
  }, [itemsRaw, locale])
  const maxPlato = Math.max(...topPlatos.map((p) => p.cantidad), 1)

  // ── Ventas por hora (hoy) ─────────────────────────────────
  const ventasPorHora = useMemo(() => {
    const horas = Array.from({ length: 24 }, (_, i) => ({ hora: i, total: 0, count: 0 }))
    pedidosHoy.forEach((p) => {
      const h = new Date(p.created_at).getHours()
      horas[h].total += p.total ?? 0
      horas[h].count += 1
    })
    // Solo mostrar horas con actividad + contexto
    const horasActivas = horas.filter((h) => h.total > 0)
    if (horasActivas.length === 0) return horas.slice(10, 23)
    const minH = Math.max(0,  Math.min(...horasActivas.map((h) => h.hora)) - 1)
    const maxH = Math.min(23, Math.max(...horasActivas.map((h) => h.hora)) + 1)
    return horas.slice(minH, maxH + 1)
  }, [pedidosHoy])
  const maxHora = Math.max(...ventasPorHora.map((h) => h.total), 1)

  const kpis = [
    { label: tk.ingresos,      value: chf(ingresos),            icon: TrendingUp,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: tk.ordenes,       value: String(numOrdenes),        icon: ShoppingBag, color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: tk.ticket_medio,  value: chf(ticketMedio),          icon: Receipt,     color: 'text-purple-600',  bg: 'bg-purple-50' },
    { label: tk.alertas_stock, value: String(stockAlertas.length),icon: AlertTriangle,color: stockAlertas.length > 0 ? 'text-red-600' : 'text-gray-400', bg: stockAlertas.length > 0 ? 'bg-red-50' : 'bg-gray-50' },
  ]

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{t.titolo as string}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.sottotitolo as string}</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(['hoy', 'semana'] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={[
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                periodo === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {tp[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Live status */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t.ordenes_activas as string, value: ordenesActivas, icon: ShoppingBag },
          { label: t.mesas_ocupadas  as string, value: mesasOcupadas,  icon: LayoutGrid },
          { label: t.items_pendientes as string,value: itemsCocina,    icon: ChefHat },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-gray-900 text-white rounded-2xl px-5 py-4 flex items-center gap-3">
            <Icon className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
            <div>
              <p className="text-2xl font-black leading-none">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} strokeWidth={1.5} />
            </div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top platos */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{t.platos_top as string}</h2>
          {topPlatos.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">{t.sin_datos as string}</p>
          ) : (
            <div className="space-y-3">
              {topPlatos.map(({ nombre, cantidad }, idx) => (
                <div key={nombre} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-300 text-right flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-800 truncate">{nombre}</span>
                      <span className="text-xs font-semibold text-gray-600 ml-2 flex-shrink-0">
                        ×{cantidad}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(cantidad / maxPlato) * 100}%`,
                          background: idx === 0 ? '#111827' : idx === 1 ? '#374151' : '#9ca3af',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ventas por método */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{t.ventas_por_metodo as string}</h2>
          <div className="space-y-4">
            {porMetodo.map(({ metodo, total, count }) => {
              const Icon = metodoIcon[metodo as keyof typeof metodoIcon]
              const pct = maxMetodo > 0 ? (total / maxMetodo) * 100 : 0
              const label = (dict.caja as Record<string, Record<string, string>>).metodo[metodo]
              return (
                <div key={metodo}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                      <span className="text-sm text-gray-700">{label}</span>
                      <span className="text-xs text-gray-400">({count})</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">
                      CHF {total.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Gráfico ventas por hora */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">{t.ventas_por_hora as string}</h2>
        {ventasPorHora.every((h) => h.total === 0) ? (
          <p className="text-sm text-gray-400 py-8 text-center">{t.sin_datos as string}</p>
        ) : (
          <div className="flex items-end gap-1.5 h-32">
            {ventasPorHora.map(({ hora, total }) => {
              const pct = (total / maxHora) * 100
              return (
                <div key={hora} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex flex-col justify-end" style={{ height: '96px' }}>
                    {total > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white
                                      text-xs px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100
                                      transition-opacity pointer-events-none z-10">
                        {chf(total)}
                      </div>
                    )}
                    <div
                      className="w-full rounded-t-md transition-all duration-700"
                      style={{
                        height: `${pct}%`,
                        minHeight: total > 0 ? '4px' : '0',
                        backgroundColor: total > 0 ? '#111827' : '#f3f4f6',
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 tabular-nums">{hora}h</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Alertas de stock */}
      {stockAlertas.length > 0 && (
        <div className="bg-white border border-red-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold text-gray-900">
              {tk.alertas_stock} ({stockAlertas.length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {stockAlertas.map((alerta) => (
              <span
                key={alerta.id}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium',
                  alerta.estado_stock === 'agotado'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700',
                ].join(' ')}
              >
                {alerta.nombre}
                <span className="opacity-60 capitalize">· {alerta.estado_stock}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
