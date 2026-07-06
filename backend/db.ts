import Database from "better-sqlite3";
import { initializeSyncDatabase } from "./sync/migrations.ts";

const db: any = new Database("app.db");

// Tabla de cafés (usada por calibraciones)
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS coffees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    benefit TEXT NOT NULL,
    origin TEXT
  )
`,
).run();

// Tabla de categorías del menú
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS menu_category (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`,
).run();

// Tabla de items del menú (carta)
db.prepare(
  `
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
`,
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
  `,
).run();

// Tabla de métodos de pago
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`,
).run();

// Tabla principal de órdenes
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number INTEGER,
    shift TEXT CHECK (shift IN ('morning','afternoon')) NOT NULL,
    status TEXT CHECK (status IN ('open','debt','paid','cancelled')) DEFAULT 'open',
    discount_percentage REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    payment_method_id INTEGER REFERENCES payment_methods(id),
    customer_id INTEGER REFERENCES customers(id),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`,
).run();

try {
  const paymentMethodCols = db.prepare("PRAGMA table_info(payment_methods)").all() as Array<{ name: string }>;
  if (!paymentMethodCols.some(col => col.name === "code")) {
    db.prepare("ALTER TABLE payment_methods ADD COLUMN code TEXT").run();
    console.log("Added 'code' column to payment_methods table");
  }
} catch (error) {
  console.log("Migration note (payment_methods.code):", error);
}

db.prepare(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    phone TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
  )
`).run();

try {
  const orderCols = db.prepare("PRAGMA table_info(orders)").all() as Array<{ name: string }>;
  if (!orderCols.some(col => col.name === "customer_id")) {
    db.prepare("ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id)").run();
    console.log("Added 'customer_id' column to orders table");
  }
} catch (error) {
  console.log("Migration note (orders.customer_id):", error);
}

try {
  const table = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'orders'")
    .get() as { sql?: string } | undefined;

  if (table?.sql && !table.sql.includes("'debt'")) {
    const hasOrderItems = Boolean(
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'order_items'").get(),
    );
    const hasStockMovements = Boolean(
      db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'stock_movements'").get(),
    );

    db.prepare("PRAGMA foreign_keys = OFF").run();
    db.transaction(() => {
      if (hasOrderItems) {
        db.prepare("ALTER TABLE order_items RENAME TO order_items_old_debt_migration").run();
      }
      if (hasStockMovements) {
        db.prepare("ALTER TABLE stock_movements RENAME TO stock_movements_old_debt_migration").run();
      }

      db.prepare("ALTER TABLE orders RENAME TO orders_old_debt_migration").run();
      db.prepare(`
        CREATE TABLE orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_number INTEGER,
          shift TEXT CHECK (shift IN ('morning','afternoon')) NOT NULL,
          status TEXT CHECK (status IN ('open','debt','paid','cancelled')) DEFAULT 'open',
          discount_percentage REAL DEFAULT 0,
          total_amount REAL NOT NULL,
          payment_method_id INTEGER REFERENCES payment_methods(id),
          customer_id INTEGER REFERENCES customers(id),
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      db.prepare(`
        INSERT INTO orders (
          id, table_number, shift, status, discount_percentage,
          total_amount, payment_method_id, customer_id, notes, created_at
        )
        SELECT
          id, table_number, shift, status, discount_percentage,
          total_amount, payment_method_id, customer_id, notes, created_at
        FROM orders_old_debt_migration
      `).run();

      if (hasOrderItems) {
        db.prepare(`
          CREATE TABLE order_items (
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
        db.prepare(`
          INSERT INTO order_items (
            id, order_id, menu_item_id, quantity, unit_price, subtotal, created_at
          )
          SELECT id, order_id, menu_item_id, quantity, unit_price, subtotal, created_at
          FROM order_items_old_debt_migration
        `).run();
        db.prepare("DROP TABLE order_items_old_debt_migration").run();
      }

      if (hasStockMovements) {
        db.prepare(`
          CREATE TABLE stock_movements (
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
        db.prepare(`
          INSERT INTO stock_movements (
            id, stock_product_id, quantity_change, previous_stock,
            new_stock, reason, order_id, created_at
          )
          SELECT
            id, stock_product_id, quantity_change, previous_stock,
            new_stock, reason, order_id, created_at
          FROM stock_movements_old_debt_migration
        `).run();
        db.prepare("DROP TABLE stock_movements_old_debt_migration").run();
      }

      db.prepare("DROP TABLE orders_old_debt_migration").run();
    })();
    db.prepare("PRAGMA foreign_keys = ON").run();
    console.log("Updated orders.status check to include debt");
  }
} catch (error) {
  try {
    db.prepare("PRAGMA foreign_keys = ON").run();
  } catch {}
  console.log("Migration note (orders.status debt):", error);
}

db.prepare(`
  CREATE TABLE IF NOT EXISTS customer_account_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    payment_method_id INTEGER REFERENCES payment_methods(id),
    amount_paid REAL NOT NULL,
    discount_amount REAL NOT NULL DEFAULT 0,
    discount_percentage REAL NOT NULL DEFAULT 0,
    payment_date TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_customer_account_payments_customer ON customer_account_payments(customer_id)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_customer_account_payments_date ON customer_account_payments(payment_date)`).run();

// Tabla de items de la orden (productos en la orden)
db.prepare(
  `
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
`,
).run();

// Insertar métodos de pago básicos
db.prepare(
  `
  INSERT OR IGNORE INTO payment_methods (name)
  VALUES
    ('Efectivo'),
    ('Tarjeta de débito'),
    ('Tarjeta de crédito'),
    ('Transferencia'),
    ('QR')
`,
).run();

db.prepare(`
  INSERT OR IGNORE INTO payment_methods (name, code)
  VALUES ('Cuenta corriente', 'account')
`).run();

db.prepare(`
  UPDATE payment_methods
  SET code = CASE
    WHEN name = 'Efectivo' THEN 'cash'
    WHEN name = 'Transferencia' THEN 'transfer'
    WHEN name = 'QR' OR name = 'CÃ³digo QR' OR name = 'Código QR' THEN 'qr_code'
    WHEN name = 'Cuenta corriente' THEN 'account'
    WHEN name LIKE '%Tarjeta%' OR name LIKE '%DÃ©bito%' OR name LIKE '%Débito%' OR name LIKE '%Credito%' OR name LIKE '%CrÃ©dito%' OR name LIKE '%Crédito%' THEN 'card'
    ELSE code
  END
  WHERE code IS NULL OR code = ''
`).run();

// ============================================
// MÓDULO COST-ENGINE - Esquema de Base de Datos
// ============================================

// Tabla de Proveedores
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    contact_info TEXT,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`,
).run();

// Migración: Agregar columnas faltantes si la tabla ya existe
try {
  const tableInfo = db.prepare("PRAGMA table_info(suppliers)").all() as Array<{
    name: string;
    dflt_value: string | null;
  }>;
  const hasActive = tableInfo.some((col) => col.name === "active");
  const hasContactInfo = tableInfo.some((col) => col.name === "contact_info");
  const hasCreatedAt = tableInfo.some((col) => col.name === "created_at");

  if (!hasActive) {
    db.prepare(
      "ALTER TABLE suppliers ADD COLUMN active INTEGER DEFAULT 1",
    ).run();
    console.log("✓ Added 'active' column to suppliers table");
  }
  if (!hasContactInfo) {
    db.prepare("ALTER TABLE suppliers ADD COLUMN contact_info TEXT").run();
    if (tableInfo.some((col) => col.name === "phone")) {
      db.prepare(
        "UPDATE suppliers SET contact_info = phone WHERE contact_info IS NULL",
      ).run();
      console.log("✓ Migrated 'phone' to 'contact_info' in suppliers table");
    }
    console.log("✓ Added 'contact_info' column to suppliers table");
  }
  if (!hasCreatedAt) {
    db.prepare("ALTER TABLE suppliers ADD COLUMN created_at TEXT").run();
    db.prepare(
      "UPDATE suppliers SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL",
    ).run();
    console.log("✓ Added 'created_at' column to suppliers table");
  }
} catch (error) {
  console.log("Migration note:", error);
}

// Tabla de Materias Primas
db.prepare(
  `
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
`,
).run();

// Migration: link menu items with cost-engine recipes
try {
  const menuItemCols = db
    .prepare("PRAGMA table_info(menu_items)")
    .all() as Array<{ name: string }>;
  if (!menuItemCols.some((col) => col.name === "recipe_id")) {
    db.prepare("ALTER TABLE menu_items ADD COLUMN recipe_id INTEGER").run();
    console.log("Added 'recipe_id' column to menu_items table");
  }
} catch (error) {
  console.log("Migration note (menu_items.recipe_id):", error);
}

// Migration: normalize existing unit_cost values to purchase unit cost
// (price / quantity in purchase_unit) to avoid legacy gr/ml costs shown as kg/l.
try {
  const updated = db
    .prepare(
      `
    UPDATE raw_materials
    SET
      unit_cost = ROUND(purchase_price / purchase_quantity, 6),
      last_price_update = CURRENT_TIMESTAMP
    WHERE purchase_quantity > 0
      AND ABS(unit_cost - (purchase_price / purchase_quantity)) > 0.000001
  `,
    )
    .run();

  if (updated.changes > 0) {
    console.log(`Fixed unit_cost for ${updated.changes} raw materials`);
  }
} catch (error) {
  console.log("Migration note (raw_materials unit_cost normalization):", error);
}

// Tabla de Recetas
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    recipe_cost REAL DEFAULT 0, -- Calculado automáticamente
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`,
).run();

// Tabla de Ingredientes de Recetas (relación many-to-many)
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    raw_material_id INTEGER NOT NULL REFERENCES raw_materials(id),
    quantity REAL NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL CHECK (unit IN ('kg', 'gr', 'l', 'ml', 'unidad')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recipe_id, raw_material_id)
  )
`,
).run();

// Tabla de Productos Finales (productos de carta)
db.prepare(
  `
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
`,
).run();

// Tabla de Gastos Fijos Globales
db.prepare(
  `
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
`,
).run();

// Tabla de Historial de Precios (para tracking de cambios)
db.prepare(
  `
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
`,
).run();

// Índices para mejorar performance
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_raw_materials_supplier ON raw_materials(supplier_id)`,
).run();
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id)`,
).run();
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_material ON recipe_ingredients(raw_material_id)`,
).run();
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_cost_products_recipe ON cost_products(recipe_id)`,
).run();
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id)`,
).run();
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_price_history_material ON price_history(raw_material_id)`,
).run();

// ============================================
// MÓDULO REPORTES - Tabla de gastos para reportes
// ============================================
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS report_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('servicios', 'proveedores', 'supermercado', 'otros')),
    description TEXT DEFAULT '',
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`,
).run();

db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_report_expenses_date ON report_expenses(date)`,
).run();
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_report_expenses_category ON report_expenses(category)`,
).run();

// ============================================
// MÓDULO STOCK - Control de Stock
// ============================================

// Migration: drop old stock tables that used raw_material_id (incompatible schema)
try {
  const stockMovCols = db
    .prepare("PRAGMA table_info(stock_movements)")
    .all() as Array<{ name: string }>;
  if (stockMovCols.some((col) => col.name === "raw_material_id")) {
    console.log("⚠ Detected old stock schema, migrating…");
    db.prepare("DROP TABLE IF EXISTS stock_movements").run();
    db.prepare("DROP TABLE IF EXISTS stock_inventory").run();
    console.log(
      "✓ Dropped legacy stock tables (stock_movements, stock_inventory)",
    );
  }
} catch {
  // Tables don't exist yet — nothing to migrate
}

// Productos de stock (ej: "Medialunas Dulces", "Croissants")
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS stock_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    current_stock INTEGER NOT NULL DEFAULT 0,
    alert_threshold INTEGER NOT NULL DEFAULT 5,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`,
).run();

// Mapeo stock ↔ ítems del menú (many-to-many)
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS stock_menu_item_map (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_product_id INTEGER NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_product_id, menu_item_id)
  )
`,
).run();

// Historial de movimientos de stock
db.prepare(
  `
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
`,
).run();

db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_stock_menu_map_product ON stock_menu_item_map(stock_product_id)`,
).run();
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_stock_menu_map_item ON stock_menu_item_map(menu_item_id)`,
).run();


// Productos controlados en la vitrina al abrir/cerrar caja.
// Independiente del módulo stock_products: esto representa productos horneados/listos.
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS cash_register_stock_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL UNIQUE,
    unit_step REAL NOT NULL DEFAULT 1,
    show_on_open INTEGER NOT NULL DEFAULT 1,
    show_on_close INTEGER NOT NULL DEFAULT 1,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS cash_register_stock_item_menu_map (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vitrine_stock_item_id INTEGER NOT NULL REFERENCES cash_register_stock_items(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vitrine_stock_item_id, menu_item_id)
  )
`,
).run();

db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_vitrine_stock_map_item ON cash_register_stock_item_menu_map(menu_item_id)`,
).run();
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_vitrine_stock_map_vitrine ON cash_register_stock_item_menu_map(vitrine_stock_item_id)`,
).run();

try {
  const vitrineMapColumns = db
    .prepare("PRAGMA table_info(cash_register_stock_item_menu_map)")
    .all() as Array<{ name: string }>;
  const hasQuantityPerItem = vitrineMapColumns.some(
    (column) => column.name === "quantity_per_item",
  );
  if (!hasQuantityPerItem) {
    db.prepare(
      `ALTER TABLE cash_register_stock_item_menu_map
       ADD COLUMN quantity_per_item REAL NOT NULL DEFAULT 1`,
    ).run();
    console.log("Added 'quantity_per_item' column to cash_register_stock_item_menu_map");
  }
} catch (error) {
  console.log("Migration note (cash_register_stock_item_menu_map.quantity_per_item):", error);
}

const vitrineSeedCount = db
  .prepare(`SELECT COUNT(*) as count FROM cash_register_stock_items`)
  .get() as { count: number };

if (vitrineSeedCount.count === 0) {
  const defaults = [
    ["Medialunas", 1, 10],
    ["Croissant", 1, 20],
    ["Pan de chocolate", 1, 30],
    ["Pan de Molde", 0.5, 40],
    ["Roll de Canela", 1, 50],
    ["Scon de queso", 1, 60],
  ] as const;

  const insertVitrineItem = db.prepare(
    `INSERT INTO cash_register_stock_items (label, unit_step, sort_order)
     VALUES (?, ?, ?)`,
  );

  for (const [label, unitStep, sortOrder] of defaults) {
    insertVitrineItem.run(label, unitStep, sortOrder);
  }
}
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(stock_product_id)`,
).run();
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_stock_movements_order ON stock_movements(order_id)`,
).run();

// ============================================
// CASH REGISTER - Opening and Closing Shifts
// ============================================

// Migration: drop old Spanish-named table if it exists
try {
  const cajaOld = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='caja_turnos'",
    )
    .get();
  if (cajaOld) {
    db.prepare("DROP TABLE caja_turnos").run();
    console.log(
      "✓ Dropped legacy caja_turnos table (migrated to cash_register_shifts)",
    );
  }
} catch {
  /* table doesn't exist */
}

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS cash_register_shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift TEXT NOT NULL CHECK (shift IN ('morning', 'afternoon')),
    date TEXT NOT NULL,
    opened_by TEXT DEFAULT '',
    closed_by TEXT DEFAULT '',
    opened_at TEXT NOT NULL,
    closed_at TEXT,
    cash_start REAL NOT NULL DEFAULT 0,
    cash_end REAL,
    bank_start REAL NOT NULL DEFAULT 0,
    bank_end REAL,
    stock_start TEXT NOT NULL DEFAULT '{}',
    stock_system TEXT,
    stock_end_actual TEXT,
    total_sales REAL DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`,
).run();

db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_cash_register_shifts_date ON cash_register_shifts(date)`,
).run();
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_cash_register_shifts_status ON cash_register_shifts(status)`,
).run();

// ============================================
// MÓDULO SERVICIOS - Fixed monthly services
// ============================================

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    monthly_amount REAL NOT NULL DEFAULT 0,
    due_day INTEGER NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 31),
    category TEXT NOT NULL DEFAULT 'general',
    icon TEXT NOT NULL DEFAULT 'bolt',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS service_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    amount_paid REAL NOT NULL,
    payment_date TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id, month, year)
  )
`,
).run();

db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_service_payments_service ON service_payments(service_id)`,
).run();
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_service_payments_period ON service_payments(month, year)`,
).run();

// Migration: add service_payment_id column to report_expenses for linking service payments to expenses
try {
  const cols = db.prepare("PRAGMA table_info(report_expenses)").all() as Array<{
    name: string;
  }>;
  if (!cols.some((col) => col.name === "service_payment_id")) {
    db.prepare(
      "ALTER TABLE report_expenses ADD COLUMN service_payment_id INTEGER REFERENCES service_payments(id)",
    ).run();
    console.log("✓ Added 'service_payment_id' column to report_expenses table");
  }
} catch (error) {
  console.log("Migration note (service_payment_id):", error);
}

// ============================================
// MÓDULO CUOTAS - Fixed monthly installments
// ============================================

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    monthly_amount REAL NOT NULL DEFAULT 0,
    due_day INTEGER NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 31),
    total_months INTEGER NOT NULL CHECK (total_months > 0),
    start_month INTEGER NOT NULL CHECK (start_month BETWEEN 1 AND 12),
    start_year INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'cuotas',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS installment_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    installment_id INTEGER NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    installment_number INTEGER NOT NULL,
    amount_paid REAL NOT NULL,
    payment_date TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(installment_id, month, year)
  )
`,
).run();

db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_installment_payments_installment ON installment_payments(installment_id)`,
).run();
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_installment_payments_period ON installment_payments(month, year)`,
).run();

try {
  const cols = db.prepare("PRAGMA table_info(report_expenses)").all() as Array<{
    name: string;
  }>;
  if (!cols.some((col) => col.name === "installment_payment_id")) {
    db.prepare(
      "ALTER TABLE report_expenses ADD COLUMN installment_payment_id INTEGER REFERENCES installment_payments(id)",
    ).run();
    console.log(
      "✓ Added 'installment_payment_id' column to report_expenses table",
    );
  }
} catch (error) {
  console.log("Migration note (installment_payment_id):", error);
}

// Migration: allow generated installment expenses to be grouped as "cuotas".
try {
  const table = db
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'report_expenses'",
    )
    .get() as { sql?: string } | undefined;

  if (table?.sql && !table.sql.includes("'cuotas'")) {
    db.transaction(() => {
      db.prepare(
        "ALTER TABLE report_expenses RENAME TO report_expenses_old",
      ).run();
      db.prepare(
        `
        CREATE TABLE report_expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('servicios', 'proveedores', 'supermercado', 'empleados', 'personales', 'sueldos_falco', 'cuotas', 'otros')),
          description TEXT DEFAULT '',
          date TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          service_payment_id INTEGER REFERENCES service_payments(id),
          installment_payment_id INTEGER REFERENCES installment_payments(id)
        )
      `,
      ).run();
      db.prepare(
        `
        INSERT INTO report_expenses (
          id, amount, category, description, date, created_at, service_payment_id, installment_payment_id
        )
        SELECT
          id, amount, category, description, date, created_at, service_payment_id, installment_payment_id
        FROM report_expenses_old
      `,
      ).run();
      db.prepare("DROP TABLE report_expenses_old").run();
      db.prepare(
        `CREATE INDEX IF NOT EXISTS idx_report_expenses_date ON report_expenses(date)`,
      ).run();
      db.prepare(
        `CREATE INDEX IF NOT EXISTS idx_report_expenses_category ON report_expenses(category)`,
      ).run();
    })();
    console.log("✓ Updated report_expenses categories to include installments");
  }
} catch (error) {
  console.log("Migration note (report_expenses categories):", error);
}

// Seed default services
db.prepare(
  `
  INSERT OR IGNORE INTO services (name, monthly_amount, due_day, category, icon) VALUES
    ('Internet', 0, 10, 'connectivity', 'wifi'),
    ('Alquiler', 0, 5, 'rent', 'home'),
    ('DREI', 0, 15, 'tax', 'receipt'),
    ('Contadora', 0, 1, 'professional', 'user'),
    ('Luz', 0, 15, 'utility', 'bolt')
`,
).run();


// Legacy cleanup: hide the old ghost service "API" if it has no real amount/history.
db.prepare(
  `UPDATE services
   SET active = 0, updated_at = CURRENT_TIMESTAMP
   WHERE name = 'API'
     AND monthly_amount = 0
     AND NOT EXISTS (
       SELECT 1 FROM service_payments sp WHERE sp.service_id = services.id
     )`,
).run();

// Sync infrastructure is initialized after all legacy tables exist. Its migrations are
// additive and never make connectivity a requirement for local operations.
initializeSyncDatabase(db);

/**
 * Returns the current timestamp in Buenos Aires timezone (America/Argentina/Buenos_Aires).
 * Format: "YYYY-MM-DD HH:MM:SS" which SQLite DATE() can parse correctly.
 */
export function getLocalTimestamp(): string {
  return new Date().toLocaleString("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export default db;
