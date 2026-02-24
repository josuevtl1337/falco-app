import Database from "better-sqlite3";

const db: any = new Database("app.db");

db.prepare(
  `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER,
  supplier_id INTEGER,
  purchase_price REAL,
  sale_price REAL,
  stock_quantity REAL DEFAULT 0,
  unit TEXT DEFAULT 'unidad',
  min_stock REAL DEFAULT 0,
  barcode TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
`
).run();

db.prepare(
  `
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  units REAL DEFAULT 1,
  price REAL NOT NULL,
  currency TEXT NOT NULL, -- 'USD' o 'ARS'
  payment_type TEXT,      -- 'cuotas', 'efectivo', 'transferencia', etc.
  document TEXT,          -- ruta o nombre del archivo de imagen
  date TEXT NOT NULL,     -- fecha del gasto (ISO string)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
`
).run();

db.prepare(
  `
CREATE TABLE IF NOT EXISTS initial_budget (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  currency TEXT NOT NULL, -- 'USD', 'ARS', etc.
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
`
).run();

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
    // Si existe 'phone', migrar datos
    if (tableInfo.some(col => col.name === 'phone')) {
      db.prepare("UPDATE suppliers SET contact_info = phone WHERE contact_info IS NULL").run();
      console.log("✓ Migrated 'phone' to 'contact_info' in suppliers table");
    }
    console.log("✓ Added 'contact_info' column to suppliers table");
  }
  if (!hasCreatedAt) {
    // SQLite no permite DEFAULT CURRENT_TIMESTAMP directamente en ALTER TABLE
    // Necesitamos agregar la columna y luego actualizar los valores existentes
    db.prepare("ALTER TABLE suppliers ADD COLUMN created_at TEXT").run();
    db.prepare("UPDATE suppliers SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL").run();
    console.log("✓ Added 'created_at' column to suppliers table");
  }
} catch (error) {
  // Ignorar errores de migración si la tabla no existe aún
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
// MÓDULO STOCK - Migraciones y Tablas
// ============================================

// Migración: Agregar columnas de stock a raw_materials si no existen
try {
  const rawMaterialsInfo = db.prepare("PRAGMA table_info(raw_materials)").all() as Array<{ name: string }>;
  const hasStockQuantity = rawMaterialsInfo.some(col => col.name === 'stock_quantity');
  const hasMinStock = rawMaterialsInfo.some(col => col.name === 'min_stock');

  if (!hasStockQuantity) {
    db.prepare("ALTER TABLE raw_materials ADD COLUMN stock_quantity REAL DEFAULT 0").run();
    console.log("✓ Added 'stock_quantity' column to raw_materials table");
  }
  if (!hasMinStock) {
    db.prepare("ALTER TABLE raw_materials ADD COLUMN min_stock REAL DEFAULT 0").run();
    console.log("✓ Added 'min_stock' column to raw_materials table");
  }
} catch (error) {
  console.log("Stock migration note:", error);
}

// Tabla de Recetas por Item del Menú (qué insumos usa cada item del menú)
db.prepare(`
  CREATE TABLE IF NOT EXISTS menu_item_recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    raw_material_id INTEGER NOT NULL REFERENCES raw_materials(id),
    quantity REAL NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL CHECK (unit IN ('kg', 'gr', 'l', 'ml', 'unidad')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(menu_item_id, raw_material_id)
  )
`).run();

// Índices para menu_item_recipes
db.prepare(`CREATE INDEX IF NOT EXISTS idx_menu_item_recipes_menu ON menu_item_recipes(menu_item_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_menu_item_recipes_material ON menu_item_recipes(raw_material_id)`).run();

// Tabla de historial de movimientos de stock
db.prepare(`
  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_material_id INTEGER NOT NULL REFERENCES raw_materials(id),
    quantity REAL NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('add', 'deduct', 'adjustment')),
    reference_type TEXT, -- 'order', 'manual', etc.
    reference_id INTEGER, -- order_id si aplica
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_movements_material ON stock_movements(raw_material_id)`).run();


// Tabla de Inventario de Stock (separada de materias primas)
db.prepare(`
  CREATE TABLE IF NOT EXISTS stock_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_material_id INTEGER NOT NULL UNIQUE REFERENCES raw_materials(id),
    quantity REAL DEFAULT 0,
    min_stock REAL DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_inventory_material ON stock_inventory(raw_material_id)`).run();

// Migración: Mover datos de stock de raw_materials a stock_inventory
try {
  // Verificar si hay datos en raw_materials que no están en stock_inventory
  const rowsToMigrate = db.prepare(`
    SELECT id, stock_quantity, min_stock 
    FROM raw_materials 
    WHERE (stock_quantity > 0 OR min_stock > 0)
    AND id NOT IN (SELECT raw_material_id FROM stock_inventory)
  `).all() as Array<{ id: number, stock_quantity: number, min_stock: number }>;

  if (rowsToMigrate.length > 0) {
    console.log(`Migrating ${rowsToMigrate.length} items to stock_inventory...`);
    const insert = db.prepare(`
      INSERT INTO stock_inventory (raw_material_id, quantity, min_stock) 
      VALUES (?, ?, ?)
    `);

    db.transaction(() => {
      for (const row of rowsToMigrate) {
        insert.run(row.id, row.stock_quantity || 0, row.min_stock || 0);
      }
    })();
    console.log("Migration completed.");
  }
} catch (error) {
  console.error("Error migrating stock inventory:", error);
}

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

export default db;

