import db from "../db.ts";

// ============================================
// Interfaces
// ============================================

export interface IStockItem {
    id: number;
    name: string;
    purchase_unit: string;
    stock_quantity: number;
    min_stock: number;
    status: "normal" | "low";
    supplier_name?: string;
}

export interface IMenuItemIngredient {
    id?: number;
    menu_item_id: number;
    raw_material_id: number;
    quantity: number;
    unit: string;
    raw_material_name?: string;
}

export interface IStockValidationResult {
    valid: boolean;
    insufficientItems: Array<{
        raw_material_id: number;
        name: string;
        required: number;
        available: number;
        unit: string;
    }>;
}

// ============================================
// Conversión de unidades
// ============================================
function convertToBaseUnit(quantity: number, unit: string): number {
    const conversions: Record<string, number> = {
        kg: 1000, // 1 kg = 1000 gr
        gr: 1, // base
        l: 1000, // 1 l = 1000 ml
        ml: 1, // base
        unidad: 1, // base
    };
    return quantity * (conversions[unit] || 1);
}

function getBaseUnit(unit: string): string {
    if (unit === "kg" || unit === "gr") return "gr";
    if (unit === "l" || unit === "ml") return "ml";
    return "unidad";
}

// ============================================
// Stock Model
// ============================================

class StockModel {
    /**
     * Crea un nuevo item de stock
     */
    public createStockItem(
        name: string,
        purchase_unit: string,
        min_stock: number = 0
    ): number | null {
        try {
            const stmt = db.prepare(`
                INSERT INTO raw_materials (name, purchase_unit, min_stock, stock_quantity, active)
                VALUES (?, ?, ?, 0, 1)
            `);
            const info = stmt.run(name, purchase_unit, min_stock);
            return info.lastInsertRowid as number;
        } catch (error) {
            console.error("Error creating stock item:", error);
            return null;
        }
    }

    /**
     * Obtiene todos los insumos con su stock actual
     */
    public getAllStock(): IStockItem[] {
        const query = `
      SELECT 
        rm.id,
        rm.name,
        rm.purchase_unit,
        COALESCE(rm.stock_quantity, 0) as stock_quantity,
        COALESCE(rm.min_stock, 0) as min_stock,
        s.name as supplier_name
      FROM raw_materials rm
      LEFT JOIN suppliers s ON rm.supplier_id = s.id
      WHERE rm.active = 1
      ORDER BY rm.name
    `;

        const items = db.prepare(query).all() as Array<{
            id: number;
            name: string;
            purchase_unit: string;
            stock_quantity: number;
            min_stock: number;
            supplier_name?: string;
        }>;

        return items.map((item) => ({
            ...item,
            status:
                item.stock_quantity <= item.min_stock
                    ? ("low" as const)
                    : ("normal" as const),
        }));
    }

    /**
     * Obtiene un insumo por ID con su stock
     */
    public getStockById(id: number): IStockItem | undefined {
        const query = `
      SELECT 
        rm.id,
        rm.name,
        rm.purchase_unit,
        COALESCE(rm.stock_quantity, 0) as stock_quantity,
        COALESCE(rm.min_stock, 0) as min_stock,
        s.name as supplier_name
      FROM raw_materials rm
      LEFT JOIN suppliers s ON rm.supplier_id = s.id
      WHERE rm.id = ?
    `;

        const item = db.prepare(query).get(id) as
            | {
                id: number;
                name: string;
                purchase_unit: string;
                stock_quantity: number;
                min_stock: number;
                supplier_name?: string;
            }
            | undefined;

        if (!item) return undefined;

        return {
            ...item,
            status: item.stock_quantity <= item.min_stock ? "low" : "normal",
        };
    }

    /**
     * Actualiza el stock de un insumo
     */
    public updateStock(
        rawMaterialId: number,
        stockQuantity: number,
        minStock?: number
    ): boolean {
        const updates: string[] = ["stock_quantity = ?"];
        const values: any[] = [stockQuantity];

        if (minStock !== undefined) {
            updates.push("min_stock = ?");
            values.push(minStock);
        }

        values.push(rawMaterialId);

        const query = `UPDATE raw_materials SET ${updates.join(", ")} WHERE id = ?`;
        const result = db.prepare(query).run(...values);
        return result.changes > 0;
    }

    /**
     * Agrega stock a un insumo
     */
    public addStock(
        rawMaterialId: number,
        quantity: number,
        notes?: string
    ): boolean {
        return db.transaction(() => {
            // Actualizar stock
            db.prepare(
                `
        UPDATE raw_materials 
        SET stock_quantity = COALESCE(stock_quantity, 0) + ? 
        WHERE id = ?
      `
            ).run(quantity, rawMaterialId);

            // Registrar movimiento
            db.prepare(
                `
        INSERT INTO stock_movements (raw_material_id, quantity, movement_type, reference_type, notes)
        VALUES (?, ?, 'add', 'manual', ?)
      `
            ).run(rawMaterialId, quantity, notes || null);

            return true;
        })();
    }

    /**
     * Obtiene los ingredientes definidos para un item del menú
     */
    public getMenuItemIngredients(menuItemId: number): IMenuItemIngredient[] {
        const query = `
      SELECT 
        mir.id,
        mir.menu_item_id,
        mir.raw_material_id,
        mir.quantity,
        mir.unit,
        rm.name as raw_material_name
      FROM menu_item_recipes mir
      JOIN raw_materials rm ON mir.raw_material_id = rm.id
      WHERE mir.menu_item_id = ?
    `;

        return db.prepare(query).all(menuItemId) as IMenuItemIngredient[];
    }

    /**
     * Define o actualiza los ingredientes de un item del menú
     */
    public setMenuItemIngredients(
        menuItemId: number,
        ingredients: Array<{ raw_material_id: number; quantity: number; unit: string }>
    ): void {
        db.transaction(() => {
            // Eliminar ingredientes existentes
            db.prepare("DELETE FROM menu_item_recipes WHERE menu_item_id = ?").run(
                menuItemId
            );

            // Insertar nuevos ingredientes
            const insertStmt = db.prepare(`
        INSERT INTO menu_item_recipes (menu_item_id, raw_material_id, quantity, unit)
        VALUES (?, ?, ?, ?)
      `);

            for (const ing of ingredients) {
                insertStmt.run(menuItemId, ing.raw_material_id, ing.quantity, ing.unit);
            }
        })();
    }

    /**
     * Obtiene todos los items del menú con sus ingredientes
     */
    public getAllMenuItemRecipes(): Array<{
        menu_item_id: number;
        menu_item_name: string;
        ingredients: IMenuItemIngredient[];
    }> {
        // Obtener todos los menu items que tienen receta
        const menuItems = db
            .prepare(
                `
      SELECT DISTINCT mi.id as menu_item_id, mi.name as menu_item_name
      FROM menu_items mi
      INNER JOIN menu_item_recipes mir ON mi.id = mir.menu_item_id
      ORDER BY mi.name
    `
            )
            .all() as Array<{ menu_item_id: number; menu_item_name: string }>;

        return menuItems.map((item) => ({
            ...item,
            ingredients: this.getMenuItemIngredients(item.menu_item_id),
        }));
    }

    /**
     * Calcula el total de insumos requeridos para una orden
     */
    private calculateRequiredStock(
        orderItems: Array<{ menu_item_id: number; quantity: number }>
    ): Map<number, { quantity: number; unit: string; name: string }> {
        const required = new Map<
            number,
            { quantity: number; unit: string; name: string }
        >();

        for (const orderItem of orderItems) {
            const ingredients = this.getMenuItemIngredients(orderItem.menu_item_id);

            for (const ing of ingredients) {
                const current = required.get(ing.raw_material_id);
                const ingQuantity = ing.quantity * orderItem.quantity;

                if (current) {
                    // Convertir a unidad base para sumar
                    const currentBase = convertToBaseUnit(current.quantity, current.unit);
                    const newBase = convertToBaseUnit(ingQuantity, ing.unit);
                    const totalBase = currentBase + newBase;

                    required.set(ing.raw_material_id, {
                        quantity: totalBase,
                        unit: getBaseUnit(ing.unit),
                        name: ing.raw_material_name || "",
                    });
                } else {
                    required.set(ing.raw_material_id, {
                        quantity: convertToBaseUnit(ingQuantity, ing.unit),
                        unit: getBaseUnit(ing.unit),
                        name: ing.raw_material_name || "",
                    });
                }
            }
        }

        return required;
    }

    /**
     * Valida si hay stock suficiente para una orden
     */
    public validateStockForOrder(
        orderItems: Array<{ menu_item_id: number; quantity: number }>
    ): IStockValidationResult {
        const required = this.calculateRequiredStock(orderItems);
        const insufficientItems: IStockValidationResult["insufficientItems"] = [];

        for (const [rawMaterialId, req] of required) {
            const stock = this.getStockById(rawMaterialId);
            if (!stock) continue;

            // Convertir stock a la misma unidad base
            const stockInBase = convertToBaseUnit(
                stock.stock_quantity,
                stock.purchase_unit
            );

            if (stockInBase < req.quantity) {
                insufficientItems.push({
                    raw_material_id: rawMaterialId,
                    name: req.name || stock.name,
                    required: req.quantity,
                    available: stockInBase,
                    unit: req.unit,
                });
            }
        }

        return {
            valid: insufficientItems.length === 0,
            insufficientItems,
        };
    }

    /**
     * Descuenta stock para una orden
     */
    public deductStockForOrder(
        orderId: number,
        orderItems: Array<{ menu_item_id: number; quantity: number }>
    ): void {
        const required = this.calculateRequiredStock(orderItems);

        db.transaction(() => {
            for (const [rawMaterialId, req] of required) {
                const stock = this.getStockById(rawMaterialId);
                if (!stock) continue;

                // Convertir cantidad requerida a la unidad de compra del stock
                const stockUnit = stock.purchase_unit;
                const stockUnitBase = convertToBaseUnit(1, stockUnit);
                const quantityInStockUnit = req.quantity / stockUnitBase;

                // Descontar
                db.prepare(
                    `
          UPDATE raw_materials 
          SET stock_quantity = stock_quantity - ?
          WHERE id = ?
        `
                ).run(quantityInStockUnit, rawMaterialId);

                // Registrar movimiento
                db.prepare(
                    `
          INSERT INTO stock_movements (raw_material_id, quantity, movement_type, reference_type, reference_id)
          VALUES (?, ?, 'deduct', 'order', ?)
        `
                ).run(rawMaterialId, quantityInStockUnit, orderId);
            }
        })();
    }

    /**
     * Obtiene los items con bajo stock
     */
    public getLowStockItems(): IStockItem[] {
        return this.getAllStock().filter((item) => item.status === "low");
    }
}

export default new StockModel();
