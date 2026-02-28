import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import { Suspense } from "react";
import { useRoutes } from "react-router-dom";
import ResumePage from "@/modules/resume";

const MainLayout = lazy(() => import("@/layouts/main-layout"));
const HomePage = lazy(() => import("@/modules/home/index"));
const ReportsPage = lazy(() => import("@/modules/reports/index"));
const MenuPage = lazy(() => import("@/modules/menu/index"));
const CalibrationPage = lazy(() => import("@/modules/calibration/index"));
const OrdersPage = lazy(() => import("@/modules/hall/index"));
const CostEnginePage = lazy(() => import("@/modules/cost-engine/index"));
const StockPage = lazy(() => import("@/modules/stock/index"));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "resume", element: <ResumePage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "menu", element: <MenuPage /> },
      { path: "calibration", element: <CalibrationPage /> },
      { path: "create-order", element: <OrdersPage /> },
      { path: "cost-engine", element: <CostEnginePage /> },
      { path: "stock-control", element: <StockPage /> },
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
