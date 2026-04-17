'use client'

import { useEffect, useState, useTransition } from 'react'
import { Plus, Banknote, CreditCard, MoreHorizontal, TrendingUp, TrendingDown, Scale, Download, Printer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Locale } from '@/types/database'

interface Movimiento {
  id: string
  tipo: 'ingreso' | 'egreso'
  metodo: 'efectivo' | 'tarjeta' | 'otros'
  monto: number
  concepto: string | null
  usuario: string | null
  created_at: string
  pedido_id: string | null
}

interface PedidoResumen { total: number; metodo_pago: string | null }

interface Props {
  movimientosIniciales: Movimiento[]
  pedidosHoy: PedidoResumen[]
  dict: Record<string, Record<string, string | Record<string, string>>>
  locale: Locale
}

const METODOS = ['efectivo', 'tarjeta', 'otros'] as const
const metodoIcon = { efectivo: Banknote, tarjeta: CreditCard, otros: MoreHorizontal }

export default function CajaView({ movimientosIniciales, pedidosHoy, dict, locale }: Props) {
  const t  = dict.caja as Record<string, string | Record<string, string>>
  const tm = t.metodo as Record<string, string>
  const tt = t.tipo   as Record<string, string>

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [movimientos, setMovimientos] = useState<Movimiento[]>(movimientosIniciales)
  const [showForm, setShowForm] = useState(false)

  // Formulario
  const [tipo,     setTipo]     = useState<'ingreso' | 'egreso'>('ingreso')
  const [metodo,   setMetodo]   = useState<'efectivo' | 'tarjeta' | 'otros'>('efectivo')
  const [monto,    setMonto]    = useState('')
  const [concepto, setConcepto] = useState('')
  const [saving,   setSaving]   = useState(false)

  const supabase = createClient()

  // Realtime movimientos
  useEffect(() => {
    const channel = supabase
      .channel('caja-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'movimientos_caja' }, (p) => {
        setMovimientos((prev) => [p.new as Movimiento, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  // Resumen
  const entradas  = movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const salidas   = movimientos.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  const saldo     = entradas - salidas

  // Ventas por método (de pedidos pagados)
  const ventasPorMetodo = METODOS.map((met) => ({
    metodo: met,
    total: pedidosHoy.filter((p) => p.metodo_pago === met).reduce((s, p) => s + (p.total ?? 0), 0),
  }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = parseFloat(monto)
    if (!v || v <= 0) return
    setSaving(true)
    await supabase.from('movimientos_caja').insert({
      tipo, metodo, monto: v, concepto: concepto.trim() || null,
    })
    setMonto('')
    setConcepto('')
    setSaving(false)
    setShowForm(false)
    startTransition(() => router.refresh())
  }

  function chf(n: number) {
    return `CHF ${n.toFixed(2)}`
  }

  function exportarCSV() {
    const hoy = new Date().toLocaleDateString('it-IT')
    const header = 'Ora,Tipo,Metodo,Importo,Descrizione'
    const rows = movimientos.map((m) => [
      new Date(m.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      m.tipo, m.metodo,
      m.monto.toFixed(2),
      `"${(m.concepto ?? '').replace(/"/g, '""')}"`,
    ].join(','))
    const csv = [header, ...rows, '', `Entrate,${entradas.toFixed(2)}`, `Uscite,${salidas.toFixed(2)}`, `Saldo,${saldo.toFixed(2)}`].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `cassa_${hoy.replace(/\//g,'-')}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  function stampaCierre() {
    const hoy = new Date().toLocaleString('it-IT')
    const righe = movimientos.map((m) =>
      `${new Date(m.created_at).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}  ${m.tipo.padEnd(7)}  ${m.metodo.padEnd(8)}  CHF ${m.monto.toFixed(2).padStart(8)}  ${m.concepto ?? ''}`
    ).join('\n')
    const html = `<html><head><style>
      body{font-family:monospace;font-size:12px;width:600px;margin:0 auto;padding:20px}
      h2{text-align:center;margin:0 0 4px}p{text-align:center;color:#666;font-size:11px;margin:0 0 16px}
      pre{white-space:pre-wrap;margin:0}hr{border:none;border-top:1px dashed #aaa;margin:10px 0}
      .kpi{display:flex;justify-content:space-between;margin:4px 0;font-size:13px}
      .verde{color:#059669}.rojo{color:#dc2626}.negrita{font-weight:bold}
    </style></head><body>
      <h2>Lugano Smart Rest — Chiusura Cassa</h2>
      <p>${hoy}</p><hr>
      <pre>${righe}</pre><hr>
      <div class="kpi"><span>Entrate:</span><span class="verde negrita">CHF ${entradas.toFixed(2)}</span></div>
      <div class="kpi"><span>Uscite:</span><span class="rojo negrita">CHF ${salidas.toFixed(2)}</span></div>
      <div class="kpi negrita"><span>Saldo:</span><span>CHF ${saldo.toFixed(2)}</span></div>
    </body></html>`
    const w = window.open('','_blank','width=680,height=700'); if(w){w.document.write(html);w.document.close();w.print()}
  }

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{t.titolo as string}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.sottotitolo as string}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportarCSV}
            title="Esporta CSV"
            className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium
                       rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
            CSV
          </button>
          <button
            onClick={stampaCierre}
            title="Stampa chiusura"
            className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium
                       rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Printer className="w-4 h-4" strokeWidth={1.5} />
            PDF
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium
                       rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            {t.nuevo_movimiento as string}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda — resumen + form */}
        <div className="space-y-4">
          {/* KPI cards */}
          {[
            { label: t.total_entrate as string, value: chf(entradas), icon: TrendingUp,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: t.total_uscite as string,  value: chf(salidas),  icon: TrendingDown, color: 'text-red-500',     bg: 'bg-red-50' },
            { label: t.saldo as string,         value: chf(saldo),    icon: Scale,        color: saldo >= 0 ? 'text-gray-900' : 'text-red-600', bg: 'bg-gray-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
              </div>
            </div>
          ))}

          {/* Ventas por método */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              {(dict.metricas as Record<string, string>).ventas_por_metodo}
            </h3>
            <div className="space-y-2.5">
              {ventasPorMetodo.map(({ metodo: m, total }) => {
                const Icon = metodoIcon[m]
                const max = Math.max(...ventasPorMetodo.map((x) => x.total), 1)
                return (
                  <div key={m}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                        <span className="text-sm text-gray-700">{tm[m]}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        CHF {total.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 rounded-full transition-all duration-500"
                        style={{ width: `${(total / max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Columna derecha — historial + form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Formulario */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-gray-900">{t.nuevo_movimiento as string}</h3>

              {/* Tipo */}
              <div className="grid grid-cols-2 gap-2">
                {(['ingreso', 'egreso'] as const).map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setTipo(tp)}
                    className={[
                      'py-2.5 rounded-xl text-sm font-medium border transition-colors',
                      tipo === tp
                        ? tp === 'ingreso'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-red-600 text-white border-red-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {tt[tp]}
                  </button>
                ))}
              </div>

              {/* Método */}
              <div className="grid grid-cols-3 gap-2">
                {METODOS.map((m) => {
                  const Icon = metodoIcon[m]
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodo(m)}
                      className={[
                        'flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors',
                        metodo === m
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300',
                      ].join(' ')}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                      {tm[m]}
                    </button>
                  )
                })}
              </div>

              {/* Monto */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">{t.monto as string}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">CHF</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                  />
                </div>
              </div>

              {/* Concepto */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">{t.concepto as string}</label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder={t.concepto_placeholder as string}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {(dict.comun as Record<string, string>).cancelar}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gray-900 rounded-xl text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? '...' : t.guardar as string}
                </button>
              </div>
            </form>
          )}

          {/* Historial */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">{t.historial as string}</h3>
            </div>
            {movimientos.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-400">
                {t.sin_movimientos as string}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {movimientos.map((mov) => {
                  const Icon = metodoIcon[mov.metodo]
                  const esIngreso = mov.tipo === 'ingreso'
                  return (
                    <div key={mov.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                        ${esIngreso ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        <Icon className={`w-4 h-4 ${esIngreso ? 'text-emerald-600' : 'text-red-500'}`} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {mov.concepto ?? (esIngreso ? tt.ingreso : tt.egreso)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {tm[mov.metodo]} · {new Date(mov.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${esIngreso ? 'text-emerald-600' : 'text-red-500'}`}>
                        {esIngreso ? '+' : '-'} CHF {mov.monto.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
