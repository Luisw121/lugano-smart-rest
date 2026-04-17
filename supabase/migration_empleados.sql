-- ============================================================
-- MIGRACIÓN: Empleados + Fichajes
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

CREATE TABLE empleados (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  pin        TEXT NOT NULL,                                    -- 4 dígitos
  rol        TEXT NOT NULL CHECK (rol IN ('camarero','cocinero','responsable_sala')),
  activo     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE fichajes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('entrada','salida')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fichajes_empleado ON fichajes(empleado_id);
CREATE INDEX idx_fichajes_fecha    ON fichajes(created_at);

-- Vista: estado actual de cada empleado (si está fichado o no)
CREATE VIEW v_empleados_estado AS
SELECT
  e.*,
  f.tipo   AS ultimo_fichaje,
  f.created_at AS ultimo_fichaje_at,
  CASE WHEN f.tipo = 'entrada' THEN true ELSE false END AS en_turno
FROM empleados e
LEFT JOIN LATERAL (
  SELECT tipo, created_at FROM fichajes
  WHERE empleado_id = e.id
  ORDER BY created_at DESC LIMIT 1
) f ON true
WHERE e.activo = true;

-- RLS
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichajes  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_empleados" ON empleados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_fichajes"  ON fichajes  FOR ALL USING (true) WITH CHECK (true);

-- Añadir campo empleado_id a pedidos (camarero que tomó el pedido)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS empleado_id UUID REFERENCES empleados(id);
