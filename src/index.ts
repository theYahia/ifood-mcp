#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { list_ordersSchema, handleListOrders } from "./tools/list-orders.js";
import { get_orderSchema, handleGetOrder } from "./tools/get-order.js";
import { confirm_orderSchema, handleConfirmOrder } from "./tools/confirm-order.js";
import { dispatch_orderSchema, handleDispatchOrder } from "./tools/dispatch-order.js";
import { cancel_orderSchema, handleCancelOrder } from "./tools/cancel-order.js";
import { list_merchantsSchema, handleListMerchants } from "./tools/list-merchants.js";
import { get_merchant_statusSchema, handleGetMerchantStatus } from "./tools/get-merchant-status.js";
import { update_item_availabilitySchema, handleUpdateItemAvailability } from "./tools/update-item-availability.js";

const server = new McpServer({ name: "ifood-mcp", version: "1.0.0" });

server.tool("list_orders", "List recent orders", list_ordersSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleListOrders(params) }] }));
server.tool("get_order", "Get order details", get_orderSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleGetOrder(params) }] }));
server.tool("confirm_order", "Confirm/accept an order", confirm_orderSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleConfirmOrder(params) }] }));
server.tool("dispatch_order", "Mark order as dispatched", dispatch_orderSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleDispatchOrder(params) }] }));
server.tool("cancel_order", "Cancel an order", cancel_orderSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleCancelOrder(params) }] }));
server.tool("list_merchants", "List merchant details", list_merchantsSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleListMerchants(params) }] }));
server.tool("get_merchant_status", "Get merchant availability status", get_merchant_statusSchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleGetMerchantStatus(params) }] }));
server.tool("update_item_availability", "Update menu item availability", update_item_availabilitySchema.shape,
  async (params) => ({ content: [{ type: "text", text: await handleUpdateItemAvailability(params) }] }));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[ifood-mcp] Server started. 8 tools available.");
}

main().catch((error) => { console.error("[ifood-mcp] Error:", error); process.exit(1); });
