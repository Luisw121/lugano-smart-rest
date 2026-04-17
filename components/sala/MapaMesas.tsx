'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { LayoutGrid, Lock, Unlock, Plus } from 'lucide-react'
import type { Mesa, Pedido, Producto, ProductoTrad, Locale } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import MesaNode from './MesaNode'
import PedidoPanel from './PedidoPanel'

interface Props {
  mesasIniciales: Mesa[]
  pedidosIniciales: Pedido[]
  productos: (Producto & { traducciones: ProductoTrad[] })[]
  dict: Record<string, Record<string, string | Record<string, string>>>
  locale: Locale
}

export default function MapaMesas({
  mesasIniciales,
  pedidosIniciales,
  productos,
  dict,
  locale,
}: Props) {
  const t = dict.sala as Record<string, string | Record<string, string>>

  const [mesas, setMesas] = useState<Mesa[]>(mesasIniciales)
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales)
  const [mesaActiva, setMesaActiva] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [comensalesDialog, setComensalesDialog] = useState<{ mesaId: string; numero: number } | null>(null)
  const [comensalesNum, setComensalesNum] = useState(2)

  // Drag state
  const dragging = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  // ── Supabase Realtime ──────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('sala-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mesas' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setMesas((prev) =>
              prev.map((m) => (m.id === payload.new.id ? (payload.new as Mesa) : m))
            )
          }
          if (payload.eventType === 'INSERT') {
            setMesas((prev) => [...prev, payload.new as Mesa])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => refreshPedidos()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedido_items' },
        () => refreshPedidos()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function refreshPedidos() {
    const { data } = await supabase
      .from('pedidos')
      .select('*, items:pedido_items(*)')
      .not('estado', 'in', '("pagado","cancelado")')
    if (data) setPedidos(data as Pedido[])
  }

  // ── Drag & Drop ────────────────────────────────────────────
  function startDrag(e: React.MouseEvent, mesa: Mesa) {
    e.preventDefault()
    dragging.current = {
      id:     mesa.id,
      startX: e.clientX,
      startY: e.clientY,
      origX:  mesa.posicion_x ?? 10,
      origY:  mesa.posicion_y ?? 10,
    }
  }

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const dx = ((e.clientX - dragging.current.startX) / rect.width) * 100
      const dy = ((e.clientY - dragging.current.startY) / rect.height) * 100
      const nx = Math.min(95, Math.max(5, dragging.current.origX + dx))
      const ny = Math.min(95, Math.max(5, dragging.current.origY + dy))

      setMesas((prev) =>
        prev.map((m) =>
          m.id === dragging.current!.id
            ? { ...m, posicion_x: nx, posicion_y: ny }
            : m
        )
      )
    },
    []
  )

  const onMouseUp = useCallback(async () => {
    if (!dragging.current) return
    const id = dragging.current.id
    const mesa = mesas.find((m) => m.id === id)
    dragging.current = null
    if (mesa) {
      await supabase
        .from('mesas')
        .update({ posicion_x: mesa.posicion_x, posicion_y: mesa.posicion_y })
        .eq('id', id)
    }
  }, [mesas, supabase])

  useEffect(() => {
    if (!editMode) return
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [editMode, onMouseMove, onMouseUp])

  // ── Agregar nueva mesa ─────────────────────────────────────
  async function agregarMesa() {
    const siguiente = Math.max(0, ...mesas.map((m) => m.numero)) + 1
    await supabase.from('mesas').insert({
      numero:     siguiente,
      capacidad:  4,
      estado:     'libre',
      zona:       'sala',
      posicion_x: 50,
      posicion_y: 50,
      activo:     true,
    })
  }

  // ── Helpers ────────────────────────────────────────────────
  function getPedidoDeMesa(mesaId: string): Pedido | null {
    return pedidos.find((p) => p.mesa_id === mesaId) ?? null
  }

  function handleMesaClick(mesa: Mesa) {
    if (editMode) return
    // If libre and no active order → ask for comensales first
    if (mesa.estado === 'libre' && !getPedidoDeMesa(mesa.id)) {
      setComensalesNum(2)
      setComensalesDialog({ mesaId: mesa.id, numero: mesa.numero })
    } else {
      setMesaActiva(mesa.id === mesaActiva ? null : mesa.id)
    }
  }

  async function confirmarComensales() {
    if (!comensalesDialog) return
    // Mark table as occupied
    await supabase.from('mesas').update({ estado: 'ocupada' }).eq('id', comensalesDialog.mesaId)
    // Create pedido with num_comensales
    await supabase.from('pedidos').insert({ mesa_id: comensalesDialog.mesaId, estado: 'abierto', num_comensales: comensalesNum })
    setComensalesDialog(null)
    setMesaActiva(comensalesDialog.mesaId)
    await refreshPedidos()
  }

  const mesaActivaData = mesas.find((m) => m.id === mesaActiva) ?? null
  const pedidoActivo = mesaActiva ? getPedidoDeMesa(mesaActiva) : null

  // Leyenda de zonas en uso
  const zonasActivas = [...new Set(mesas.map((m) => m.zona))].sort()

  return (
    <div className="flex h-full">
      {/* Canvas principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t.titolo as string}
            </h1>
            <div className="flex items-center gap-3 ml-4">
              {[
                { key: 'libre',    dot: 'bg-emerald-400' },
                { key: 'ocupada',  dot: 'bg-amber-400' },
                { key: 'reservada',dot: 'bg-blue-400' },
              ].map(({ key, dot }) => (
                <span key={key} className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  {(t.estado as Record<string, string>)[key]}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editMode && (
              <button
                onClick={agregarMesa}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs
                           font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                {t.agregar_mesa as string}
              </button>
            )}
            <button
              onClick={() => setEditMode((v) => !v)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                editMode
                  ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              {editMode
                ? <><Unlock className="w-3.5 h-3.5" strokeWidth={1.5} />{t.modo_edicion as string}</>
                : <><Lock className="w-3.5 h-3.5" strokeWidth={1.5} />{t.modo_normal as string}</>
              }
            </button>
          </div>
        </div>

        {/* Mapa */}
        <div
          ref={canvasRef}
          className="relative flex-1 m-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        >
          {mesas.map((mesa) => {
            const pedidoMesa = getPedidoDeMesa(mesa.id)
            const numItems = (pedidoMesa?.items as unknown[])?.length ?? 0
            return (
              <MesaNode
                key={mesa.id}
                mesa={mesa}
                activa={mesaActiva === mesa.id}
                tieneOrden={!!pedidoMesa}
                numItems={numItems}
                editMode={editMode}
                dict={(t.estado as Record<string, string>)}
                onClick={() => handleMesaClick(mesa)}
                onDragStart={(e) => startDrag(e, mesa)}
              />
            )
          })}

          {mesas.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <LayoutGrid className="w-10 h-10 text-gray-200 dark:text-gray-700" strokeWidth={1} />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Abilita la modalità modifica per aggiungere tavoli
              </p>
            </div>
          )}
        </div>

        {/* Zona labels */}
        <div className="px-5 pb-3 flex items-center gap-3">
          {zonasActivas.map((zona) => (
            <span key={zona} className="text-xs text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-2 py-1 rounded-lg">
              {(t.zonas as Record<string, string>)[zona] ?? zona}
              {' · '}
              {mesas.filter((m) => m.zona === zona).length} tavoli
            </span>
          ))}
        </div>
      </div>

      {/* Panel lateral */}
      {mesaActivaData && (
        <PedidoPanel
          mesa={mesaActivaData}
          pedido={pedidoActivo}
          productos={productos}
          locale={locale}
          dict={dict}
          onClose={() => setMesaActiva(null)}
          onUpdated={refreshPedidos}
        />
      )}

      {/* Dialog comensales */}
      {comensalesDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xs p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              {(t.tavolo as string)} {comensalesDialog.numero}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {(t.capacidad as string)}
            </p>
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={() => setComensalesNum((n) => Math.max(1, n - 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xl font-bold
                           hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >−</button>
              <span className="text-3xl font-bold text-gray-900 dark:text-white w-12 text-center tabular-nums">
                {comensalesNum}
              </span>
              <button
                onClick={() => setComensalesNum((n) => Math.min(20, n + 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xl font-bold
                           hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >+</button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setComensalesDialog(null)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {(dict.comun as Record<string, string>).cancelar}
              </button>
              <button
                onClick={confirmarComensales}
                className="flex-1 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-semibold
                           hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                {(dict.comun as Record<string, string>).confirmar}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
