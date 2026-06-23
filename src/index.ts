#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Order module
import { list_ordersSchema, handleListOrders } from "./tools/list-orders.js";
import { acknowledge_eventsSchema, handleAcknowledgeEvents } from "./tools/acknowledge-events.js";
import { get_orderSchema, handleGetOrder } from "./tools/get-order.js";
import { confirm_orderSchema, handleConfirmOrder } from "./tools/confirm-order.js";
import { start_preparationSchema, handleStartPreparation } from "./tools/start-preparation.js";
import { ready_to_pickupSchema, handleReadyToPickup } from "./tools/ready-to-pickup.js";
import { dispatch_orderSchema, handleDispatchOrder } from "./tools/dispatch-order.js";
import { get_cancellation_reasonsSchema, handleGetCancellationReasons } from "./tools/get-cancellation-reasons.js";
import { cancel_orderSchema, handleCancelOrder } from "./tools/cancel-order.js";
// Merchant module
import { list_merchantsSchema, handleListMerchants } from "./tools/list-merchants.js";
import { get_merchantSchema, handleGetMerchant } from "./tools/get-merchant.js";
import { get_merchant_statusSchema, handleGetMerchantStatus } from "./tools/get-merchant-status.js";
import { get_opening_hoursSchema, handleGetOpeningHours } from "./tools/get-opening-hours.js";
import { set_opening_hoursSchema, handleSetOpeningHours } from "./tools/set-opening-hours.js";
import { list_interruptionsSchema, handleListInterruptions } from "./tools/list-interruptions.js";
import { create_interruptionSchema, handleCreateInterruption } from "./tools/create-interruption.js";
import { delete_interruptionSchema, handleDeleteInterruption } from "./tools/delete-interruption.js";
// Catalog module
import { update_item_statusSchema, handleUpdateItemStatus } from "./tools/update-item-status.js";
import { update_item_priceSchema, handleUpdateItemPrice } from "./tools/update-item-price.js";
import { update_option_statusSchema, handleUpdateOptionStatus } from "./tools/update-option-status.js";
import { update_option_priceSchema, handleUpdateOptionPrice } from "./tools/update-option-price.js";
import { list_catalogsSchema, handleListCatalogs } from "./tools/list-catalogs.js";
import { list_categoriesSchema, handleListCategories } from "./tools/list-categories.js";
import { list_items_by_categorySchema, handleListItemsByCategory } from "./tools/list-items-by-category.js";
import { list_productsSchema, handleListProducts } from "./tools/list-products.js";
import { upsert_itemSchema, handleUpsertItem } from "./tools/upsert-item.js";

// Single source of truth for the version (read at runtime to avoid drift with the
// previously-hardcoded "1.0.0"). dist/index.js → ../package.json is the repo root.
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  version: string;
};

const server = new McpServer({ name: "ifood-mcp", version: pkg.version });

// Tool annotation presets. Hints are advisory UX signals for clients (e.g. to warn
// before destructive actions), not a security boundary. Every tool hits an external
// API, so openWorldHint is always true.
type Hints = {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
};
const READ: Hints = { readOnlyHint: true, openWorldHint: true };
const WRITE_IDEMPOTENT: Hints = { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true };
const WRITE_CREATE: Hints = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };
const WRITE_DESTRUCTIVE: Hints = { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true };

let registered = 0;
function reg(
  name: string,
  description: string,
  inputSchema: z.ZodRawShape,
  annotations: Hints,
  handler: (args: any) => Promise<string>,
): void {
  server.registerTool(name, { description, inputSchema, annotations }, async (args: any) => ({
    content: [{ type: "text", text: await handler(args) }],
  }));
  registered++;
}

// ── Order module ──────────────────────────────────────────────────────────────
reg("list_orders", "Poll iFood order events (one GET per ~30s). Returns new events (PLACED/CONFIRMED/...) or none. Each event MUST be passed to acknowledge_events or it is redelivered forever.", list_ordersSchema.shape, READ, handleListOrders);
reg("acknowledge_events", "Acknowledge polled events so iFood stops redelivering them. WARNING: endpoint path is best-guess — verify against live iFood docs.", acknowledge_eventsSchema.shape, WRITE_IDEMPOTENT, handleAcknowledgeEvents);
reg("get_order", "Get full order detail by ID. May 404 briefly right after PLACED — retry with backoff.", get_orderSchema.shape, READ, handleGetOrder);
reg("confirm_order", "Confirm/accept an order (first transition after PLACED; orders auto-cancel if not confirmed in time).", confirm_orderSchema.shape, WRITE_IDEMPOTENT, handleConfirmOrder);
reg("start_preparation", "Mark an order as in preparation (optional, recommended between confirm and dispatch/pickup).", start_preparationSchema.shape, WRITE_IDEMPOTENT, handleStartPreparation);
reg("ready_to_pickup", "Mark an order ready for pickup (REQUIRED for TAKEOUT/DINE_IN).", ready_to_pickupSchema.shape, WRITE_IDEMPOTENT, handleReadyToPickup);
reg("dispatch_order", "Mark a DELIVERY order as dispatched.", dispatch_orderSchema.shape, WRITE_IDEMPOTENT, handleDispatchOrder);
reg("get_cancellation_reasons", "Get valid cancellation codes for an order at its current state (feed into cancel_order).", get_cancellation_reasonsSchema.shape, READ, handleGetCancellationReasons);
reg("cancel_order", "Request cancellation of an order using a code from get_cancellation_reasons. WARNING: request body is best-guess — verify against live iFood docs.", cancel_orderSchema.shape, WRITE_DESTRUCTIVE, handleCancelOrder);

// ── Merchant module ───────────────────────────────────────────────────────────
reg("list_merchants", "List merchants the token can access (paginated; size default 100).", list_merchantsSchema.shape, READ, handleListMerchants);
reg("get_merchant", "Get full detail for one merchant (name, address, operations).", get_merchantSchema.shape, READ, handleGetMerchant);
reg("get_merchant_status", "Get merchant availability per operation/sales-channel (open/closed, reasons).", get_merchant_statusSchema.shape, READ, handleGetMerchantStatus);
reg("get_opening_hours", "Get a merchant's configured weekly opening hours.", get_opening_hoursSchema.shape, READ, handleGetOpeningHours);
reg("set_opening_hours", "Replace a merchant's ENTIRE weekly schedule (days not sent are removed).", set_opening_hoursSchema.shape, WRITE_IDEMPOTENT, handleSetOpeningHours);
reg("list_interruptions", "List active/future store interruptions (temporary pauses).", list_interruptionsSchema.shape, READ, handleListInterruptions);
reg("create_interruption", "Temporarily PAUSE a store for a time window (correct pause mechanism, not opening-hours).", create_interruptionSchema.shape, WRITE_CREATE, handleCreateInterruption);
reg("delete_interruption", "RESUME a store by removing an interruption.", delete_interruptionSchema.shape, WRITE_IDEMPOTENT, handleDeleteInterruption);

// ── Catalog module (v2.0) ─────────────────────────────────────────────────────
reg("update_item_status", "Set a menu item AVAILABLE/UNAVAILABLE.", update_item_statusSchema.shape, WRITE_IDEMPOTENT, handleUpdateItemStatus);
reg("update_item_price", "Update a menu item's price (reais).", update_item_priceSchema.shape, WRITE_IDEMPOTENT, handleUpdateItemPrice);
reg("update_option_status", "Set a complement/option AVAILABLE/UNAVAILABLE.", update_option_statusSchema.shape, WRITE_IDEMPOTENT, handleUpdateOptionStatus);
reg("update_option_price", "Update a complement/option price (reais).", update_option_priceSchema.shape, WRITE_IDEMPOTENT, handleUpdateOptionPrice);
reg("list_catalogs", "List a merchant's catalogs (step 1 of catalog discovery).", list_catalogsSchema.shape, READ, handleListCatalogs);
reg("list_categories", "List categories in a catalog (use include_items=true to get item IDs).", list_categoriesSchema.shape, READ, handleListCategories);
reg("list_items_by_category", "List items/products/options in a category.", list_items_by_categorySchema.shape, READ, handleListItemsByCategory);
reg("list_products", "List catalog products (paginated; response wrapped in `elements`).", list_productsSchema.shape, READ, handleListProducts);
reg("upsert_item", "Create or fully replace an item with its products/optionGroups/options (idempotent).", upsert_itemSchema.shape, WRITE_IDEMPOTENT, handleUpsertItem);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[ifood-mcp] Server started. ${registered} tools available.`);
}

main().catch((error) => {
  console.error("[ifood-mcp] Error:", error);
  process.exit(1);
});
