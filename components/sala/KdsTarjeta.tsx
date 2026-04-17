'use client'

import { ChevronRight, StickyNote } from 'lucide-react'
import type { Pedido, PedidoItem, Producto, ProductoTrad, Locale } from '@/types/database'

type FiltroEstado = 'todos' | 'pendiente' | 'en_preparacion' | 'listo'

interface Props {
  pedido: Pedido & { mesa?: { numero: number; zona: string } }
  productos: (Producto & { traducciones: ProductoTrad[] })[]
  filtro: FiltroEstado
  minutosTranscurridos: number
  locale: Locale
  dict: Record<string, string>
  onAvanzarItem: (itemId: string, estadoActual: string) => void
}

const SIGUIENTE_ESTADO: Record<string, string> = {
  pendiente:      'en_preparacion',
  en_preparacion: 'listo',
  listo:          'entregado',
}

const itemEstadoStyles: Record<string, { bg: string; border: string; badge: string; badgeTxt: string }> = {
  pendiente:      { bg: 'bg-white',       border: 'border-gray-200',  badge: 'bg-gray-100',   badgeTxt: 'text-gray-500' },
  en_preparacion: { bg: 'bg-amber-50',    border: 'border-amber-200', badge: 'bg-amber-400',  badgeTxt: 'text-white' },
  listo:          { bg: 'bg-emerald-50',  border: 'border-emerald-200',badge: 'bg-emerald-500',badgeTxt: 'text-white' },
  entregado:      { bg: 'bg-gray-50',     border: 'border-gray-100',  badge: 'bg-gray-300',   badgeTxt: 'text-white' },
}

function nombreProducto(
  productId: string,
  productos: (Producto & { traducciones: ProductoTrad[] })[],
  locale: Locale
): string {
  const prod = productos.find((p) => p.id === productId)
  if (!prod) return '—'
  return (
    prod.traducciones?.find((t) => t.idioma_id === locale)?.nombre ??
    prod.traducciones?.[0]?.nombre ??
    '—'
  )
}

export default function KdsTarjeta({
  pedido, productos, filtro, minutosTranscurridos, locale, dict, onAvanzarItem,
}: Props) {
  const items = ((pedido.items ?? []) as PedidoItem[]).filter((i) => i.estado !== 'entregado')
  const itemsFiltrados =
    filtro === 'todos' ? items : items.filter((i) => i.estado === filtro)

  const urgente = minutosTranscurridos >= 20
  const esNueva  = minutosTranscurridos < 2

  // Card color basado en item más "atrasado"
  const tieneEnPrep = items.some((i) => i.estado === 'en_preparacion')
  const todoListo   = items.length > 0 && items.every((i) => i.estado === 'listo')

  const cardBorderTop = urgente
    ? 'border-t-4 border-t-red-400'
    : tieneEnPrep
    ? 'border-t-4 border-t-amber-400'
    : todoListo
    ? 'border-t-4 border-t-emerald-400'
    : 'border-t-4 border-t-gray-200'

  if (itemsFiltrados.length === 0) return null

  return (
    <div
      className={[
        'bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col',
        cardBorderTop,
        urgente ? 'ring-2 ring-red-200' : '',
      ].join(' ')}
    >
      {/* Header tarjeta */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-gray-900 leading-none">
            {pedido.mesa?.numero ?? '—'}
          </span>
          {pedido.mesa?.zona && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
              {pedido.mesa.zona}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {esNueva && (
            <span className="text-xs font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full animate-pulse">
              {dict.nueva}
            </span>
          )}
          {urgente && (
            <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
              {dict.urgente}
            </span>
          )}
          <span
            className={[
              'text-sm font-semibold tabular-nums',
              urgente ? 'text-red-600' : minutosTranscurridos >= 10 ? 'text-amber-600' : 'text-gray-400',
            ].join(' ')}
          >
            {minutosTranscurridos}{dict.minutos}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 p-3 space-y-2">
        {itemsFiltrados.map((item: PedidoItem) => {
          const st = itemEstadoStyles[item.estado] ?? itemEstadoStyles.pendiente
          const puedeAvanzar = item.estado !== 'entregado'
          const btnLabel = item.estado === 'pendiente'
            ? dict.marcar_preparacion
            : item.estado === 'en_preparacion'
            ? dict.marcar_listo
            : dict.marcar_entregado

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-xl border ${st.bg} ${st.border} transition-colors`}
            >
              {/* Cantidad badge */}
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${st.badge} ${st.badgeTxt}`}
              >
                {item.cantidad}
              </span>

              {/* Nombre + notas */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {nombreProducto(item.producto_id, productos, locale)}
                </p>
                {item.notas && (
                  <div className="flex items-start gap-1 mt-1">
                    <StickyNote className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <p className="text-xs text-amber-700 leading-tight">{item.notas}</p>
                  </div>
                )}
              </div>

              {/* Botón avanzar */}
              {puedeAvanzar && (
                <button
                  onClick={() => onAvanzarItem(item.id, item.estado)}
                  className={[
                    'flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold',
                    'transition-all active:scale-95',
                    item.estado === 'pendiente'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : item.estado === 'en_preparacion'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                  ].join(' ')}
                >
                  {btnLabel}
                  <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer — items restantes */}
      {items.length > itemsFiltrados.length && (
        <div className="px-4 py-2 border-t border-gray-50">
          <p className="text-xs text-gray-400">
            +{items.length - itemsFiltrados.length} {dict.items_pendientes}
          </p>
        </div>
      )}
    </div>
  )
}
