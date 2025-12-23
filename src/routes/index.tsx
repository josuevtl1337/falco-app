import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import ResumePage from "@/modules/resume";

const MainLayout = lazy(() => import("@/layouts/main-layout"));
const HomePage = lazy(() => import("@/modules/home/index"));
// const OrdersPage = lazy(() => import("@/modules/orders/index"));
const ProductsPage = lazy(() => import("@/modules/products/index"));
const AddProduct = lazy(() => import("@/modules/products/pages/add-product"));
const ReportsPage = lazy(() => import("@/modules/reports/index"));
const BudgetPage = lazy(() => import("@/modules/budget/index"));
const AddExpensePage = lazy(() => import("@/modules/budget/pages/add-expense"));
const MenuPage = lazy(() => import("@/modules/menu/index"));
const CalibrationPage = lazy(() => import("@/modules/calibration/index"));
const OrdersPage = lazy(() => import("@/modules/hall/index"));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "resume", element: <ResumePage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "products/add", element: <AddProduct /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "budget", element: <BudgetPage /> },
      { path: "budget/add", element: <AddExpensePage /> },
      { path: "menu", element: <MenuPage /> },
      { path: "calibration", element: <CalibrationPage /> },
      { path: "create-order", element: <OrdersPage /> },
      { path: "*", element: <div className="p-6">No encontrado</div> },
    ],
  },
];

export default function AppRoutes() {
  const element = useRoutes(routes);
  return (
    <Suspense fallback={<div className="p-6">Cargando…</div>}>
      {element}
    </Suspense>
  );
}
