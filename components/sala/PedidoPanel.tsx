'use client'

import { useState } from 'react'
import {
  X, Plus, Minus, ShoppingBag, Banknote, CreditCard, MoreHorizontal,
  ChefHat, CheckCircle2, Clock, Truck, Printer,
} from 'lucide-react'
import type { Mesa, Pedido, PedidoItem, Producto, ProductoTrad, Locale } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface Categoria {
  id: string; slug: string; orden: number
  traducciones: { idioma_id: string; nombre: string }[]
}

interface Props {
  mesa: Mesa
  pedido: Pedido | null
  productos: (Producto & { traducciones: ProductoTrad[] })[]
  categorias: Categoria[]
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

const CAT_EMOJI: Record<string, string> = {
  antipasti: '🫒', primi: '🍝', secondi: '🥩',
  contorni: '🥗', dolci: '🍮', bevande: '🍷',
}

export default function PedidoPanel({ mesa, pedido, productos, categorias, locale, dict, onClose, onUpdated }: Props) {
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

  const [catActiva, setCatActiva] = useState<string | null>(null)
  const [cerrando, setCerrando] = useState(false)
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'otros'>('efectivo')
  const [loading, setLoading] = useState(false)
  const [notaEditando, setNotaEditando] = useState<string | null>(null)
  const [notaTexto, setNotaTexto] = useState('')

  const supabase = createClient()

  const productosPorCategoria = catActiva
    ? productos.filter(p => p.categoria_id === catActiva)
    : []

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
        await supabase.from('pedido_items').update({ cantidad: existente.cantidad + 1 }).eq('id', existente.id)
      } else {
        await supabase.from('pedido_items').insert({
          pedido_id: pedidoId, producto_id: producto.id,
          cantidad: 1, precio_unitario: producto.precio, estado: 'pendiente',
        })
      }
      onUpdated()
    } finally {
      setLoading(false)
    }
  }

  async function cambiarCantidad(item: PedidoItem, delta: number) {
    if (item.cantidad + delta <= 0) {
      await supabase.from('pedido_items').delete().eq('id', item.id)
    } else {
      await supabase.from('pedido_items').update({ cantidad: item.cantidad + delta }).eq('id', item.id)
    }
    onUpdated()
  }

  async function guardarNota(item: PedidoItem) {
    await supabase.from('pedido_items').update({ notas: notaTexto.trim() || null }).eq('id', item.id)
    setNotaEditando(null)
    onUpdated()
  }

  async function cerrarCuenta() {
    if (!pedido) return
    setLoading(true)
    await supabase.from('pedidos').update({ estado: 'pagado', metodo_pago: metodoPago }).eq('id', pedido.id)
    setLoading(false)
    setCerrando(false)
    onUpdated()
    onClose()
  }

  function imprimirCuenta() {
    const lineas = items.map((item: PedidoItem) => {
      const prod = productos.find((p) => p.id === item.producto_id)
      const nombre = prod ? nombreProducto(prod) : '—'
      return `${item.cantidad}x  ${nombre.padEnd(22)}  CHF ${(item.cantidad * item.precio_unitario).toFixed(2)}`
    }).join('\n')

    const ahora = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const receipt = `
      <html><head><style>
        body { font-family: monospace; font-size: 13px; width: 300px; margin: 0 auto; padding: 16px; }
        h2 { text-align: center; margin: 0 0 4px; font-size: 16px; }
        p { text-align: center; color: #666; margin: 0 0 12px; font-size: 11px; }
        hr { border: none; border-top: 1px dashed #aaa; margin: 10px 0; }
        pre { white-space: pre-wrap; margin: 0; }
        .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 8px; }
        .footer { text-align: center; font-size: 10px; color: #999; margin-top: 12px; }
      </style></head><body>
        <h2>Lugano Smart Rest</h2>
        <p>Lugano, Svizzera · ${ahora}</p>
        <p>Tavolo ${mesa.numero}</p>
        <hr>
        <pre>${lineas}</pre>
        <hr>
        <div class="total">TOTALE: CHF ${total.toFixed(2)}</div>
        <div class="footer">Grazie per la visita!</div>
      </body></html>
    `
    const w = window.open('', '_blank', 'width=360,height=500')
    if (w) { w.document.write(receipt); w.document.close(); w.print() }
  }

  const items: PedidoItem[] = (pedido?.items as PedidoItem[]) ?? []
  const total = items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 w-80 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">{tp.tavolo}</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{mesa.numero}</h2>
        </div>
        <div className="flex items-center gap-1">
          {items.length > 0 && (
            <button
              onClick={imprimirCuenta}
              title="Stampa conto"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Printer className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Tabs de categorías */}
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-1 px-3 py-2 overflow-x-auto scrollbar-none">
          {categorias.map(cat => {
            const nombre = cat.traducciones.find(t => t.idioma_id === locale)?.nombre
              ?? cat.traducciones.find(t => t.idioma_id === 'it')?.nombre
              ?? cat.slug
            const emoji = CAT_EMOJI[cat.slug] ?? '🍴'
            const activa = catActiva === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setCatActiva(activa ? null : cat.id)}
                className={[
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0',
                  activa
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                ].join(' ')}
              >
                <span>{emoji}</span> {nombre}
              </button>
            )
          })}
        </div>

        {/* Productos de la categoría seleccionada */}
        {catActiva && (
          <div className="mx-3 mb-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
            {productosPorCategoria.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-400">Nessun piatto disponibile</p>
            ) : (
              productosPorCategoria.map(p => (
                <button
                  key={p.id}
                  onClick={() => agregarItem(p)}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm
                             hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left border-b border-gray-50 dark:border-gray-700 last:border-0"
                >
                  <span className="text-gray-800 dark:text-gray-200 font-medium text-xs leading-tight">{nombreProducto(p)}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs ml-2 flex-shrink-0 font-mono">
                    {p.precio.toFixed(2)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Items del pedido */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 gap-3">
            <ShoppingBag className="w-8 h-8 text-gray-200 dark:text-gray-700" strokeWidth={1} />
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">{tp.sin_pedido}</p>
            <p className="text-xs text-gray-300 dark:text-gray-600">{tp.sin_pedido_desc}</p>
          </div>
        ) : (
          items.map((item: PedidoItem) => {
            const prod = productos.find((p) => p.id === item.producto_id)
            const nombre = prod ? nombreProducto(prod) : '—'
            const EstadoIcon = itemEstadoIcon[item.estado] ?? Clock
            const colorClass = itemEstadoColor[item.estado] ?? 'text-gray-400'

            return (
              <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group">
                <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{nombre}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <EstadoIcon className={`w-3 h-3 ${colorClass}`} strokeWidth={2} />
                    <span className="text-xs text-gray-400 dark:text-gray-500">{estadoItemLabels[item.estado]}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => cambiarCantidad(item, -1)}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center
                               text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <Minus className="w-3 h-3" strokeWidth={2} />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold text-gray-900 dark:text-white">{item.cantidad}</span>
                  <button
                    onClick={() => cambiarCantidad(item, 1)}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center
                               text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" strokeWidth={2} />
                  </button>
                </div>

                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16 text-right tabular-nums">
                  CHF {(item.cantidad * item.precio_unitario).toFixed(2)}
                </span>
                </div>
                {/* Nota inline */}
                {notaEditando === item.id ? (
                  <div className="mt-2 flex gap-1.5">
                    <input
                      autoFocus
                      type="text"
                      value={notaTexto}
                      onChange={(e) => setNotaTexto(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') guardarNota(item); if (e.key === 'Escape') setNotaEditando(null) }}
                      placeholder="es. senza glutine..."
                      className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                                 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                    <button onClick={() => guardarNota(item)} className="px-2 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg">✓</button>
                    <button onClick={() => setNotaEditando(null)} className="px-2 py-1 text-gray-400 text-xs rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setNotaEditando(item.id); setNotaTexto((item as PedidoItem & { notas?: string }).notas ?? '') }}
                    className="mt-1.5 text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors text-left w-full"
                  >
                    {(item as PedidoItem & { notas?: string }).notas
                      ? <span className="text-amber-500 dark:text-amber-400">📝 {(item as PedidoItem & { notas?: string }).notas}</span>
                      : <span className="opacity-0 group-hover:opacity-100 transition-opacity">+ nota</span>
                    }
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="px-4 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-gray-500 dark:text-gray-400">{tp.total}</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
              CHF {total.toFixed(2)}
            </span>
          </div>

          {!cerrando ? (
            <button
              onClick={() => setCerrando(true)}
              className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl
                         hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              {tp.cerrar_cuenta}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
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
                        ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600',
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
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium
                             text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
