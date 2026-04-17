'use client'

import { useState } from 'react'
import {
  X, Plus, Minus, ShoppingBag, Banknote, CreditCard, MoreHorizontal,
  ChefHat, CheckCircle2, Clock, Truck,
} from 'lucide-react'
import type { Mesa, Pedido, PedidoItem, Producto, ProductoTrad, Locale } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface Props {
  mesa: Mesa
  pedido: Pedido | null
  productos: (Producto & { traducciones: ProductoTrad[] })[]
  locale: Locale
  dict: Record<string, Record<string, string | Record<string, string>>>
  onClose: () => void
  onUpdated: () => void
}

const itemEstadoIcon: Record<string, React.ElementType> = {
  pendiente:      Clock,
  en_preparacion: ChefHat,
  listo:          CheckCircle2,
  entregado:      Truck,
}
const itemEstadoColor: Record<string, string> = {
  pendiente:      'text-gray-400',
  en_preparacion: 'text-amber-500',
  listo:          'text-emerald-500',
  entregado:      'text-blue-400',
}

export default function PedidoPanel({ mesa, pedido, productos, locale, dict, onClose, onUpdated }: Props) {
  // Extraemos todos los strings del dict arriba para evitar casteos en JSX
  const salaRaw = dict.sala as Record<string, unknown>
  const pedidoRaw = (salaRaw.pedido ?? {}) as Record<string, unknown>
  const estadoItemLabels = (pedidoRaw.estado_item ?? {}) as Record<string, string>
  const tp = {
    tavolo:           String(salaRaw.tavolo           ?? ''),
    agregar_producto: String(pedidoRaw.agregar_producto ?? ''),
    sin_pedido:       String(pedidoRaw.sin_pedido       ?? ''),
    sin_pedido_desc:  String(pedidoRaw.sin_pedido_desc  ?? ''),
    total:            String(pedidoRaw.total            ?? ''),
    cerrar_cuenta:    String(pedidoRaw.cerrar_cuenta    ?? ''),
    metodo_pago:      String(pedidoRaw.metodo_pago      ?? ''),
    efectivo:         String(pedidoRaw.efectivo         ?? ''),
    tarjeta:          String(pedidoRaw.tarjeta          ?? ''),
    otros:            String(pedidoRaw.otros            ?? ''),
    confirmar_cierre: String(pedidoRaw.confirmar_cierre ?? ''),
  }
  const tc = dict.comun as Record<string, string>

  const [buscador, setBuscador] = useState('')
  const [cerrando, setCerrando] = useState(false)
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'otros'>('efectivo')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const productosFiltrados = productos.filter((p) => {
    const trad = p.traducciones?.find((t) => t.idioma_id === locale)
      ?? p.traducciones?.[0]
    return trad?.nombre.toLowerCase().includes(buscador.toLowerCase())
  })

  function nombreProducto(p: Producto & { traducciones: ProductoTrad[] }) {
    return (
      p.traducciones?.find((t) => t.idioma_id === locale)?.nombre ??
      p.traducciones?.[0]?.nombre ??
      '—'
    )
  }

  async function crearPedidoSiNoExiste(): Promise<string> {
    if (pedido) return pedido.id
    const { data, error } = await supabase
      .from('pedidos')
      .insert({ mesa_id: mesa.id, estado: 'abierto' })
      .select('id')
      .single()
    if (error) throw error
    return data.id
  }

  async function agregarItem(producto: Producto & { traducciones: ProductoTrad[] }) {
    setLoading(true)
    try {
      const pedidoId = await crearPedidoSiNoExiste()
      const existente = pedido?.items?.find((i: PedidoItem) => i.producto_id === producto.id && i.estado === 'pendiente')

      if (existente) {
        await supabase
          .from('pedido_items')
          .update({ cantidad: existente.cantidad + 1 })
          .eq('id', existente.id)
      } else {
        await supabase.from('pedido_items').insert({
          pedido_id:       pedidoId,
          producto_id:     producto.id,
          cantidad:        1,
          precio_unitario: producto.precio,
          estado:          'pendiente',
        })
      }
      onUpdated()
    } finally {
      setLoading(false)
    }
  }

  async function cambiarCantidad(item: PedidoItem, delta: number) {
    const nueva = item.cantidad + delta
    if (nueva <= 0) {
      await supabase.from('pedido_items').delete().eq('id', item.id)
    } else {
      await supabase.from('pedido_items').update({ cantidad: nueva }).eq('id', item.id)
    }
    onUpdated()
  }

  async function cerrarCuenta() {
    if (!pedido) return
    setLoading(true)
    await supabase
      .from('pedidos')
      .update({ estado: 'pagado', metodo_pago: metodoPago })
      .eq('id', pedido.id)
    setLoading(false)
    setCerrando(false)
    onUpdated()
    onClose()
  }

  const items: PedidoItem[] = (pedido?.items as PedidoItem[]) ?? []
  const total = items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100 w-80 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">{tp.tavolo}</p>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">{mesa.numero}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Buscador de productos */}
      <div className="px-4 py-3 border-b border-gray-50">
        <input
          type="text"
          value={buscador}
          onChange={(e) => setBuscador(e.target.value)}
          placeholder={tp.agregar_producto}
          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl
                     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10
                     focus:border-gray-300 transition-all"
        />
      </div>

      {/* Lista productos (visible solo si hay búsqueda) */}
      {buscador && (
        <div className="mx-4 mb-2 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-10 max-h-52 overflow-y-auto">
          {productosFiltrados.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">{tc.sin_datos}</p>
          ) : (
            productosFiltrados.map((p) => (
              <button
                key={p.id}
                onClick={() => { agregarItem(p); setBuscador('') }}
                className="flex items-center justify-between w-full px-4 py-2.5 text-sm
                           hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-gray-800 font-medium">{nombreProducto(p)}</span>
                <span className="text-gray-500 text-xs ml-2 flex-shrink-0">
                  CHF {p.precio.toFixed(2)}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Items del pedido */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 gap-3">
            <ShoppingBag className="w-8 h-8 text-gray-200" strokeWidth={1} />
            <p className="text-sm font-medium text-gray-400">{tp.sin_pedido}</p>
            <p className="text-xs text-gray-300">{tp.sin_pedido_desc}</p>
          </div>
        ) : (
          items.map((item: PedidoItem) => {
            const prod = productos.find((p) => p.id === item.producto_id)
            const nombre = prod ? nombreProducto(prod) : '—'
            const EstadoIcon = itemEstadoIcon[item.estado] ?? Clock
            const colorClass = itemEstadoColor[item.estado] ?? 'text-gray-400'

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{nombre}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <EstadoIcon className={`w-3 h-3 ${colorClass}`} strokeWidth={2} />
                    <span className="text-xs text-gray-400">
                      {estadoItemLabels[item.estado]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => cambiarCantidad(item, -1)}
                    className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center
                               text-gray-500 hover:border-gray-300 hover:text-gray-900 transition-colors"
                  >
                    <Minus className="w-3 h-3" strokeWidth={2} />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold text-gray-900">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => cambiarCantidad(item, 1)}
                    className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center
                               text-gray-500 hover:border-gray-300 hover:text-gray-900 transition-colors"
                  >
                    <Plus className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>

                <span className="text-sm font-medium text-gray-700 w-16 text-right tabular-nums">
                  CHF {(item.cantidad * item.precio_unitario).toFixed(2)}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Footer — total y cierre */}
      {items.length > 0 && (
        <div className="px-4 pb-5 pt-3 border-t border-gray-100 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-500">{tp.total}</span>
            <span className="text-xl font-bold text-gray-900 tabular-nums">
              CHF {total.toFixed(2)}
            </span>
          </div>

          {!cerrando ? (
            <button
              onClick={() => setCerrando(true)}
              className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-xl
                         hover:bg-gray-800 transition-colors"
            >
              {tp.cerrar_cuenta}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tp.metodo_pago}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: 'efectivo', label: tp.efectivo, icon: Banknote },
                    { value: 'tarjeta',  label: tp.tarjeta,  icon: CreditCard },
                    { value: 'otros',    label: tp.otros,    icon: MoreHorizontal },
                  ] as const
                ).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setMetodoPago(value)}
                    className={[
                      'flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors',
                      metodoPago === value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCerrando(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium
                             text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {tc.cancelar}
                </button>
                <button
                  onClick={cerrarCuenta}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-600 rounded-xl text-sm font-medium text-white
                             hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? '...' : tp.confirmar_cierre}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
