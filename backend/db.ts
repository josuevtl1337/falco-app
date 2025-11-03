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


export default db;
