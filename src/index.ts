#!/usr/bin/env node

/**
 * @theyahia/ifood-mcp — MCP server for iFood Partner / Merchant API (Brazil).
 *
 * 9 tools: list_orders, get_order, confirm_order, dispatch_order, cancel_order,
 * list_merchants, get_merchant_status, update_item_availability, register_webhook.
 *
 * Auth: OAuth 2.0 Client Credentials (IFOOD_CLIENT_ID + IFOOD_CLIENT_SECRET).
 * Transport: stdio.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, SERVER_NAME, TOOL_COUNT } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${SERVER_NAME}] Server started — ${TOOL_COUNT} tools available.`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ifood-mcp] Fatal: ${message}`);
  process.exit(1);
});
