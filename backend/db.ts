import Database from "better-sqlite3";

const db: any = new Database("app.db");

// Tabla de cafés (usada por calibraciones)
db.prepare(`
  CREATE TABLE IF NOT EXISTS coffees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    benefit TEXT NOT NULL,
    origin TEXT
  )
`).run();

// Tabla de categorías del menú
db.prepare(`
  CREATE TABLE IF NOT EXISTS menu_category (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`).run();

// Tabla de items del menú (carta)
db.prepare(`
  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1 NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT,
    category_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES menu_category(category_id)
  )
`).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS calibrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coffee_id INTEGER NOT NULL REFERENCES coffees(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    method TEXT NOT NULL CHECK (method IN ('espresso','filter')),
    dose_g REAL NOT NULL CHECK (dose_g > 0),
    yield_g REAL NOT NULL CHECK (yield_g >= 0),
    extraction_time_s REAL NOT NULL CHECK (extraction_time_s >= 0),
    ratio_label TEXT NOT NULL,
    final_opinion TEXT,
    fav INTEGER NOT NULL DEFAULT 0 CHECK (fav IN (0,1)),
    sat INTEGER NOT NULL CHECK (sat BETWEEN 1 AND 3),
    bal INTEGER NOT NULL CHECK (bal BETWEEN 1 AND 3),
    tex INTEGER NOT NULL CHECK (tex BETWEEN 1 AND 3),
    fin INTEGER NOT NULL CHECK (fin BETWEEN 1 AND 3)
  )
  `
).run();

// Tabla de métodos de pago
db.prepare(`
  CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Tabla principal de órdenes
db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number INTEGER,
    shift TEXT CHECK (shift IN ('morning','afternoon')) NOT NULL,
    status TEXT CHECK (status IN ('open','paid','cancelled')) DEFAULT 'open',
    discount_percentage REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    payment_method_id INTEGER REFERENCES payment_methods(id),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Tabla de items de la orden (productos en la orden)
db.prepare(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id, menu_item_id)
  )
`).run();

// Insertar métodos de pago básicos
db.prepare(`
  INSERT OR IGNORE INTO payment_methods (name)
  VALUES
    ('Efectivo'),
    ('Tarjeta de débito'),
    ('Tarjeta de crédito'),
    ('Transferencia'),
    ('QR')
`).run();

// ============================================
// MÓDULO COST-ENGINE - Esquema de Base de Datos
// ============================================

// Tabla de Proveedores
db.prepare(`
  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    contact_info TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Migración: Agregar columnas faltantes si la tabla ya existe
try {
  const tableInfo = db.prepare("PRAGMA table_info(suppliers)").all() as Array<{ name: string; dflt_value: string | null }>;
  const hasActive = tableInfo.some(col => col.name === 'active');
  const hasContactInfo = tableInfo.some(col => col.name === 'contact_info');
  const hasCreatedAt = tableInfo.some(col => col.name === 'created_at');

  if (!hasActive) {
    db.prepare("ALTER TABLE suppliers ADD COLUMN active INTEGER DEFAULT 1").run();
    console.log("✓ Added 'active' column to suppliers table");
  }
  if (!hasContactInfo) {
    db.prepare("ALTER TABLE suppliers ADD COLUMN contact_info TEXT").run();
    if (tableInfo.some(col => col.name === 'phone')) {
      db.prepare("UPDATE suppliers SET contact_info = phone WHERE contact_info IS NULL").run();
      console.log("✓ Migrated 'phone' to 'contact_info' in suppliers table");
    }
    console.log("✓ Added 'contact_info' column to suppliers table");
  }
  if (!hasCreatedAt) {
    db.prepare("ALTER TABLE suppliers ADD COLUMN created_at TEXT").run();
    db.prepare("UPDATE suppliers SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL").run();
    console.log("✓ Added 'created_at' column to suppliers table");
  }
} catch (error) {
  console.log("Migration note:", error);
}

// Tabla de Materias Primas
db.prepare(`
  CREATE TABLE IF NOT EXISTS raw_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    purchase_price REAL NOT NULL,
    purchase_quantity REAL NOT NULL,
    purchase_unit TEXT NOT NULL CHECK (purchase_unit IN ('kg', 'gr', 'l', 'ml', 'unidad')),
    unit_cost REAL NOT NULL, -- Calculado automáticamente
    active INTEGER DEFAULT 1,
    last_price_update TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Tabla de Recetas
db.prepare(`
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    recipe_cost REAL DEFAULT 0, -- Calculado automáticamente
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Tabla de Ingredientes de Recetas (relación many-to-many)
db.prepare(`
  CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    raw_material_id INTEGER NOT NULL REFERENCES raw_materials(id),
    quantity REAL NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL CHECK (unit IN ('kg', 'gr', 'l', 'ml', 'unidad')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recipe_id, raw_material_id)
  )
`).run();

// Tabla de Productos Finales (productos de carta)
db.prepare(`
  CREATE TABLE IF NOT EXISTS cost_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    recipe_id INTEGER REFERENCES recipes(id),
    fixed_cost REAL DEFAULT 0,
    fixed_cost_type TEXT CHECK (fixed_cost_type IN ('per_item', 'per_minute', 'global')) DEFAULT 'per_item',
    preparation_time_minutes REAL DEFAULT 0,
    margin_percentage REAL NOT NULL DEFAULT 50, -- Margen de ganancia en %
    calculated_cost REAL DEFAULT 0, -- Costo calculado (receta + gastos fijos)
    suggested_price REAL DEFAULT 0, -- Precio sugerido con margen
    rounded_price REAL DEFAULT 0, -- Precio redondeado para carta
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Tabla de Gastos Fijos Globales
db.prepare(`
  CREATE TABLE IF NOT EXISTS fixed_costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    cost_per_item REAL DEFAULT 0,
    cost_per_minute REAL DEFAULT 0,
    is_global INTEGER DEFAULT 0, -- 1 = global, 0 = por producto
    product_id INTEGER REFERENCES cost_products(id) ON DELETE CASCADE,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Tabla de Historial de Precios (para tracking de cambios)
db.prepare(`
  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES cost_products(id) ON DELETE CASCADE,
    raw_material_id INTEGER REFERENCES raw_materials(id) ON DELETE SET NULL,
    old_value REAL,
    new_value REAL,
    change_type TEXT CHECK (change_type IN ('raw_material_price', 'recipe_change', 'fixed_cost', 'margin', 'manual_update')),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Índices para mejorar performance
db.prepare(`CREATE INDEX IF NOT EXISTS idx_raw_materials_supplier ON raw_materials(supplier_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_material ON recipe_ingredients(raw_material_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_cost_products_recipe ON cost_products(recipe_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_price_history_material ON price_history(raw_material_id)`).run();

// ============================================
// MÓDULO REPORTES - Tabla de gastos para reportes
// ============================================
db.prepare(`
  CREATE TABLE IF NOT EXISTS report_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('servicios', 'proveedores', 'supermercado', 'otros')),
    description TEXT DEFAULT '',
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_report_expenses_date ON report_expenses(date)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_report_expenses_category ON report_expenses(category)`).run();

// ============================================
// MÓDULO STOCK - Control de Stock
// ============================================

// Migration: drop old stock tables that used raw_material_id (incompatible schema)
try {
  const stockMovCols = db.prepare("PRAGMA table_info(stock_movements)").all() as Array<{ name: string }>;
  if (stockMovCols.some(col => col.name === "raw_material_id")) {
    console.log("⚠ Detected old stock schema, migrating…");
    db.prepare("DROP TABLE IF EXISTS stock_movements").run();
    db.prepare("DROP TABLE IF EXISTS stock_inventory").run();
    console.log("✓ Dropped legacy stock tables (stock_movements, stock_inventory)");
  }
} catch {
  // Tables don't exist yet — nothing to migrate
}

// Productos de stock (ej: "Medialunas Dulces", "Croissants")
db.prepare(`
  CREATE TABLE IF NOT EXISTS stock_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    current_stock INTEGER NOT NULL DEFAULT 0,
    alert_threshold INTEGER NOT NULL DEFAULT 5,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Mapeo stock ↔ ítems del menú (many-to-many)
db.prepare(`
  CREATE TABLE IF NOT EXISTS stock_menu_item_map (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_product_id INTEGER NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_product_id, menu_item_id)
  )
`).run();

// Historial de movimientos de stock
db.prepare(`
  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_product_id INTEGER NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT NOT NULL,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_menu_map_product ON stock_menu_item_map(stock_product_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_menu_map_item ON stock_menu_item_map(menu_item_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(stock_product_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_movements_order ON stock_movements(order_id)`).run();

export default db;
