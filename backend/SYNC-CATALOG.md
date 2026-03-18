# Sync Catalog — Sincronizar datos de catálogo a producción

Script para exportar datos de catálogo (carta, proveedores, costos, recetas, etc.) desde tu BD local y aplicarlos en la BD de producción del local.

## Tablas que sincroniza

| Tabla | Contenido |
|---|---|
| `menu_category` | Categorías del menú |
| `menu_items` | Items de la carta |
| `payment_methods` | Métodos de pago |
| `suppliers` | Proveedores |
| `raw_materials` | Materias primas |
| `recipes` | Recetas |
| `recipe_ingredients` | Ingredientes de recetas |
| `cost_products` | Productos con costeo |
| `fixed_costs` | Costos fijos |
| `stock_products` | Productos de stock (panadería) |
| `stock_menu_item_map` | Mapeo stock ↔ menú |
| `services` | Servicios mensuales |
| `coffees` | Cafés (calibraciones) |

**NO toca:** `orders`, `order_items`, `cash_register_shifts`, `report_expenses`, `stock_movements`, `calibrations`, `service_payments`, `price_history`.

## Uso

### 1. Hacer cambios en la BD local

Usar la app normalmente para agregar/editar carta, proveedores, recetas, costos, etc.

### 2. Generar el archivo SQL

```bash
cd backend
npx tsx sync-catalog.ts
```

Genera un archivo `catalog-sync-YYYY-MM-DD.sql` en la carpeta `backend/`.

### 3. Llevar el archivo al local

Vía USB, WhatsApp, mail, o cualquier medio.

### 4. Aplicar en producción

```bash
cd backend
cp app.db app.db.backup
sqlite3 app.db < catalog-sync-YYYY-MM-DD.sql
```

> **Importante:** Siempre hacer backup (`cp app.db app.db.backup`) antes de aplicar.
