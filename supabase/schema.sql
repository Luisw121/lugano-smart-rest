-- ============================================================
-- LUGANO SMART REST — Supabase Schema
-- Stack: PostgreSQL via Supabase | Moneda: CHF
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── IDIOMAS ────────────────────────────────────────────────
CREATE TABLE idiomas (
  id   TEXT PRIMARY KEY,          -- 'it', 'en', 'es'
  nombre TEXT NOT NULL,
  activo BOOLEAN DEFAULT true
);

INSERT INTO idiomas VALUES
  ('it', 'Italiano', true),
  ('en', 'English',  true),
  ('es', 'Español',  true);

-- ─── CATEGORÍAS ─────────────────────────────────────────────
CREATE TABLE categorias (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug     TEXT UNIQUE NOT NULL,
  orden    INTEGER DEFAULT 0,
  activo   BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE categorias_traducciones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  idioma_id    TEXT NOT NULL REFERENCES idiomas(id),
  nombre       TEXT NOT NULL,
  UNIQUE(categoria_id, idioma_id)
);

-- ─── ALÉRGENOS ──────────────────────────────────────────────
CREATE TABLE alergenos (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug  TEXT UNIQUE NOT NULL,
  icono TEXT
);

CREATE TABLE alergenos_traducciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alergeno_id UUID NOT NULL REFERENCES alergenos(id) ON DELETE CASCADE,
  idioma_id   TEXT NOT NULL REFERENCES idiomas(id),
  nombre      TEXT NOT NULL,
  UNIQUE(alergeno_id, idioma_id)
);

-- Seed alérgenos (14 EU oficiales)
INSERT INTO alergenos (slug, icono) VALUES
  ('gluten','🌾'),('crustaceos','🦞'),('huevos','🥚'),('pescado','🐟'),
  ('cacahuetes','🥜'),('soja','🫘'),('lacteos','🥛'),('frutos_secos','🌰'),
  ('apio','🥬'),('mostaza','🌻'),('sesamo','🌿'),('sulfitos','🍷'),
  ('altramuces','🌼'),('moluscos','🐚');

INSERT INTO alergenos_traducciones (alergeno_id, idioma_id, nombre)
SELECT a.id, 'it', CASE a.slug
  WHEN 'gluten' THEN 'Glutine' WHEN 'crustaceos' THEN 'Crostacei'
  WHEN 'huevos' THEN 'Uova' WHEN 'pescado' THEN 'Pesce'
  WHEN 'cacahuetes' THEN 'Arachidi' WHEN 'soja' THEN 'Soia'
  WHEN 'lacteos' THEN 'Latte' WHEN 'frutos_secos' THEN 'Frutta a guscio'
  WHEN 'apio' THEN 'Sedano' WHEN 'mostaza' THEN 'Senape'
  WHEN 'sesamo' THEN 'Sesamo' WHEN 'sulfitos' THEN 'Solfiti'
  WHEN 'altramuces' THEN 'Lupini' WHEN 'moluscos' THEN 'Molluschi'
END FROM alergenos a;

INSERT INTO alergenos_traducciones (alergeno_id, idioma_id, nombre)
SELECT a.id, 'en', CASE a.slug
  WHEN 'gluten' THEN 'Gluten' WHEN 'crustaceos' THEN 'Crustaceans'
  WHEN 'huevos' THEN 'Eggs' WHEN 'pescado' THEN 'Fish'
  WHEN 'cacahuetes' THEN 'Peanuts' WHEN 'soja' THEN 'Soy'
  WHEN 'lacteos' THEN 'Milk' WHEN 'frutos_secos' THEN 'Tree nuts'
  WHEN 'apio' THEN 'Celery' WHEN 'mostaza' THEN 'Mustard'
  WHEN 'sesamo' THEN 'Sesame' WHEN 'sulfitos' THEN 'Sulphites'
  WHEN 'altramuces' THEN 'Lupin' WHEN 'moluscos' THEN 'Molluscs'
END FROM alergenos a;

INSERT INTO alergenos_traducciones (alergeno_id, idioma_id, nombre)
SELECT a.id, 'es', CASE a.slug
  WHEN 'gluten' THEN 'Gluten' WHEN 'crustaceos' THEN 'Crustáceos'
  WHEN 'huevos' THEN 'Huevos' WHEN 'pescado' THEN 'Pescado'
  WHEN 'cacahuetes' THEN 'Cacahuetes' WHEN 'soja' THEN 'Soja'
  WHEN 'lacteos' THEN 'Lácteos' WHEN 'frutos_secos' THEN 'Frutos secos'
  WHEN 'apio' THEN 'Apio' WHEN 'mostaza' THEN 'Mostaza'
  WHEN 'sesamo' THEN 'Sésamo' WHEN 'sulfitos' THEN 'Sulfitos'
  WHEN 'altramuces' THEN 'Altramuces' WHEN 'moluscos' THEN 'Moluscos'
END FROM alergenos a;

-- ─── INGREDIENTES (Stock) ────────────────────────────────────
CREATE TABLE ingredientes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  unidad        TEXT NOT NULL CHECK (unidad IN ('kg','g','l','ml','unidad','porciones')),
  stock_actual  DECIMAL(10,3) DEFAULT 0,
  stock_minimo  DECIMAL(10,3) DEFAULT 0,   -- umbral de alerta
  costo_unidad  DECIMAL(10,2) DEFAULT 0,   -- CHF por unidad
  proveedor     TEXT,
  activo        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ingredientes_stock ON ingredientes(stock_actual, stock_minimo);

-- ─── PRODUCTOS (Menú) ────────────────────────────────────────
CREATE TABLE productos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES categorias(id),
  precio       DECIMAL(10,2) NOT NULL,   -- CHF
  disponible   BOOLEAN DEFAULT true,
  imagen_url   TEXT,
  activo       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE productos_traducciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  idioma_id   TEXT NOT NULL REFERENCES idiomas(id),
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  UNIQUE(producto_id, idioma_id)
);

-- Receta: ingredientes que componen cada plato
CREATE TABLE productos_ingredientes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id    UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  ingrediente_id UUID NOT NULL REFERENCES ingredientes(id),
  cantidad       DECIMAL(10,3) NOT NULL,
  UNIQUE(producto_id, ingrediente_id)
);

CREATE TABLE productos_alergenos (
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  alergeno_id UUID NOT NULL REFERENCES alergenos(id) ON DELETE CASCADE,
  PRIMARY KEY(producto_id, alergeno_id)
);

-- ─── MESAS ──────────────────────────────────────────────────
CREATE TABLE mesas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero     INTEGER UNIQUE NOT NULL,
  capacidad  INTEGER DEFAULT 4,
  estado     TEXT DEFAULT 'libre' CHECK (estado IN ('libre','ocupada','reservada')),
  zona       TEXT DEFAULT 'sala',   -- 'sala', 'terraza', 'privado'
  posicion_x DECIMAL(5,2),
  posicion_y DECIMAL(5,2),
  activo     BOOLEAN DEFAULT true
);

-- ─── PEDIDOS ────────────────────────────────────────────────
CREATE TABLE pedidos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id      UUID REFERENCES mesas(id),
  estado       TEXT DEFAULT 'abierto'
                 CHECK (estado IN ('abierto','en_preparacion','listo','entregado','pagado','cancelado')),
  metodo_pago  TEXT CHECK (metodo_pago IN ('efectivo','tarjeta','otros')),
  subtotal     DECIMAL(10,2) DEFAULT 0,
  total        DECIMAL(10,2) DEFAULT 0,
  notas        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pedidos_estado  ON pedidos(estado);
CREATE INDEX idx_pedidos_mesa    ON pedidos(mesa_id);
CREATE INDEX idx_pedidos_fecha   ON pedidos(created_at);

CREATE TABLE pedido_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     UUID NOT NULL REFERENCES productos(id),
  cantidad        INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL,
  estado          TEXT DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','en_preparacion','listo','entregado')),
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pedido_items_pedido ON pedido_items(pedido_id);
CREATE INDEX idx_pedido_items_estado ON pedido_items(estado);

-- ─── MOVIMIENTOS DE STOCK ───────────────────────────────────
CREATE TABLE movimientos_stock (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingrediente_id UUID NOT NULL REFERENCES ingredientes(id),
  tipo           TEXT NOT NULL CHECK (tipo IN ('entrada','salida','ajuste')),
  cantidad       DECIMAL(10,3) NOT NULL,
  stock_previo   DECIMAL(10,3),
  stock_nuevo    DECIMAL(10,3),
  motivo         TEXT CHECK (motivo IN ('compra','pedido','merma','devolucion','ajuste_inventario','otro')),
  pedido_item_id UUID REFERENCES pedido_items(id),
  notas          TEXT,
  usuario        TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mov_stock_ingrediente ON movimientos_stock(ingrediente_id);
CREATE INDEX idx_mov_stock_fecha       ON movimientos_stock(created_at);

-- ─── MOVIMIENTOS DE CAJA ────────────────────────────────────
CREATE TABLE movimientos_caja (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id  UUID REFERENCES pedidos(id),
  tipo       TEXT NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  metodo     TEXT NOT NULL CHECK (metodo IN ('efectivo','tarjeta','otros')),
  monto      DECIMAL(10,2) NOT NULL,   -- CHF
  concepto   TEXT,
  usuario    TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_caja_fecha  ON movimientos_caja(created_at);
CREATE INDEX idx_caja_metodo ON movimientos_caja(metodo);

-- ═══════════════════════════════════════════════════════════
-- FUNCIONES Y TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- 1. Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ingredientes_updated_at
  BEFORE UPDATE ON ingredientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Descontar stock al insertar un pedido_item
CREATE OR REPLACE FUNCTION descontar_stock_pedido()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT pi2.ingrediente_id, pi2.cantidad * NEW.cantidad AS total
    FROM productos_ingredientes pi2
    WHERE pi2.producto_id = NEW.producto_id
  LOOP
    UPDATE ingredientes
    SET stock_actual = stock_actual - rec.total
    WHERE id = rec.ingrediente_id;

    INSERT INTO movimientos_stock
      (ingrediente_id, tipo, cantidad, stock_previo, stock_nuevo, motivo, pedido_item_id)
    SELECT
      rec.ingrediente_id,
      'salida',
      rec.total,
      stock_actual + rec.total,
      stock_actual,
      'pedido',
      NEW.id
    FROM ingredientes WHERE id = rec.ingrediente_id;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_descontar_stock
  AFTER INSERT ON pedido_items
  FOR EACH ROW EXECUTE FUNCTION descontar_stock_pedido();

-- 3. Recalcular total del pedido al insertar/actualizar/borrar items
CREATE OR REPLACE FUNCTION recalcular_total_pedido()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  pid UUID;
BEGIN
  pid := COALESCE(NEW.pedido_id, OLD.pedido_id);
  UPDATE pedidos
  SET total = (
    SELECT COALESCE(SUM(cantidad * precio_unitario), 0)
    FROM pedido_items
    WHERE pedido_id = pid
  )
  WHERE id = pid;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_total_pedido
  AFTER INSERT OR UPDATE OR DELETE ON pedido_items
  FOR EACH ROW EXECUTE FUNCTION recalcular_total_pedido();

-- 4. Marcar mesa como ocupada/libre según pedidos activos
CREATE OR REPLACE FUNCTION sync_estado_mesa()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.estado = 'abierto' THEN
    UPDATE mesas SET estado = 'ocupada' WHERE id = NEW.mesa_id;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.estado IN ('pagado','cancelado') THEN
    -- Solo libera si no hay otros pedidos activos en la mesa
    IF NOT EXISTS (
      SELECT 1 FROM pedidos
      WHERE mesa_id = NEW.mesa_id
        AND estado NOT IN ('pagado','cancelado')
        AND id != NEW.id
    ) THEN
      UPDATE mesas SET estado = 'libre' WHERE id = NEW.mesa_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_mesa_estado
  AFTER INSERT OR UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION sync_estado_mesa();

-- ═══════════════════════════════════════════════════════════
-- VISTAS ÚTILES
-- ═══════════════════════════════════════════════════════════

-- Vista: ingredientes con estado de stock
CREATE VIEW v_stock_estado AS
SELECT
  i.*,
  CASE
    WHEN i.stock_actual <= 0              THEN 'agotado'
    WHEN i.stock_actual <= i.stock_minimo THEN 'critico'
    WHEN i.stock_actual <= i.stock_minimo * 1.5 THEN 'bajo'
    ELSE 'ok'
  END AS estado_stock
FROM ingredientes i
WHERE i.activo = true;

-- Vista: pedidos con detalle de mesa
CREATE VIEW v_pedidos_activos AS
SELECT
  p.*,
  m.numero   AS mesa_numero,
  m.zona     AS mesa_zona,
  COUNT(pi.id) AS total_items
FROM pedidos p
LEFT JOIN mesas m ON m.id = p.mesa_id
LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
WHERE p.estado NOT IN ('pagado','cancelado')
GROUP BY p.id, m.numero, m.zona;

-- Vista: ventas del día
CREATE VIEW v_ventas_hoy AS
SELECT
  DATE_TRUNC('day', created_at AT TIME ZONE 'Europe/Rome') AS dia,
  metodo_pago,
  COUNT(*)         AS num_pedidos,
  SUM(total)       AS total_chf
FROM pedidos
WHERE estado = 'pagado'
  AND created_at >= CURRENT_DATE
GROUP BY 1, 2;

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE ingredientes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja  ENABLE ROW LEVEL SECURITY;

-- Política pública para carta digital (solo lectura)
CREATE POLICY "carta_publica_productos" ON productos
  FOR SELECT USING (activo = true AND disponible = true);

CREATE POLICY "carta_publica_categorias" ON categorias
  FOR SELECT USING (activo = true);

-- Política interna: acceso completo con rol autenticado
-- (ajustar según roles de Supabase Auth en producción)
CREATE POLICY "staff_full_access_ingredientes" ON ingredientes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "staff_full_access_pedidos" ON pedidos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "staff_full_access_items" ON pedido_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "staff_full_access_caja" ON movimientos_caja
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "staff_full_access_stock_mov" ON movimientos_stock
  FOR ALL USING (auth.role() = 'authenticated');
