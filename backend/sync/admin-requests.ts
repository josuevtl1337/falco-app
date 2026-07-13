import type Database from "better-sqlite3";
import ReportModel from "../models/ReportModel.ts";
import { StockModel } from "../models/StockModel.ts";
import { syncConfig, validateSyncConfig, type SyncConfig } from "./config.ts";

type Db = Database.Database;

type ExpenseRequest = {
  id: string;
  amount: number;
  category: "servicios" | "proveedores" | "supermercado" | "otros";
  description: string | null;
  expense_date: string;
};

type StockAdjustmentRequest = {
  id: string;
  stock_product_public_id: string;
  stock_product_name: string | null;
  mode: "set" | "delta";
  quantity: number;
  reason: string | null;
  note: string | null;
};

type PullResponse = {
  expense_requests?: ExpenseRequest[];
  stock_adjustment_requests?: StockAdjustmentRequest[];
};

type AdminRequestReceipt = {
  request_type: "expense" | "stock_adjustment";
  request_id: string;
  status: "applied" | "rejected";
  local_public_id: string | null;
  error_message: string | null;
};

export class AdminRequestWorker {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly db: Db,
    private readonly config: SyncConfig = syncConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.ensureReceiptTable();
  }

  start(): void {
    if (!this.config.enabled) return;
    const missing =
      this.config === syncConfig ? validateSyncConfig() : this.validateConfig();
    if (missing.length) return;

    void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), this.config.intervalMs);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async runOnce(): Promise<void> {
    if (!this.config.enabled || this.running) return;
    this.running = true;
    try {
      const requests = await this.pull();
      for (const request of requests.expense_requests ?? []) {
        await this.applyExpense(request);
      }
      for (const request of requests.stock_adjustment_requests ?? []) {
        await this.applyStockAdjustment(request);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("Admin request worker skipped cycle:", message);
    } finally {
      this.running = false;
    }
  }

  private async pull(): Promise<PullResponse> {
    const response = await this.fetchImpl(
      `${this.config.supabaseUrl}/functions/v1/device-pull-requests`,
      {
        method: "GET",
        headers: this.deviceHeaders(),
      },
    );
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 200);
      throw new Error(
        `Admin pull returned ${response.status}${detail ? `: ${detail}` : ""}`,
      );
    }
    return (await response.json()) as PullResponse;
  }

  private async applyExpense(request: ExpenseRequest): Promise<void> {
    const existing = this.receiptFor("expense", request.id);
    if (existing) {
      await this.ack(
        "expense",
        request.id,
        existing.status,
        existing.local_public_id,
        existing.error_message ?? undefined,
      );
      return;
    }

    try {
      const localPublicId = this.db.transaction(() => {
        const result = ReportModel.addExpense({
          amount: Number(request.amount),
          category: request.category,
          description: request.description ?? "",
          date: request.expense_date,
        });
        const publicId = this.publicIdFor(
          "report_expenses",
          Number(result.lastInsertRowid),
        );
        this.saveReceipt("expense", request.id, "applied", publicId);
        return publicId;
      })();
      await this.ack("expense", request.id, "applied", localPublicId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.saveReceipt("expense", request.id, "rejected", null, message);
      await this.ack("expense", request.id, "rejected", null, message);
    }
  }

  private async applyStockAdjustment(
    request: StockAdjustmentRequest,
  ): Promise<void> {
    const existing = this.receiptFor("stock_adjustment", request.id);
    if (existing) {
      await this.ack(
        "stock_adjustment",
        request.id,
        existing.status,
        existing.local_public_id,
        existing.error_message ?? undefined,
      );
      return;
    }

    try {
      const localPublicId = this.db.transaction(() => {
        const product = this.db
          .prepare("SELECT id,current_stock FROM stock_products WHERE public_id = ?")
          .get(request.stock_product_public_id) as
          | { id: number; current_stock: number }
          | undefined;

        if (!product) {
          throw new Error(
            `Producto de stock no encontrado: ${request.stock_product_name ?? request.stock_product_public_id}`,
          );
        }

        const quantity = Number(request.quantity);
        if (!Number.isFinite(quantity)) throw new Error("Cantidad inválida");

        const nextQuantity =
          request.mode === "delta"
            ? Number(product.current_stock) + quantity
            : quantity;
        if (nextQuantity < 0) {
          throw new Error("El ajuste dejaría stock negativo");
        }

        const reason = [
          request.reason || "Ajuste desde dashboard",
          request.note ? `Nota: ${request.note}` : "",
        ]
          .filter(Boolean)
          .join(" · ");

        StockModel.adjustStock(product.id, nextQuantity, reason);
        const movement = this.db
          .prepare(
            `SELECT public_id FROM stock_movements
             WHERE stock_product_id = ?
             ORDER BY id DESC
             LIMIT 1`,
          )
          .get(product.id) as { public_id: string | null } | undefined;
        const publicId = movement?.public_id ?? null;
        this.saveReceipt(
          "stock_adjustment",
          request.id,
          "applied",
          publicId,
        );
        return publicId;
      })();
      await this.ack("stock_adjustment", request.id, "applied", localPublicId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.saveReceipt("stock_adjustment", request.id, "rejected", null, message);
      await this.ack("stock_adjustment", request.id, "rejected", null, message);
    }
  }

  private async ack(
    requestType: "expense" | "stock_adjustment",
    requestId: string,
    status: "applied" | "rejected",
    localPublicId: string | null,
    errorMessage?: string,
  ): Promise<void> {
    const response = await this.fetchImpl(
      `${this.config.supabaseUrl}/functions/v1/device-ack-request`,
      {
        method: "POST",
        headers: {
          ...this.deviceHeaders(),
          "content-type": "application/json",
        },
        body: JSON.stringify({
          request_type: requestType,
          request_id: requestId,
          status,
          local_public_id: localPublicId,
          error_message: errorMessage,
        }),
      },
    );
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 200);
      throw new Error(
        `Admin ack returned ${response.status}${detail ? `: ${detail}` : ""}`,
      );
    }
  }

  private publicIdFor(table: string, id: number): string | null {
    const row = this.db
      .prepare(`SELECT public_id FROM ${table} WHERE id = ?`)
      .get(id) as { public_id: string | null } | undefined;
    return row?.public_id ?? null;
  }

  private ensureReceiptTable(): void {
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS admin_request_receipts (
          request_type TEXT NOT NULL,
          request_id TEXT NOT NULL,
          status TEXT NOT NULL,
          local_public_id TEXT,
          error_message TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (request_type, request_id)
        )`,
      )
      .run();
  }

  private receiptFor(
    requestType: "expense" | "stock_adjustment",
    requestId: string,
  ): AdminRequestReceipt | null {
    return (
      (this.db
        .prepare(
          `SELECT request_type,request_id,status,local_public_id,error_message
           FROM admin_request_receipts
           WHERE request_type = ? AND request_id = ?`,
        )
        .get(requestType, requestId) as AdminRequestReceipt | undefined) ?? null
    );
  }

  private saveReceipt(
    requestType: "expense" | "stock_adjustment",
    requestId: string,
    status: "applied" | "rejected",
    localPublicId: string | null,
    errorMessage = "",
  ): void {
    this.db
      .prepare(
        `INSERT INTO admin_request_receipts
          (request_type, request_id, status, local_public_id, error_message)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(request_type, request_id) DO UPDATE SET
          status = excluded.status,
          local_public_id = excluded.local_public_id,
          error_message = excluded.error_message`,
      )
      .run(
        requestType,
        requestId,
        status,
        localPublicId,
        errorMessage ? errorMessage.slice(0, 500) : null,
      );
  }

  private deviceHeaders(): Record<string, string> {
    return {
      apikey: this.config.publishableKey,
      "x-device-id": this.config.deviceId,
      "x-device-secret": this.config.deviceSecret,
    };
  }

  private validateConfig(): string[] {
    return (
      [
        ["SUPABASE_URL", this.config.supabaseUrl],
        ["SUPABASE_PUBLISHABLE_KEY", this.config.publishableKey],
        ["FALCO_DEVICE_ID", this.config.deviceId],
        ["FALCO_DEVICE_SECRET", this.config.deviceSecret],
      ] as const
    )
      .filter(([, value]) => !value)
      .map(([name]) => name);
  }
}
