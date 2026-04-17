-- ============================================================
-- MIGRACIÓN SEGURA: Empleados + Fichajes
-- Se puede ejecutar aunque las tablas ya existan (IF NOT EXISTS)
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS empleados (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  pin        TEXT NOT NULL,
  rol        TEXT NOT NULL CHECK (rol IN ('camarero','cocinero','responsable_sala')),
  activo     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fichajes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('entrada','salida')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fichajes_empleado ON fichajes(empleado_id);
CREATE INDEX IF NOT EXISTS idx_fichajes_fecha    ON fichajes(created_at);

-- RLS: habilitar y permitir todo al rol anon (sin auth)
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichajes  ENABLE ROW LEVEL SECURITY;

-- Borrar y recrear policies para asegurarse que existen
DROP POLICY IF EXISTS "anon_empleados" ON empleados;
DROP POLICY IF EXISTS "anon_fichajes"  ON fichajes;

CREATE POLICY "anon_empleados" ON empleados FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_fichajes"  ON fichajes  FOR ALL TO anon USING (true) WITH CHECK (true);

-- También permitir al rol authenticated si se usa Supabase Auth
DROP POLICY IF EXISTS "auth_empleados" ON empleados;
DROP POLICY IF EXISTS "auth_fichajes"  ON fichajes;

CREATE POLICY "auth_empleados" ON empleados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_fichajes"  ON fichajes  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Añadir campo empleado_id a pedidos si no existe
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS empleado_id UUID REFERENCES empleados(id);
