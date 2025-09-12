export enum RoutePaths {
  root = "/",
  orders = "/orders",
  products = "/products",
  productsAdd = "/products/add",
  reports = "/reports",
  budget = "/budget",
  menu = "/menu",
  calibration = "/calibration",
  hall = "/hall",
}

export type RouteKey =
  | "home"
  | "orders"
  | "productsRoot"
  | "productsAdd"
  | "reports"
  | "budget"
  | "menu"
  | "hall"
  | "calibration";

