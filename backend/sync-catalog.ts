/**
 * sync-catalog.ts
 *
 * Exports catalog/configuration data from the local app.db into a .sql file.
 * This file can then be run against the production database to sync changes.
 *
 * Usage:
 *   cd backend && npx tsx sync-catalog.ts
 *
 * Output:
 *   catalog-sync-YYYY-MM-DD.sql
 *
 * SAFE: Only touches catalog tables. Does NOT touch orders, cash_register_shifts,
 *       report_expenses, order_items, stock_movements, calibrations, service_payments, or price_history.
 */

import Database from "better-sqlite3";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, "app.db"), { readonly: true });

// Tables in dependency order (parents before children)
const CATALOG_TABLES = [
  "menu_category",
  "menu_items",
  "payment_methods",
  "suppliers",
  "raw_materials",
  "recipes",
  "recipe_ingredients",
  "cost_products",
  "fixed_costs",
  "stock_products",
  "stock_menu_item_map",
  "services",
  "coffees",
];

function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  // Escape single quotes by doubling them
  return `'${String(val).replace(/'/g, "''")}'`;
}

function exportTable(tableName: string): string {
  const rows = db.prepare(`SELECT * FROM ${tableName}`).all() as Record<string, unknown>[];

  if (rows.length === 0) return `-- ${tableName}: no data\n`;

  const columns = Object.keys(rows[0]);
  const lines: string[] = [];

  lines.push(`-- =====================`);
  lines.push(`-- ${tableName} (${rows.length} rows)`);
  lines.push(`-- =====================`);
  lines.push(`DELETE FROM ${tableName};`);

  for (const row of rows) {
    const values = columns.map((col) => escapeValue(row[col])).join(", ");
    lines.push(`INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values});`);
  }

  lines.push("");
  return lines.join("\n");
}

// Build the SQL file
const parts: string[] = [];
const now = new Date().toLocaleString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });

parts.push(`-- Falco Catalog Sync`);
parts.push(`-- Generated: ${now}`);
parts.push(`-- WARNING: This will REPLACE all catalog data. Back up your DB first!`);
parts.push(``);
parts.push(`PRAGMA foreign_keys = OFF;`);
parts.push(`BEGIN TRANSACTION;`);
parts.push(``);

// Delete in reverse order (children first) to respect foreign keys
const reverseTables = [...CATALOG_TABLES].reverse();
for (const table of reverseTables) {
  parts.push(`DELETE FROM ${table};`);
}
parts.push(``);

// Insert in forward order (parents first)
for (const table of CATALOG_TABLES) {
  try {
    const rows = db.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];
    if (rows.length === 0) {
      parts.push(`-- ${table}: no data`);
      parts.push(``);
      continue;
    }

    const columns = Object.keys(rows[0]);
    parts.push(`-- ${table} (${rows.length} rows)`);

    for (const row of rows) {
      const values = columns.map((col) => escapeValue(row[col])).join(", ");
      parts.push(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values});`);
    }
    parts.push(``);
  } catch (err: any) {
    parts.push(`-- ${table}: SKIPPED (${err.message})`);
    parts.push(``);
  }
}

parts.push(`COMMIT;`);
parts.push(`PRAGMA foreign_keys = ON;`);

const dateStr = now.split(" ")[0];
const outputFile = join(__dirname, `catalog-sync-${dateStr}.sql`);
writeFileSync(outputFile, parts.join("\n"), "utf-8");

db.close();

console.log(`✓ Exported ${CATALOG_TABLES.length} catalog tables to: ${outputFile}`);
console.log(`\nTo apply on the production machine:`);
console.log(`  1. Copy the .sql file to the machine`);
console.log(`  2. Back up the production app.db first!`);
console.log(`  3. Run: cd backend && sqlite3 app.db < catalog-sync-${dateStr}.sql`);
