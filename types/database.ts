export type Locale = 'it' | 'en' | 'es'
export type StockEstado = 'ok' | 'bajo' | 'critico' | 'agotado'
export type PedidoEstado = 'abierto' | 'en_preparacion' | 'listo' | 'entregado' | 'pagado' | 'cancelado'
export type MetodoPago = 'efectivo' | 'tarjeta' | 'otros'
export type MesaEstado = 'libre' | 'ocupada' | 'reservada'
export type MovimientoTipo = 'entrada' | 'salida' | 'ajuste'
export type Unidad = 'kg' | 'g' | 'l' | 'ml' | 'unidad' | 'porciones'

export interface Ingrediente {
  id: string
  nombre: string
  unidad: Unidad
  stock_actual: number
  stock_minimo: number
  costo_unidad: number
  proveedor: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface IngredienteConEstado extends Ingrediente {
  estado_stock: StockEstado
}

export interface Categoria {
  id: string
  slug: string
  orden: number
  activo: boolean
  traducciones?: CategoriaTrad[]
}

export interface CategoriaTrad {
  idioma_id: Locale
  nombre: string
}

export interface Producto {
  id: string
  categoria_id: string | null
  precio: number
  disponible: boolean
  imagen_url: string | null
  activo: boolean
  traducciones?: ProductoTrad[]
  ingredientes?: ProductoIngrediente[]
  alergenos?: string[]
}

export interface ProductoTrad {
  idioma_id: Locale
  nombre: string
  descripcion: string | null
}

export interface ProductoIngrediente {
  ingrediente_id: string
  cantidad: number
  ingrediente?: Ingrediente
}

export interface Mesa {
  id: string
  numero: number
  capacidad: number
  estado: MesaEstado
  zona: string
  posicion_x: number | null
  posicion_y: number | null
  activo: boolean
}

export interface Pedido {
  id: string
  mesa_id: string | null
  estado: PedidoEstado
  metodo_pago: MetodoPago | null
  subtotal: number
  total: number
  notas: string | null
  created_at: string
  updated_at: string
  items?: PedidoItem[]
  mesa?: Mesa
}

export interface PedidoItem {
  id: string
  pedido_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  estado: 'pendiente' | 'en_preparacion' | 'listo' | 'entregado'
  notas: string | null
  created_at: string
  producto?: Producto
}

export interface MovimientoStock {
  id: string
  ingrediente_id: string
  tipo: MovimientoTipo
  cantidad: number
  stock_previo: number | null
  stock_nuevo: number | null
  motivo: string | null
  pedido_item_id: string | null
  notas: string | null
  usuario: string | null
  created_at: string
}

export interface MovimientoCaja {
  id: string
  pedido_id: string | null
  tipo: 'ingreso' | 'egreso'
  metodo: MetodoPago
  monto: number
  concepto: string | null
  usuario: string | null
  created_at: string
}

// Supabase Database type map
export interface Database {
  public: {
    Tables: {
      ingredientes: { Row: Ingrediente; Insert: Omit<Ingrediente, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Ingrediente, 'id'>> }
      productos: { Row: Producto; Insert: Omit<Producto, 'id'>; Update: Partial<Omit<Producto, 'id'>> }
      mesas: { Row: Mesa; Insert: Omit<Mesa, 'id'>; Update: Partial<Omit<Mesa, 'id'>> }
      pedidos: { Row: Pedido; Insert: Omit<Pedido, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Pedido, 'id'>> }
      pedido_items: { Row: PedidoItem; Insert: Omit<PedidoItem, 'id' | 'created_at'>; Update: Partial<Omit<PedidoItem, 'id'>> }
      movimientos_stock: { Row: MovimientoStock; Insert: Omit<MovimientoStock, 'id' | 'created_at'>; Update: never }
      movimientos_caja: { Row: MovimientoCaja; Insert: Omit<MovimientoCaja, 'id' | 'created_at'>; Update: never }
    }
    Views: {
      v_stock_estado: { Row: IngredienteConEstado }
    }
  }
}
