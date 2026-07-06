import { z } from "zod";

export const SYNC_PROTOCOL_VERSION = "v1" as const;

export const syncOperationSchema = z.enum(["upsert", "delete"]);

export const syncMutationSchema = z.object({
  mutation_id: z.string().uuid(),
  entity_type: z.string().min(1).max(80),
  entity_public_id: z.string().uuid(),
  operation: syncOperationSchema,
  source_version: z.number().int().positive(),
  occurred_at: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

export const syncPushRequestSchema = z.object({
  protocol_version: z.literal(SYNC_PROTOCOL_VERSION),
  device_id: z.string().uuid(),
  batch_id: z.string().uuid(),
  mutations: z.array(syncMutationSchema).min(1).max(200),
});

export const rejectedMutationSchema = z.object({
  mutation_id: z.string().uuid(),
  code: z.string(),
  message: z.string(),
  permanent: z.boolean(),
});

export const syncPushResponseSchema = z.object({
  batch_id: z.string().uuid(),
  accepted: z.array(z.string().uuid()),
  duplicates: z.array(z.string().uuid()),
  rejected: z.array(rejectedMutationSchema),
  server_time: z.string(),
});

export type SyncMutation = z.infer<typeof syncMutationSchema>;
export type SyncPushRequest = z.infer<typeof syncPushRequestSchema>;
export type SyncPushResponse = z.infer<typeof syncPushResponseSchema>;

export const replicatedEntities = [
  "payment_methods",
  "menu_category",
  "menu_items",
  "customers",
  "coffees",
  "suppliers",
  "raw_materials",
  "recipes",
  "recipe_ingredients",
  "cost_products",
  "fixed_costs",
  "stock_products",
  "stock_menu_item_map",
  "services",
  "installments",
  "orders",
  "order_items",
  "customer_account_payments",
  "report_expenses",
  "stock_movements",
  "cash_register_shifts",
  "service_payments",
  "installment_payments",
  "price_history",
  "calibrations",
  "cash_register_stock_items",
  "cash_register_stock_item_menu_map",
] as const;

export type ReplicatedEntity = (typeof replicatedEntities)[number];
