-- ============================================================
-- MIGRACIÓN v2: notas, num_comensales + seed menú italiano
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- Notas globales del pedido (ej: "Mesa prefiere sin ruido")
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS notas TEXT;

-- Número de comensales al abrir mesa
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS num_comensales INTEGER DEFAULT 1;

-- Nota específica por ítem (ej: "sin gluten", "poco picante")
ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS notas TEXT;

-- ── SEED: idiomas (si no existen) ────────────────────────────
INSERT INTO idiomas (id, nombre) VALUES
  ('it', 'Italiano'), ('en', 'English'), ('es', 'Español')
ON CONFLICT (id) DO NOTHING;

-- ── SEED: alérgenos ──────────────────────────────────────────
INSERT INTO alergenos (id, slug, icono) VALUES
  (gen_random_uuid(), 'gluten',    '🌾'),
  (gen_random_uuid(), 'lacteos',   '🥛'),
  (gen_random_uuid(), 'huevos',    '🥚'),
  (gen_random_uuid(), 'frutos_secos', '🥜'),
  (gen_random_uuid(), 'mariscos',  '🦐'),
  (gen_random_uuid(), 'sulfitos',  '🍷')
ON CONFLICT DO NOTHING;

INSERT INTO alergenos_traducciones (alergeno_id, idioma_id, nombre)
SELECT a.id, 'it', CASE a.slug
  WHEN 'gluten'       THEN 'Glutine'
  WHEN 'lacteos'      THEN 'Latticini'
  WHEN 'huevos'       THEN 'Uova'
  WHEN 'frutos_secos' THEN 'Frutta secca'
  WHEN 'mariscos'     THEN 'Crostacei'
  WHEN 'sulfitos'     THEN 'Solfiti'
END FROM alergenos a ON CONFLICT DO NOTHING;

INSERT INTO alergenos_traducciones (alergeno_id, idioma_id, nombre)
SELECT a.id, 'en', CASE a.slug
  WHEN 'gluten'       THEN 'Gluten'
  WHEN 'lacteos'      THEN 'Dairy'
  WHEN 'huevos'       THEN 'Eggs'
  WHEN 'frutos_secos' THEN 'Nuts'
  WHEN 'mariscos'     THEN 'Shellfish'
  WHEN 'sulfitos'     THEN 'Sulphites'
END FROM alergenos a ON CONFLICT DO NOTHING;

INSERT INTO alergenos_traducciones (alergeno_id, idioma_id, nombre)
SELECT a.id, 'es', CASE a.slug
  WHEN 'gluten'       THEN 'Gluten'
  WHEN 'lacteos'      THEN 'Lácteos'
  WHEN 'huevos'       THEN 'Huevos'
  WHEN 'frutos_secos' THEN 'Frutos secos'
  WHEN 'mariscos'     THEN 'Mariscos'
  WHEN 'sulfitos'     THEN 'Sulfitos'
END FROM alergenos a ON CONFLICT DO NOTHING;

-- ── SEED: categorías ─────────────────────────────────────────
INSERT INTO categorias (id, slug, orden, activo) VALUES
  ('cat-antipasti', 'antipasti',  1, true),
  ('cat-primi',     'primi',      2, true),
  ('cat-secondi',   'secondi',    3, true),
  ('cat-contorni',  'contorni',   4, true),
  ('cat-dolci',     'dolci',      5, true),
  ('cat-bevande',   'bevande',    6, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categorias_traducciones (categoria_id, idioma_id, nombre) VALUES
  ('cat-antipasti','it','Antipasti'),  ('cat-antipasti','en','Starters'),    ('cat-antipasti','es','Entrantes'),
  ('cat-primi',    'it','Primi Piatti'),('cat-primi',   'en','First Courses'),('cat-primi',   'es','Primeros'),
  ('cat-secondi',  'it','Secondi'),    ('cat-secondi',  'en','Main Courses'), ('cat-secondi', 'es','Segundos'),
  ('cat-contorni', 'it','Contorni'),   ('cat-contorni', 'en','Side Dishes'),  ('cat-contorni','es','Guarniciones'),
  ('cat-dolci',    'it','Dolci'),      ('cat-dolci',    'en','Desserts'),      ('cat-dolci',   'es','Postres'),
  ('cat-bevande',  'it','Bevande'),    ('cat-bevande',  'en','Drinks'),        ('cat-bevande', 'es','Bebidas')
ON CONFLICT DO NOTHING;

-- ── SEED: productos ──────────────────────────────────────────
INSERT INTO productos (id, categoria_id, precio, disponible, imagen_url, activo) VALUES
  -- Antipasti
  ('p-bruschetta',   'cat-antipasti', 9.50,  true, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&q=80', true),
  ('p-carpaccio',    'cat-antipasti', 16.00, true, 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=600&q=80', true),
  ('p-burrata',      'cat-antipasti', 14.50, true, 'https://images.unsplash.com/photo-1607116667981-ff9c9e2a52c6?w=600&q=80', true),
  ('p-frittura',     'cat-antipasti', 12.00, true, 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&q=80', true),
  -- Primi
  ('p-carbonara',    'cat-primi',     21.00, true, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80', true),
  ('p-cacio',        'cat-primi',     19.50, true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80', true),
  ('p-risotto',      'cat-primi',     23.00, true, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80', true),
  ('p-lasagna',      'cat-primi',     22.00, true, 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80', true),
  ('p-gnocchi',      'cat-primi',     20.00, true, 'https://images.unsplash.com/photo-1551183053-bf91798d832f?w=600&q=80', true),
  -- Secondi
  ('p-branzino',     'cat-secondi',   32.00, true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80', true),
  ('p-tagliata',     'cat-secondi',   38.00, true, 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&q=80', true),
  ('p-pollo',        'cat-secondi',   26.00, true, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=600&q=80', true),
  ('p-costolette',   'cat-secondi',   34.00, true, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80', true),
  -- Contorni
  ('p-insalata',     'cat-contorni',  8.00,  true, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80', true),
  ('p-verdure',      'cat-contorni',  9.00,  true, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80', true),
  ('p-patate',       'cat-contorni',  7.00,  true, 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=600&q=80', true),
  -- Dolci
  ('p-tiramisu',     'cat-dolci',     9.00,  true, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80', true),
  ('p-pannacotta',   'cat-dolci',     8.50,  true, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80', true),
  ('p-cannoli',      'cat-dolci',     7.50,  true, 'https://images.unsplash.com/photo-1551529835-1a5aca6b2abe?w=600&q=80', true),
  -- Bevande
  ('p-acqua',        'cat-bevande',   4.00,  true, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&q=80', true),
  ('p-vino-rosso',   'cat-bevande',   8.50,  true, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80', true),
  ('p-vino-bianco',  'cat-bevande',   8.00,  true, 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&q=80', true),
  ('p-espresso',     'cat-bevande',   3.50,  true, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80', true),
  ('p-bibita',       'cat-bevande',   4.50,  true, 'https://images.unsplash.com/photo-1527960669566-f882ba85a4c6?w=600&q=80', true)
ON CONFLICT (id) DO NOTHING;

-- Traducciones IT
INSERT INTO productos_traducciones (producto_id, idioma_id, nombre, descripcion) VALUES
  ('p-bruschetta', 'it', 'Bruschetta al Pomodoro', 'Pane casereccio tostato con pomodoro fresco, basilico e olio EVO'),
  ('p-carpaccio',  'it', 'Carpaccio di Manzo',     'Fettine sottili di manzo, rucola, scaglie di Grana Padano e limone'),
  ('p-burrata',    'it', 'Burrata Pugliese',        'Burrata fresca con pomodorini confit, basilico e olio al tartufo'),
  ('p-frittura',   'it', 'Frittura di Verdure',     'Selezione di verdure di stagione in pastella leggera e croccante'),
  ('p-carbonara',  'it', 'Carbonara Tradizionale',  'Rigatoni con guanciale croccante, pecorino romano e tuorlo d''uovo'),
  ('p-cacio',      'it', 'Cacio e Pepe',            'Tonnarelli con crema di pecorino romano e pepe nero macinato a mano'),
  ('p-risotto',    'it', 'Risotto al Tartufo Nero', 'Riso Carnaroli mantecato con tartufo nero del Périgord e Parmigiano'),
  ('p-lasagna',    'it', 'Lasagne della Nonna',     'Strati di sfoglia fresca, ragù bolognese, besciamella e Parmigiano'),
  ('p-gnocchi',    'it', 'Gnocchi al Pomodoro',     'Gnocchi di patate fatti in casa con salsa di pomodoro San Marzano'),
  ('p-branzino',   'it', 'Branzino al Cartoccio',   'Branzino mediterraneo con erbe aromatiche, limone e vino bianco'),
  ('p-tagliata',   'it', 'Tagliata di Manzo',       'Controfiletto di manzo alla brace con rucola, Grana e riduzione di balsamico'),
  ('p-pollo',      'it', 'Pollo alla Cacciatora',   'Cosce di pollo con olive, capperi, pomodoro e vino rosso'),
  ('p-costolette', 'it', 'Costolette d''Agnello',   'Costolette marinate alle erbe con rosmarino, aglio e menta'),
  ('p-insalata',   'it', 'Insalata Mista',          'Misticanza di stagione, pomodorini, cetrioli e vinaigrette al limone'),
  ('p-verdure',    'it', 'Verdure Grigliate',        'Zucchine, melanzane, peperoni e asparagi alla griglia con olio EVO'),
  ('p-patate',     'it', 'Patate al Forno',         'Patate novelle al forno con rosmarino, aglio e olio extravergine'),
  ('p-tiramisu',   'it', 'Tiramisù della Casa',     'Ricetta originale con mascarpone, savoiardi, caffè espresso e cacao'),
  ('p-pannacotta', 'it', 'Panna Cotta ai Frutti Rossi', 'Panna cotta vaniglia con coulis di frutti rossi freschi'),
  ('p-cannoli',    'it', 'Cannoli Siciliani',       'Cannolo croccante con ricotta di pecora, pistacchio e arancia candita'),
  ('p-acqua',      'it', 'Acqua Minerale',          'Naturale o frizzante — 75cl'),
  ('p-vino-rosso', 'it', 'Vino Rosso — Bicchiere',  'Selezione del giorno, Toscana o Piemonte'),
  ('p-vino-bianco','it', 'Vino Bianco — Bicchiere', 'Pinot Grigio o Soave, selezione del sommelier'),
  ('p-espresso',   'it', 'Caffè Espresso',          'Miscela italiana 100% arabica, tostatura media'),
  ('p-bibita',     'it', 'Bibita',                  'Coca-Cola, Fanta, acqua tonica o succo di frutta — 33cl')
ON CONFLICT DO NOTHING;

INSERT INTO productos_traducciones (producto_id, idioma_id, nombre, descripcion) VALUES
  ('p-bruschetta', 'en', 'Tomato Bruschetta',       'Toasted country bread with fresh tomato, basil and extra virgin olive oil'),
  ('p-carpaccio',  'en', 'Beef Carpaccio',          'Thin slices of beef, rocket, Grana Padano shavings and lemon'),
  ('p-burrata',    'en', 'Pugliese Burrata',        'Fresh burrata with confit cherry tomatoes, basil and truffle oil'),
  ('p-frittura',   'en', 'Vegetable Fritto Misto',  'Selection of seasonal vegetables in light crispy batter'),
  ('p-carbonara',  'en', 'Traditional Carbonara',   'Rigatoni with crispy guanciale, pecorino romano and egg yolk'),
  ('p-cacio',      'en', 'Cacio e Pepe',            'Tonnarelli with pecorino romano cream and hand-ground black pepper'),
  ('p-risotto',    'en', 'Black Truffle Risotto',   'Carnaroli rice with Périgord black truffle and Parmigiano Reggiano'),
  ('p-lasagna',    'en', 'Grandmother''s Lasagne',   'Layers of fresh pasta, Bolognese ragù, béchamel and Parmigiano'),
  ('p-gnocchi',    'en', 'Potato Gnocchi',          'Homemade potato gnocchi with San Marzano tomato sauce'),
  ('p-branzino',   'en', 'Sea Bass en Papillote',   'Mediterranean sea bass with herbs, lemon and white wine'),
  ('p-tagliata',   'en', 'Grilled Beef Tagliata',   'Sirloin steak with rocket, Grana Padano and balsamic reduction'),
  ('p-pollo',      'en', 'Chicken Cacciatore',      'Chicken thighs with olives, capers, tomato and red wine'),
  ('p-costolette', 'en', 'Lamb Chops',              'Herb-marinated chops with rosemary, garlic and mint'),
  ('p-insalata',   'en', 'Mixed Salad',             'Seasonal leaves, cherry tomatoes, cucumber and lemon vinaigrette'),
  ('p-verdure',    'en', 'Grilled Vegetables',      'Courgette, aubergine, peppers and asparagus with extra virgin olive oil'),
  ('p-patate',     'en', 'Roast Potatoes',          'New potatoes with rosemary, garlic and extra virgin olive oil'),
  ('p-tiramisu',   'en', 'House Tiramisù',          'Original recipe with mascarpone, savoiardi, espresso and cocoa'),
  ('p-pannacotta', 'en', 'Panna Cotta',             'Vanilla panna cotta with fresh red berry coulis'),
  ('p-cannoli',    'en', 'Sicilian Cannoli',        'Crispy cannolo with sheep''s ricotta, pistachio and candied orange'),
  ('p-acqua',      'en', 'Mineral Water',           'Still or sparkling — 75cl'),
  ('p-vino-rosso', 'en', 'Red Wine — Glass',        'Daily selection, Tuscany or Piedmont'),
  ('p-vino-bianco','en', 'White Wine — Glass',      'Pinot Grigio or Soave, sommelier''s selection'),
  ('p-espresso',   'en', 'Espresso',                '100% Arabica Italian blend, medium roast'),
  ('p-bibita',     'en', 'Soft Drink',              'Coca-Cola, Fanta, tonic water or fruit juice — 33cl')
ON CONFLICT DO NOTHING;

INSERT INTO productos_traducciones (producto_id, idioma_id, nombre, descripcion) VALUES
  ('p-bruschetta', 'es', 'Bruschetta al Tomate',    'Pan rústico tostado con tomate fresco, albahaca y AOVE'),
  ('p-carpaccio',  'es', 'Carpaccio de Buey',       'Finas láminas de buey, rúcula, virutas de Grana Padano y limón'),
  ('p-burrata',    'es', 'Burrata Pugliese',        'Burrata fresca con tomatitos confitados, albahaca y aceite de trufa'),
  ('p-frittura',   'es', 'Verduras en Tempura',     'Selección de verduras de temporada en tempura ligera y crujiente'),
  ('p-carbonara',  'es', 'Carbonara Tradicional',   'Rigatoni con guanciale crujiente, pecorino romano y yema de huevo'),
  ('p-cacio',      'es', 'Cacio e Pepe',            'Tonnarelli con crema de pecorino romano y pimienta negra molida a mano'),
  ('p-risotto',    'es', 'Risotto con Trufa Negra', 'Arroz Carnaroli con trufa negra del Périgord y Parmigiano'),
  ('p-lasagna',    'es', 'Lasaña de la Abuela',     'Capas de pasta fresca, ragú boloñesa, bechamel y Parmigiano'),
  ('p-gnocchi',    'es', 'Ñoquis al Tomate',        'Ñoquis de patata caseros con salsa de tomate San Marzano'),
  ('p-branzino',   'es', 'Lubina al Papillote',     'Lubina mediterránea con hierbas aromáticas, limón y vino blanco'),
  ('p-tagliata',   'es', 'Tagliata de Buey',        'Solomillo a la brasa con rúcula, Grana Padano y reducción de balsámico'),
  ('p-pollo',      'es', 'Pollo a la Cacciatora',   'Muslos de pollo con aceitunas, alcaparras, tomate y vino tinto'),
  ('p-costolette', 'es', 'Chuletas de Cordero',     'Chuletas marinadas con romero, ajo y menta'),
  ('p-insalata',   'es', 'Ensalada Mixta',          'Mezcla de temporada, tomatitos, pepino y vinagreta al limón'),
  ('p-verdure',    'es', 'Verduras a la Plancha',   'Calabacín, berenjena, pimientos y espárragos con AOVE'),
  ('p-patate',     'es', 'Patatas al Horno',        'Patatas nuevas al horno con romero, ajo y aceite de oliva virgen'),
  ('p-tiramisu',   'es', 'Tiramisú de la Casa',     'Receta original con mascarpone, bizcochos, café espresso y cacao'),
  ('p-pannacotta', 'es', 'Panna Cotta',             'Panna cotta de vainilla con coulis de frutos rojos frescos'),
  ('p-cannoli',    'es', 'Cannoli Sicilianos',      'Cannolo crujiente con ricotta de oveja, pistacho y naranja confitada'),
  ('p-acqua',      'es', 'Agua Mineral',            'Sin gas o con gas — 75cl'),
  ('p-vino-rosso', 'es', 'Vino Tinto — Copa',       'Selección del día, Toscana o Piamonte'),
  ('p-vino-bianco','es', 'Vino Blanco — Copa',      'Pinot Grigio o Soave, selección del sommelier'),
  ('p-espresso',   'es', 'Café Espresso',           'Mezcla italiana 100% arábica, tostado medio'),
  ('p-bibita',     'es', 'Refresco',                'Coca-Cola, Fanta, agua tónica o zumo de frutas — 33cl')
ON CONFLICT DO NOTHING;

-- Alérgenos por producto
INSERT INTO productos_alergenos (producto_id, alergeno_id)
SELECT p.id, a.id FROM productos p, alergenos a
WHERE (p.id = 'p-bruschetta' AND a.slug = 'gluten')
   OR (p.id = 'p-burrata'    AND a.slug = 'lacteos')
   OR (p.id = 'p-carbonara'  AND a.slug IN ('gluten','huevos','lacteos'))
   OR (p.id = 'p-cacio'      AND a.slug IN ('gluten','lacteos'))
   OR (p.id = 'p-risotto'    AND a.slug = 'lacteos')
   OR (p.id = 'p-lasagna'    AND a.slug IN ('gluten','huevos','lacteos'))
   OR (p.id = 'p-gnocchi'    AND a.slug IN ('gluten','huevos'))
   OR (p.id = 'p-tiramisu'   AND a.slug IN ('gluten','huevos','lacteos'))
   OR (p.id = 'p-pannacotta' AND a.slug = 'lacteos')
   OR (p.id = 'p-cannoli'    AND a.slug IN ('gluten','lacteos'))
   OR (p.id = 'p-vino-rosso' AND a.slug = 'sulfitos')
   OR (p.id = 'p-vino-bianco'AND a.slug = 'sulfitos')
ON CONFLICT DO NOTHING;
