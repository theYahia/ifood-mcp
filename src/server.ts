/**
 * iFood MCP server factory.
 * Kept separate from index.ts so tests can mount the server without
 * triggering the stdio transport.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listOrdersSchema, handleListOrders } from "./tools/list-orders.js";
import { getOrderSchema, handleGetOrder } from "./tools/get-order.js";
import { confirmOrderSchema, handleConfirmOrder } from "./tools/confirm-order.js";
import { dispatchOrderSchema, handleDispatchOrder } from "./tools/dispatch-order.js";
import { cancelOrderSchema, handleCancelOrder } from "./tools/cancel-order.js";
import { listMerchantsSchema, handleListMerchants } from "./tools/list-merchants.js";
import { getMerchantStatusSchema, handleGetMerchantStatus } from "./tools/get-merchant-status.js";
import { updateItemAvailabilitySchema, handleUpdateItemAvailability } from "./tools/update-item-availability.js";
import { registerWebhookSchema, handleRegisterWebhook } from "./tools/register-webhook.js";
import { withErrorHandling } from "./with-error-handling.js";

export const TOOL_COUNT = 9;
export const SERVER_NAME = "ifood-mcp";
export const SERVER_VERSION = "1.1.0";

export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.tool(
    "list_orders",
    "Poll iFood for the latest order events (PLC, CFM, DSP, CAN, CON). " +
      "Returns events emitted since the previous poll; should be called every 30 s in production.",
    listOrdersSchema.shape,
    withErrorHandling(async (params) => ({
      content: [{ type: "text", text: await handleListOrders(params) }],
    })),
  );

  server.tool(
    "get_order",
    "Get the full details of an iFood order (items, customer, totals, delivery, payment).",
    getOrderSchema.shape,
    withErrorHandling(async (params) => ({
      content: [{ type: "text", text: await handleGetOrder(params) }],
    })),
  );

  server.tool(
    "confirm_order",
    "Accept (confirm) a placed iFood order so it enters the kitchen flow.",
    confirmOrderSchema.shape,
    withErrorHandling(async (params) => ({
      content: [{ type: "text", text: await handleConfirmOrder(params) }],
    })),
  );

  server.tool(
    "dispatch_order",
    "Mark an iFood order as DISPATCHED — courier has picked it up and is en route to the customer.",
    dispatchOrderSchema.shape,
    withErrorHandling(async (params) => ({
      content: [{ type: "text", text: await handleDispatchOrder(params) }],
    })),
  );

  server.tool(
    "cancel_order",
    "Request cancellation of an iFood order with a reason and cancellationCode. " +
      "iFood reviews the request before transitioning the order to CANCELLED.",
    cancelOrderSchema.shape,
    withErrorHandling(async (params) => ({
      content: [{ type: "text", text: await handleCancelOrder(params) }],
    })),
  );

  server.tool(
    "list_merchants",
    "List every merchant the authenticated iFood Partner app has access to.",
    listMerchantsSchema.shape,
    withErrorHandling(async (params) => ({
      content: [{ type: "text", text: await handleListMerchants(params) }],
    })),
  );

  server.tool(
    "get_merchant_status",
    "Get the operational status of an iFood merchant (AVAILABLE / UNAVAILABLE / CLOSED).",
    getMerchantStatusSchema.shape,
    withErrorHandling(async (params) => ({
      content: [{ type: "text", text: await handleGetMerchantStatus(params) }],
    })),
  );

  server.tool(
    "update_item_availability",
    "Toggle a single catalog item's availability (AVAILABLE / UNAVAILABLE) without a full menu edit.",
    updateItemAvailabilitySchema.shape,
    withErrorHandling(async (params) => ({
      content: [{ type: "text", text: await handleUpdateItemAvailability(params) }],
    })),
  );

  server.tool(
    "register_webhook",
    "Subscribe a merchant to push events at a public HTTPS URL instead of polling. " +
      "Requires Partner-API webhook approval; falls back to polling if iFood rejects.",
    registerWebhookSchema.shape,
    withErrorHandling(async (params) => ({
      content: [{ type: "text", text: await handleRegisterWebhook(params) }],
    })),
  );

  return server;
}
