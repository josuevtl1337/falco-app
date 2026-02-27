export enum RoutePaths {
  root = "/",
  reports = "/reports",
  menu = "/menu",
  calibration = "/calibration",
  createOrder = "/create-order",
  resume = "/resume",
  costEngine = "/cost-engine",
}

export type RouteKey =
  | "home"
  | "reports"
  | "menu"
  | "hall"
  | "calibration"
  | "costEngine";
