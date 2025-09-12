
// import { db } from "../db.js";
import db  from "../db.ts"; 
import type { IExpense } from './../../src/modules/budget/types/types.ts';

class ExpensesModels {

    public async getAllExpenses()  {
        const data = db.prepare("SELECT * FROM expenses").all();
        return data;
    }

    public async addNewExpense(expense: IExpense) {
        const { name, description, units, amount, currency, payment_type, document, date } = expense;
        const created_at = new Date().toISOString();
        const data = db.prepare(`
        INSERT INTO expenses (name, description, units, amount, currency, payment_type, document, date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(name, description, units, amount, currency, payment_type, document, date, created_at);

        return data;
    }

    public async getTotalBudget () {
        // Presupuesto inicial
        const budgetData = db.prepare("SELECT SUM(amount) as total FROM initial_budget").get();

        // Total gastos en USD
        const totalUSD = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE currency = 'USD'").get();

        // Total gastos en ARS
        const totalARS = db.prepare("SELECT SUM(amount) as total FROM expenses WHERE currency = 'ARS'").get();

        return {
            initial_budget: budgetData.total ?? 0,
            total_usd: totalUSD.total ?? 0,
            total_ars: totalARS.total ?? 0,
        };
    }
 
}

export default new ExpensesModels();