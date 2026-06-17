export enum RoutePaths {
  root = "/",
  finance = "/finance",
  menu = "/menu",
  calibration = "/calibration",
  createOrder = "/create-order",
  resume = "/resume",
  customers = "/customers",
  costEngine = "/cost-engine",
  stockControl = "/stock-control",
}

export type RouteKey =
  | "home"
  | "finance"
  | "menu"
  | "hall"
  | "customers"
  | "calibration"
  | "costEngine"
  | "stockControl";
