-- ============================================================
-- MIGRACIÓN: Fix RLS — permitir acceso anon a todas las tablas
-- El sistema usa la clave anon de Supabase (sin Supabase Auth)
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- ── productos ────────────────────────────────────────────────
DROP POLICY IF EXISTS "carta_publica_productos" ON productos;
DROP POLICY IF EXISTS "anon_productos" ON productos;
CREATE POLICY "anon_productos" ON productos FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE productos_traducciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_prod_trad" ON productos_traducciones;
CREATE POLICY "anon_prod_trad" ON productos_traducciones FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE productos_alergenos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_prod_alerg" ON productos_alergenos;
CREATE POLICY "anon_prod_alerg" ON productos_alergenos FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── categorías ───────────────────────────────────────────────
DROP POLICY IF EXISTS "carta_publica_categorias" ON categorias;
DROP POLICY IF EXISTS "anon_categorias" ON categorias;
CREATE POLICY "anon_categorias" ON categorias FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE categorias_traducciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_cat_trad" ON categorias_traducciones;
CREATE POLICY "anon_cat_trad" ON categorias_traducciones FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── mesas ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_mesas" ON mesas;
CREATE POLICY "anon_mesas" ON mesas FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── pedidos ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "staff_full_access_pedidos" ON pedidos;
DROP POLICY IF EXISTS "anon_pedidos" ON pedidos;
CREATE POLICY "anon_pedidos" ON pedidos FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── pedido_items ─────────────────────────────────────────────
DROP POLICY IF EXISTS "staff_full_access_items" ON pedido_items;
DROP POLICY IF EXISTS "anon_pedido_items" ON pedido_items;
CREATE POLICY "anon_pedido_items" ON pedido_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── ingredientes ─────────────────────────────────────────────
DROP POLICY IF EXISTS "staff_full_access_ingredientes" ON ingredientes;
DROP POLICY IF EXISTS "anon_ingredientes" ON ingredientes;
CREATE POLICY "anon_ingredientes" ON ingredientes FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── movimientos_caja ─────────────────────────────────────────
DROP POLICY IF EXISTS "staff_full_access_caja" ON movimientos_caja;
DROP POLICY IF EXISTS "anon_caja" ON movimientos_caja;
CREATE POLICY "anon_caja" ON movimientos_caja FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── movimientos_stock ────────────────────────────────────────
DROP POLICY IF EXISTS "staff_full_access_stock_mov" ON movimientos_stock;
DROP POLICY IF EXISTS "anon_stock_mov" ON movimientos_stock;
CREATE POLICY "anon_stock_mov" ON movimientos_stock FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── alergenos ────────────────────────────────────────────────
ALTER TABLE alergenos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_alergenos" ON alergenos;
CREATE POLICY "anon_alergenos" ON alergenos FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE alergenos_traducciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_alerg_trad" ON alergenos_traducciones;
CREATE POLICY "anon_alerg_trad" ON alergenos_traducciones FOR ALL TO anon USING (true) WITH CHECK (true);
