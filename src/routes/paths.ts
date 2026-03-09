export enum RoutePaths {
  root = "/",
  finance = "/finance",
  menu = "/menu",
  calibration = "/calibration",
  createOrder = "/create-order",
  resume = "/resume",
  costEngine = "/cost-engine",
  stockControl = "/stock-control",
}

export type RouteKey =
  | "home"
  | "finance"
  | "menu"
  | "hall"
  | "calibration"
  | "costEngine"
  | "stockControl";
