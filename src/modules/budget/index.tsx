import { useEffect, useState } from "react";
import ExpensesTable from "./cmp/expenses-table";
import NavButton from "@/components/ui/navButton";
import { AlertTriangle, CircleDollarSign } from "lucide-react";
import { IExpense } from "./types/types";

interface IBudgetRes {
  initial_budget: number;
  total_usd: number;
  total_ars: number;
}

function BudgetPage() {
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [dolarValue, setDolarValue] = useState<string>("");
  const [budgetRes, setBudgetRes] = useState<IBudgetRes>({} as IBudgetRes);

  useEffect(() => {
    fetchExpenses();
    fetchDollarBlueToday();
    fetchTotalBudget();
  }, []);

  const fetchExpenses = () => {
    fetch("http://localhost:3001/api/expenses")
      .then((res) => res.json())
      .then((data) => {
        setExpenses(data);
      });
  };

  const fetchDollarBlueToday = () => {
    fetch("https://dolarapi.com/v1/dolares/blue")
      .then((res) => res.json())
      .then((data) => {
        setDolarValue(data.venta);
      });
  };

  const fetchTotalBudget = () => {
    fetch("http://localhost:3001/api/expenses/total-budget")
      .then((res) => res.json())
      .then((data) => {
        setBudgetRes(data.total);
      });
  };

  const presupuestoActual =
    budgetRes.initial_budget && dolarValue
      ? budgetRes.initial_budget * parseInt(dolarValue) -
        (budgetRes.total_ars + budgetRes.total_usd * parseInt(dolarValue))
      : 0;

  return (
    <main className="flex flex-col w-full min-h-screen bg-[var(--background)] p-6">
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center gap-3 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg p-4 shadow">
          <AlertTriangle className="text-yellow-600" />
          <div>
            <span className="font-semibold text-yellow-800">
              ¡Recordatorio!
            </span>
            <div className="text-yellow-900">
              Pagar cafetera cada cuota{" "}
              <span className="font-bold">$1000 USD</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg p-4 shadow">
          <AlertTriangle className="text-yellow-600" />
          <div>
            <span className="font-semibold text-yellow-800">
              ¡Recordatorio!
            </span>
            <div className="text-yellow-900">
              Pagar la cuota del alquiler
              <span className="font-bold">$724.000 ARS</span>
            </div>
          </div>
        </div>
      </div>
      <section className="w-full max-w-5xl mx-auto mt-8">
        <div className="bg-[var(--card)] dark:bg-[var(--navy)] rounded-2xl shadow-2xl p-8 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-2xl font-bold text-[color:var(--espresso)] dark:text-[color:var(--cream)]">
              Resumen de Presupuesto
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--moss)] dark:text-[var(--cream)]">
                Dólar Blue Hoy:
              </span>
              <span className="text-lg font-bold text-[var(--espresso)] dark:text-yellow-200">
                {dolarValue ? `$${dolarValue}` : "--"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[var(--muted)] pb-2">
                <span className="text-base font-medium text-gray-700 dark:text-gray-200">
                  Presupuesto inicial (ARS)
                </span>
                <span className="text-xl font-bold text-[var(--espresso)] dark:text-[var(--cream)]">
                  {dolarValue && budgetRes.initial_budget
                    ? (
                        budgetRes.initial_budget * parseInt(dolarValue)
                      ).toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        minimumFractionDigits: 2,
                      })
                    : "--"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--muted)] pb-2">
                <span className="text-base font-medium text-gray-700 dark:text-gray-200">
                  Total Gastos en USD
                </span>
                <span className="text-xl font-bold text-[var(--moss)] dark:text-green-300">
                  {budgetRes.total_usd !== undefined
                    ? budgetRes.total_usd.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                      })
                    : "--"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--muted)] pb-2">
                <span className="text-base font-medium text-gray-700 dark:text-gray-200">
                  Total Gastos en ARS
                </span>
                <span className="text-xl font-bold text-[var(--destructive)] dark:text-red-300">
                  {budgetRes.total_ars !== undefined
                    ? budgetRes.total_ars.toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        minimumFractionDigits: 2,
                      })
                    : "--"}
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-center items-center gap-4">
              <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Presupuesto actual (ARS)
              </span>
              <span className="text-3xl font-extrabold text-[color:var(--moss)] dark:text-yellow-200">
                {dolarValue && budgetRes.initial_budget
                  ? presupuestoActual.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                      minimumFractionDigits: 2,
                    })
                  : "--"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-row items-center justify-between mt-10 mb-4 mx-auto w-full max-w-5xl">
        <h3 className="text-xl font-bold text-[color:var(--espresso)] dark:text-[color:var(--cream)]">
          Gastos registrados
        </h3>
        <NavButton
          to="/budget/add"
          label="Agregar Gasto"
          className="max-w-xs"
          icon={<CircleDollarSign />}
        />
      </div>

      <section className="max-w-5xl mx-auto w-full">
        <ExpensesTable expensesList={expenses} />
      </section>
    </main>
  );
}

export default BudgetPage;
