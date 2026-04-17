'use client'

import { useState } from 'react'
import { Receipt, CreditCard, Banknote, MoreHorizontal, Users, Calendar } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'

interface Item { id: string; cantidad: number; precio_unitario: number; producto_id: string }
interface Pedido {
  id: string
  mesa_id: string | null
  estado: string
  total: number | null
  metodo_pago: string | null
  num_comensales: number | null
  created_at: string
  items: Item[]
}

interface Props {
  pedidosIniciales: Pedido[]
  dict: Record<string, unknown>
  locale: Locale
}

const metodoPagoIcon: Record<string, React.ElementType> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  otros: MoreHorizontal,
}

const metodoPagoColor: Record<string, string> = {
  efectivo: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
  tarjeta:  'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  otros:    'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',
}

export default function HistorialView({ pedidosIniciales }: Props) {
  const [pedidos] = useState<Pedido[]>(pedidosIniciales)
  const [filtroDia, setFiltroDia] = useState<'hoy' | 'semana' | 'mes' | 'todo'>('hoy')

  const ahora = new Date()
  const filtrados = pedidos.filter((p) => {
    const fecha = new Date(p.created_at)
    if (filtroDia === 'hoy') {
      return fecha.toDateString() === ahora.toDateString()
    }
    if (filtroDia === 'semana') {
      const lunes = new Date(ahora); lunes.setDate(ahora.getDate() - ahora.getDay() + 1); lunes.setHours(0,0,0,0)
      return fecha >= lunes
    }
    if (filtroDia === 'mes') {
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear()
    }
    return true
  })

  const totalPeriodo = filtrados.reduce((s, p) => s + (p.total ?? p.items.reduce((ss, i) => ss + i.cantidad * i.precio_unitario, 0)), 0)
  const ticketMedio = filtrados.length > 0 ? totalPeriodo / filtrados.length : 0

  const periodos = [
    { key: 'hoy',    label: 'Oggi' },
    { key: 'semana', label: 'Settimana' },
    { key: 'mes',    label: 'Mese' },
    { key: 'todo',   label: 'Tutto' },
  ] as const

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Storico Ordini</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ordini chiusi e pagati</p>
        </div>
        {/* Filtro período */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-0.5">
          {periodos.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltroDia(key)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filtroDia === key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Ordini', value: filtrados.length.toString(), icon: Receipt, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Totale', value: `CHF ${totalPeriodo.toFixed(2)}`, icon: Banknote, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Ticket medio', value: `CHF ${ticketMedio.toFixed(2)}`, icon: Users, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className={`text-base font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Receipt className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" strokeWidth={1} />
            <p className="text-sm text-gray-400 dark:text-gray-500">Nessun ordine nel periodo selezionato</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {/* Cabecera */}
            <div className="grid grid-cols-5 px-5 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              <span>Data / Ora</span>
              <span>Tavolo</span>
              <span>Metodo</span>
              <span>Coperti</span>
              <span className="text-right">Totale</span>
            </div>
            {filtrados.map((p) => {
              const totale = p.total ?? p.items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)
              const MetIcon = metodoPagoIcon[p.metodo_pago ?? 'otros'] ?? MoreHorizontal
              const metColor = metodoPagoColor[p.metodo_pago ?? 'otros']
              return (
                <div key={p.id} className="grid grid-cols-5 px-5 py-3.5 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(p.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" strokeWidth={1.5} />
                      {new Date(p.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{p.mesa_id ? `#${p.mesa_id.slice(-4)}` : '—'}</span>
                  <div>
                    {p.metodo_pago ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${metColor}`}>
                        <MetIcon className="w-3 h-3" strokeWidth={1.5} />
                        {p.metodo_pago}
                      </span>
                    ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {p.num_comensales ?? '—'}
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white text-right tabular-nums">
                    CHF {totale.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
