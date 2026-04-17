'use client'

import { Users } from 'lucide-react'
import type { Mesa, MesaEstado } from '@/types/database'

interface Props {
  mesa: Mesa
  activa: boolean
  tieneOrden: boolean
  numItems: number
  editMode: boolean
  onClick: () => void
  onDragStart: (e: React.MouseEvent) => void
  dict: Record<string, string>
}

const estadoStyles: Record<MesaEstado, { ring: string; bg: string; dot: string; label: string }> = {
  libre:    { ring: 'ring-emerald-200', bg: 'bg-white',         dot: 'bg-emerald-400', label: 'libre' },
  ocupada:  { ring: 'ring-amber-300',   bg: 'bg-amber-50',      dot: 'bg-amber-400',   label: 'ocupada' },
  reservada:{ ring: 'ring-blue-200',    bg: 'bg-blue-50',       dot: 'bg-blue-400',    label: 'reservada' },
}

export default function MesaNode({
  mesa, activa, tieneOrden, numItems, editMode, onClick, onDragStart, dict,
}: Props) {
  const st = estadoStyles[mesa.estado]

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={editMode ? onDragStart : undefined}
      onClick={!editMode ? onClick : undefined}
      onKeyDown={(e) => e.key === 'Enter' && !editMode && onClick()}
      style={{
        left:  `${mesa.posicion_x ?? 10}%`,
        top:   `${mesa.posicion_y ?? 10}%`,
        transform: 'translate(-50%, -50%)',
      }}
      className={[
        'absolute w-20 h-20 rounded-2xl ring-2 flex flex-col items-center justify-center gap-0.5',
        'shadow-sm transition-all duration-150 select-none',
        st.ring, st.bg,
        activa ? 'ring-4 shadow-md scale-105' : '',
        editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer hover:scale-105 hover:shadow-md',
      ].join(' ')}
    >
      {/* Status dot */}
      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${st.dot}`} />

      {/* Table number */}
      <span className="text-2xl font-bold text-gray-900 leading-none">{mesa.numero}</span>

      {/* Capacity */}
      <div className="flex items-center gap-0.5 text-gray-400">
        <Users className="w-3 h-3" strokeWidth={1.5} />
        <span className="text-xs">{mesa.capacidad}</span>
      </div>

      {/* Order badge */}
      {tieneOrden && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded-full leading-none">
          {numItems}
        </span>
      )}
    </div>
  )
}
